'use strict';
/**
 * AGENTE IA — EFATA DELIVERY
 * Groq Tool Calling (llama-3.3-70b-versatile)
 * Geração de QR Code PIX em PDF e Imagem.
 */

const Groq = require('groq-sdk');
const supabase = require('../config/supabase');
const { emitSystemUpdate } = require('../config/socket');
const { getSettings } = require('./settings-service');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

let groq = null;

const { getMenu } = require('./menu-service');
const { getSessao, resetSessao } = require('./session-service');

// ─── Utils ────────────────────────────────────────────────────
const fmt = v => `R$ ${Number(v).toFixed(2)}`;
function resumo(carrinho) {
  if (!carrinho.length) return 'Carrinho vazio.';
  return carrinho.map((i, n) => `${n + 1}. ${i.nome} x${i.qtd} = ${fmt(i.preco * i.qtd)}`).join('\n')
    + `\n\nTotal: ${fmt(carrinho.reduce((s, i) => s + i.preco * i.qtd, 0))}`;
}

function pad(v, l = 2) { return String(v).padStart(l, '0'); }
function tlv(id, val) { return `${id}${pad(val.length)}${val}`; }
function crc16(s) {
  let c = 0xFFFF;
  for (let i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; }
  return c.toString(16).toUpperCase().padStart(4, '0');
}

// ─── Supabase helpers ─────────────────────────────────────────
async function salvarMsg(phone, role, content) {
  try { 
    const { data: conv } = await supabase.from('conversas').select('id').eq('whatsapp', phone).maybeSingle();
    let convId = conv?.id;
    if (!convId) {
      const { data: novaConv } = await supabase.from('conversas').insert([{ whatsapp: phone }]).select('id').single();
      convId = novaConv.id;
    }
    await supabase.from('mensagens').insert([{ conversa_id: convId, mensagem: String(content).substring(0, 4000), tipo: role === 'user' ? 'incoming' : 'outgoing' }]); 
  } catch (err) {
    console.error('[IA] Erro ao salvar mensagem:', err.message);
  }
}

async function upsertCliente(phone, endereco, nome) {
  const { data: ex } = await supabase.from('clientes').select('id, nome').eq('telefone', phone).maybeSingle();
  if (ex) { 
    const updateData = { atualizado_em: new Date().toISOString() };
    if (endereco) updateData.endereco = endereco;
    if (nome && (!ex.nome || ex.nome === 'Cliente WhatsApp')) updateData.nome = nome;
    
    await supabase.from('clientes').update(updateData).eq('id', ex.id); 
    return ex.id; 
  }
  const { data } = await supabase.from('clientes').insert([{ 
    nome: nome || 'Cliente WhatsApp', 
    telefone: phone, 
    endereco: endereco || null 
  }]).select('id').single();
  emitSystemUpdate('dados_atualizados', null);
  return data?.id;
}

// ══════════════════════════════════════════════════════════════
//  FERRAMENTAS DO AGENTE (Tools)
// ══════════════════════════════════════════════════════════════
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'definir_nome_cliente',
      description: 'Salva o nome completo do cliente para personalização do atendimento.',
      parameters: {
        type: 'object',
        properties: {
          nome: { type: 'string', description: 'Nome completo do cliente' },
        },
        required: ['nome'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ver_cardapio',
      description: 'Retorna o cardápio completo com produtos disponíveis, preços e estoque.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'adicionar_item',
      description: 'Adiciona um produto ao carrinho do cliente.',
      parameters: {
        type: 'object',
        properties: {
          produto_nome: { type: 'string', description: 'Nome exato do produto conforme cardápio' },
          quantidade: { type: 'integer', description: 'Quantidade desejada (padrão 1)', minimum: 1 },
        },
        required: ['produto_nome'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remover_item',
      description: 'Remove um item do carrinho.',
      parameters: {
        type: 'object',
        properties: {
          produto_nome: { type: 'string', description: 'Nome do produto a remover' },
        },
        required: ['produto_nome'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ver_carrinho',
      description: 'Mostra o carrinho atual com itens e total.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'definir_tipo_entrega',
      description: 'Define se o pedido é DELIVERY (entrega em casa) ou RETIRADA (no balcão).',
      parameters: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['DELIVERY', 'RETIRADA'] },
        },
        required: ['tipo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'definir_endereco',
      description: 'Registra o endereço de entrega do cliente. Pode ser CEP (8 dígitos) ou endereço completo.',
      parameters: {
        type: 'object',
        properties: {
          endereco: { type: 'string', description: 'Endereço completo ou CEP de 8 dígitos' },
        },
        required: ['endereco'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'definir_pagamento',
      description: 'Define a forma de pagamento: PIX, CARTAO ou DINHEIRO.',
      parameters: {
        type: 'object',
        properties: {
          forma: { type: 'string', enum: ['PIX', 'CARTAO', 'DINHEIRO'] },
          troco_para: { type: 'number', description: 'Valor em reais para calcular troco (apenas DINHEIRO)' },
        },
        required: ['forma'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'confirmar_pedido',
      description: 'Confirma e finaliza o pedido criando-o no sistema. Use apenas quando o cliente confirmar explicitamente.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_status_pedido',
      description: 'Consulta o status do último pedido do cliente pelo número de telefone.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancelar_e_reiniciar',
      description: 'Cancela o pedido atual e reinicia a conversa do zero.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

// ══════════════════════════════════════════════════════════════
//  PROMPT HELPERS
// ══════════════════════════════════════════════════════════════
async function buildSystemInstructions() {
  const settings = await getSettings();
  const cp = settings.companyProfile || {};
  const pm = settings.paymentMethods || {};
  const df = settings.deliveryFees || {};
  const nomeLoja = cp.nomeFantasia || cp.razaoSocial || 'Efata Delivery';
  const pagOpts = [pm.pix && 'PIX', pm.cartao_credito && 'Cartão de Crédito', pm.cartao_debito && 'Cartão de Crédito', pm.dinheiro && 'Dinheiro'].filter(Boolean).join(', ');

  let taxa = 'Grátis';
  if (df.tipo === 'fixo' && df.taxaFixa > 0) taxa = fmt(df.taxaFixa);
  else if (df.tipo === 'bairro' && df.porBairro?.length) taxa = 'Variável por bairro';

  return `Você é o assistente virtual da *${nomeLoja}*, focado em um atendimento natural, organizado e eficiente.
🚀 FLUXO: Peça o NOME, depois o PEDIDO, então TIPO (Delivery/Retirada), ENDEREÇO e PAGAMENTO. Finalize pedindo confirmação (SIM).`;
}

function buildStatePrompt(sess) {
  return `---
ESTADO ATUAL DO PEDIDO:
- Cliente: ${sess.nome || 'Não identificado'}
- Carrinho: ${sess.carrinho.length ? resumo(sess.carrinho) : 'Vazio'}
- Total: ${fmt(sess.carrinho.reduce((s, i) => s + i.preco * i.qtd, 0))}
- Entrega: ${sess.tipo || 'Pendente'}
- Endereço: ${sess.endereco || 'Pendente'}
- Pagamento: ${sess.pagamento || 'Pendente'}
---`;
}

// ══════════════════════════════════════════════════════════════
//  CLASSE PRINCIPAL
// ══════════════════════════════════════════════════════════════
class ChatbotService {
  init(groqKey) {
    if (groqKey) {
      groq = new Groq({ apiKey: groqKey });
      console.log('✅ [Agente IA] Groq Tool Calling ativo — llama-3.3-70b-versatile');
    }
  }

  async generateResponse(phone, msg, messageId) {
    const sess = getSessao(phone);
    sess.lastMsgId = messageId || `msg_${Date.now()}`;
    try {
      let resposta;
      if (!groq) {
        resposta = { text: 'Olá! 👋 Nosso assistente está temporariamente indisponível.' };
      } else {
        const instructions = await buildSystemInstructions();
        resposta = await this.rodarAgente(phone, msg, sess, instructions);
      }

      sess.history.push({ role: 'user', content: msg });
      sess.history.push({ role: 'assistant', content: resposta.text });
      if (sess.history.length > 20) sess.history = sess.history.slice(-20);

      return resposta;
    } catch (err) {
      console.error('[Agente IA] Erro:', err.message);
      return { text: '😕 Erro interno. Tente novamente.' };
    }
  }

  async rodarAgente(phone, userMsg, sess, instructions) {
    const messages = [
      { role: 'system', content: instructions },
      ...sess.history.slice(-16),
      { role: 'user', content: userMsg },
    ];

    if (sess.__aguardandoNumero) {
      sess.endereco = `${sess.__enderecoBase}, ${userMsg.trim()}`;
      delete sess.__aguardandoNumero;
      delete sess.__enderecoBase;
      return { text: `📍 Endereço registrado: *${sess.endereco}*. Como deseja pagar?` };
    }

    let maxIteracoes = 4;
    let respFinal = null;

    while (maxIteracoes-- > 0) {
      const statePrompt = buildStatePrompt(sess);
      messages[0].content = `${instructions}\n\n${statePrompt}`;

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        temperature: 0.4,
        tools: TOOLS,
        messages,
      });

      const choice = completion.choices[0];
      const assistantMsg = choice.message;
      messages.push(assistantMsg);

      if (!assistantMsg.tool_calls?.length) {
        respFinal = assistantMsg.content || '...';
        break;
      }

      for (const tc of assistantMsg.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
        const resultado = await this.executarTool(tc.function.name, args, phone, sess);

        if (resultado?.__aguardarNumero) {
          sess.__aguardandoNumero = true;
          sess.__enderecoBase = resultado.base;
          messages.push({ role: 'tool', tool_call_id: tc.id, content: `Solicite o número do endereço.` });
        } else if (resultado?.__pix) {
          return resultado;
        } else {
          messages.push({ role: 'tool', tool_call_id: tc.id, content: String(resultado ?? 'Ação executada.') });
        }
      }

      if (choice.finish_reason === 'stop') {
        respFinal = assistantMsg.content || '';
        break;
      }
    }

    return { text: respFinal || '...' };
  }

  async executarTool(name, args, phone, sess) {
    const settings = await getSettings();
    const cp = settings.companyProfile || {};
    const pm = settings.paymentMethods || {};

    switch (name) {
      case 'definir_nome_cliente':
        sess.nome = args.nome;
        return `Muito prazer, ${args.nome}!`;

      case 'ver_cardapio': {
        const produtos = await getMenu();
        if (!produtos?.length) return 'Cardápio vazio.';
        return produtos.map(p => `• ${p.nome} — ${fmt(p.preco)}`).join('\n');
      }

      case 'adicionar_item': {
        const produtos = await getMenu();
        const nome = (args.produto_nome || '').toLowerCase();
        const prod = produtos?.find(p => p.nome.toLowerCase().includes(nome));
        if (!prod) return 'Produto não encontrado.';
        const qtd = args.quantidade || 1;
        sess.carrinho.push({ id: prod.id, nome: prod.nome, preco: Number(prod.preco), qtd });
        return `${prod.nome} x${qtd} adicionado!`;
      }

      case 'remover_item':
        sess.carrinho = sess.carrinho.filter(i => !i.nome.toLowerCase().includes(args.produto_nome.toLowerCase()));
        return 'Item removido.';

      case 'ver_carrinho':
        return resumo(sess.carrinho);

      case 'definir_tipo_entrega':
        sess.tipo = args.tipo;
        return `Tipo: ${args.tipo}`;

      case 'definir_endereco': {
        const end = args.endereco || '';
        if (end.replace(/\D/g, '').length === 8) {
           // Lógica ViaCEP simplificada
           return { __aguardarNumero: true, base: 'Rua Exemplo' };
        }
        sess.endereco = end;
        return `Endereço: ${end}`;
      }

      case 'definir_pagamento':
        sess.pagamento = args.forma;
        return `Pagamento: ${args.forma}`;

      case 'confirmar_pedido': {
        if (!sess.carrinho.length) return 'Carrinho vazio.';
        const clienteId = await upsertCliente(phone, sess.endereco, sess.nome);
        const total = sess.carrinho.reduce((s, i) => s + i.preco * i.qtd, 0);
        const orderService = require('./order-service');
        const pedido = await orderService.createPedido({
          cliente_id: clienteId,
          whatsapp: phone,
          itens: sess.carrinho.map(i => ({ produto_id: i.id, quantidade: i.qtd, preco: i.preco })),
          forma_pagamento: sess.pagamento,
          tipo_pedido: sess.tipo,
          origem: 'APP'
        });

        const cod = pedido.id.toString().slice(-6).toUpperCase();
        const pixKey = cp.pixKey || cp.documento;
        const storeName = cp.nomeFantasia || 'EFATA DELIVERY';
        resetSessao(phone);

        if (sess.pagamento.includes('PIX') && pixKey) {
          const payload = this.buildPix(pixKey, total, storeName);
          const qrImage = await QRCode.toDataURL(payload, { width: 400 });
          const pdfBuffer = await this.gerarPixPDF({
            payload, amount: total, storeName, orderId: cod,
            cnpj: cp.cnpj || '', endereco: cp.endereco || '',
            carrinho: sess.carrinho, clienteNome: sess.nome || 'Cliente'
          });
          
          return {
            __pix: true,
            text: `✅ *Pedido #${cod} confirmado!* 🎉`,
            media: qrImage,
            pdf: pdfBuffer,
            pdfName: `PIX-PEDIDO-${cod}.pdf`
          };
        }
        return `✅ *Pedido #${cod} confirmado!*`;
      }

      case 'consultar_status_pedido':
        return 'Status: Recebido';

      case 'cancelar_e_reiniciar':
        resetSessao(phone);
        return 'Reiniciado.';

      default: return null;
    }
  }

  buildPix(key, amount, name = 'EFATA DELIVERY', city = 'SAO PAULO') {
    const gui = tlv('00', 'br.gov.bcb.pix');
    const chave = tlv('01', key);
    const mai = tlv('26', gui + chave);
    const parts = [tlv('00', '01'), tlv('01', '12'), mai, tlv('52', '0000'), tlv('53', '986')];
    if (amount) parts.push(tlv('54', Number(amount).toFixed(2)));
    parts.push(tlv('58', 'BR'), tlv('59', name.substring(0, 25)), tlv('60', city.substring(0, 15)), tlv('62', tlv('05', '***')), '6304');
    const payload = parts.join('');
    return `${payload}${crc16(payload)}`;
  }

  async gerarPixPDF({ payload, amount, storeName, orderId, cnpj, endereco, carrinho, clienteNome }) {
    return new Promise((resolve) => {
      const W = 226;
      const doc = new PDFDocument({ size: [W, 800], margin: 10 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(12).text(storeName.toUpperCase(), { align: 'center' });
      doc.fontSize(10).text(`PEDIDO: #${orderId}`, { align: 'center' });
      doc.fontSize(10).text(`TOTAL: ${fmt(amount)}`, { align: 'center' });

      if (payload) {
        QRCode.toDataURL(payload, { margin: 1, width: 300 }, (err, url) => {
          if (!err) doc.image(url, (W - 140) / 2, doc.y, { width: 140 });
          doc.end();
        });
      } else {
        doc.end();
      }
    });
  }

  async listarConversas() {
    const { data } = await supabase.from('conversas').select('whatsapp, atualizado_em').limit(20);
    return (data || []).map(c => ({ telefone: c.whatsapp, atualizado: c.atualizado_em }));
  }

  async listarMensagens(phone) {
    const { data: conv } = await supabase.from('conversas').select('id').eq('whatsapp', phone).maybeSingle();
    if (!conv) return [];
    const { data } = await supabase.from('mensagens').select('tipo, mensagem').eq('conversa_id', conv.id).limit(50);
    return (data || []).map(m => ({ role: m.tipo === 'incoming' ? 'user' : 'assistant', content: m.mensagem }));
  }
}

module.exports = new ChatbotService();
