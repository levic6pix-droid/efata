const express = require('express');
const supabase = require('../config/supabase');
const { emitSystemUpdate } = require('../config/socket');
const whatsappService = require('../services/whatsapp-service');
const mpService = require('../services/mercadopago-service');

// Tentativa de carregar escpos
let escpos = null;
let USB = null;
try {
  escpos = require('escpos');
  USB = require('escpos-usb');
  escpos.USB = USB;
} catch (e) {
  console.warn('[PDV] escpos não pôde ser carregado. Impressão USB desativada.');
}

const router = express.Router();

// ─── CAIXA: Abertura ──────────────────────────────────────────
router.post('/caixa/abrir', async (req, res) => {
  const { saldo_inicial } = req.body;
  try {
    // Verifica se já existe caixa aberto
    const { data: aberto } = await supabase.from('caixa').select('id').eq('status', 'aberto').maybeSingle();
    if (aberto) return res.status(400).json({ error: 'Já existe um caixa aberto.' });

    const { data, error } = await supabase
      .from('caixa')
      .insert([{ saldo_inicial: Number(saldo_inicial || 0), status: 'aberto' }])
      .select().single();
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CAIXA: Fechamento ────────────────────────────────────────
router.post('/caixa/fechar', async (req, res) => {
  try {
    const { data: aberto } = await supabase.from('caixa').select('*').eq('status', 'aberto').maybeSingle();
    if (!aberto) return res.status(400).json({ error: 'Não há caixa aberto.' });

    // Calcula saldo final (vendas do turno)
    const { data: vendas } = await supabase.from('vendas').select('total').eq('caixa_id', aberto.id);
    const totalVendas = vendas?.reduce((s, v) => s + Number(v.total), 0) || 0;
    const saldoFinal = Number(aberto.saldo_inicial) + totalVendas;

    const { data, error } = await supabase
      .from('caixa')
      .update({ status: 'fechado', fechado_em: new Date().toISOString(), saldo_final: saldoFinal })
      .eq('id', aberto.id)
      .select().single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CAIXA: Status Atual ──────────────────────────────────────
router.get('/caixa/status', async (req, res) => {
  try {
    const { data } = await supabase.from('caixa').select('*').eq('status', 'aberto').maybeSingle();
    res.json(data || { status: 'fechado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Finalizar venda PDV ──────────────────────────────────────
router.post('/pdv/finalizar', async (req, res) => {
  const { itens, pagamento, troco, clienteId, tipo_pedido } = req.body;
  if (!itens?.length) return res.status(400).json({ error: 'Carrinho vazio.' });

  try {
    const { data: caixa } = await supabase.from('caixa').select('id').eq('status', 'aberto').maybeSingle();
    const total = itens.reduce((s, i) => s + Number(i.preco) * Number(i.quantidade), 0);

    // 1. Registrar Venda
    const { data: venda, error: errV } = await supabase
      .from('vendas')
      .insert([{ total, pagamento, origem: 'PDV', caixa_id: caixa?.id || null }])
      .select().single();
    if (errV) throw errV;

    // 2. Itens da venda
    const itensInsert = itens.map(i => ({
      venda_id: venda.id,
      produto_id: i.produto_id || i.id || null,
      nome: i.nome,
      quantidade: Number(i.quantidade),
      preco: Number(i.preco)
    }));
    await supabase.from('venda_itens').insert(itensInsert);

    // 3. Baixa de estoque
    for (const item of itens) {
      const prodId = item.produto_id || item.id;
      if (!prodId) continue;
      const { data: prod } = await supabase.from('produtos').select('estoque').eq('id', prodId).maybeSingle();
      if (prod) {
        const novo = Math.max(0, prod.estoque - Number(item.quantidade));
        await supabase.from('produtos').update({ estoque: novo }).eq('id', prodId);
      }
    }

    // 4. Fluxo de Cliente / Delivery
    let clienteFull = null;
    let pixData = null;
    
    if (clienteId) {
      const { data: cli } = await supabase.from('clientes').select('*').eq('id', clienteId).maybeSingle();
      clienteFull = cli;

      // Se for PIX, tentar Mercado Pago primeiro, se falhar usar Estático (Manual)
      if (pagamento.toLowerCase().includes('pix')) {
        try {
          if (process.env.MP_ACCESS_TOKEN && !process.env.MP_ACCESS_TOKEN.includes('seu-token')) {
            pixData = await mpService.criarPagamentoPix({
              id: null,
              total: total,
              nome: clienteFull?.nome || 'Cliente',
              email: clienteFull?.email || 'cliente@delivery.com',
            });
          }
        } catch (mpErr) {
          console.warn('[MP] Erro ao criar PIX Dinâmico, usando Estático:', mpErr.message);
        }

        // Fallback para PIX Estático (Manual) se MP falhar ou não estiver configurado
        if (!pixData) {
          const settingsService = require('../services/settings-service');
          const settings = await settingsService.getSettings();
          const cp = settings.companyProfile || {};
          const pixKey = cp.pixKey || cp.documento;

          if (pixKey) {
            const chatbotService = require('../services/chatbot-service');
            const payload = chatbotService.buildPix(pixKey, total, cp.nomeFantasia || 'EFATA DELIVERY', cp.cidade || 'SAO PAULO');
            const qrImage = await QRCode.toDataURL(payload, { width: 400, margin: 2 });
            
            pixData = {
              id: 'STATIC',
              qr_code: payload, // copia e cola
              qr_code_base64: qrImage,
              isStatic: true
            };
          }
        }
      }

      const { data: pedido } = await supabase.from('pedidos').insert([{
        cliente_id: clienteId, 
        status: pagamento.toLowerCase().includes('pix') ? 'pendente' : 'preparo', 
        total,
        origem: 'PDV', 
        tipo_pedido: tipo_pedido || 'RETIRADA', 
        forma_pagamento: pagamento,
        payment_id: pixData?.id || null,
        pago: false
      }]).select().single();
      
      if (pedido) {
        await supabase.from('itens_pedido').insert(
          itens.map(i => ({ pedido_id: pedido.id, produto_id: i.produto_id || i.id, quantidade: i.quantidade, preco: i.preco }))
        );

        // ENVIAR WHATSAPP AUTOMÁTICO (PRO)
        if (whatsappService.isReady && clienteFull) {
          const cod = pedido.id.toString().slice(-6).toUpperCase();
          
          if (pixData) {
            const chatbotService = require('../services/chatbot-service');
            const settingsService = require('../services/settings-service');
            const settings = await settingsService.getSettings();
            const cp = settings.companyProfile || {};

            // Gera o PDF profissional
            const pdfBuffer = await chatbotService.gerarPixPDF({
              payload: pixData.qr_code,
              amount: total,
              storeName: cp.nomeFantasia || 'EFATA DELIVERY',
              orderId: cod,
              cnpj: cp.cnpj || cp.documento || '',
              endereco: cp.endereco || '',
              carrinho: itens,
              clienteNome: clienteFull.nome,
              formaPagamento: pagamento
            });

            // Envia via fluxo profissional multi-step
            const response = {
              text: `✅ *Pedido #${cod} confirmado!* 🎉\n\n💰 *Total: R$ ${total.toFixed(2)}*\n\n💚 *Pagamento via PIX* — Estou enviando os dados agora! 👇`,
              pixCopiaECola: pixData.qr_code,
              pixValor: `R$ ${total.toFixed(2)}`,
              media: pixData.qr_code_base64,
              pdf: pdfBuffer,
              pdfName: `PIX-PEDIDO-${cod}.pdf`,
              pixFinalMsg: `Após realizar o pagamento, por favor, envie o comprovante para validarmos seu pedido! ✅`
            };

            // Dispara as mensagens sequenciais (reutilizando a lógica do whatsapp-service)
            const chatObj = { from: `${clienteFull.telefone.replace(/\D/g, '')}@c.us` };
            // Simula o processamento de resposta para usar os delays
            // Nota: Como estamos no backend, chamamos os métodos do whatsappService diretamente
            await whatsappService.client.sendMessage(chatObj.from, response.text);
            await whatsappService._delay(500);
            await whatsappService.client.sendMessage(chatObj.from, `🔑 *Chave PIX Copia e Cola:*\n\n${response.pixCopiaECola}`);
            await whatsappService._delay(500);
            
            const qrMedia = MessageMedia.fromDataURL(response.media);
            await whatsappService.client.sendMessage(chatObj.from, qrMedia, { caption: '📱 QR Code PIX' });
            await whatsappService._delay(500);

            const pdfMedia = new MessageMedia('application/pdf', response.pdf.toString('base64'), response.pdfName);
            await whatsappService.client.sendMessage(chatObj.from, pdfMedia);
            await whatsappService._delay(500);

            await whatsappService.client.sendMessage(chatObj.from, response.pixFinalMsg);
          } else {
            // Fluxo normal (Dinheiro/Cartão)
            whatsappService.enviarPedidoDelivery({
              nome: clienteFull.nome,
              telefone: clienteFull.telefone,
              itens: itens,
              total: total,
              endereco: clienteFull.endereco || clienteFull.rua || 'Retirada no Balcão',
              pagamento: pagamento
            });
          }
        }
      }
    }

    // 5. IMPRESSÃO AUTOMÁTICA PROFISSIONAL
    if (escpos && USB) {
      try {
        const device = new escpos.USB();
        const printer = new escpos.Printer(device);
        device.open((err) => {
          if (!err) {
            const isDelivery = tipo_pedido === 'ENTREGA';
            printer
              .font('a').align('ct').style('bu').size(1, 1).text('EFATA DELIVERY')
              .text('--------------------------------')
              .size(0, 0).text(isDelivery ? '*** PEDIDO DELIVERY ***' : '*** PEDIDO BALCÃO ***')
              .text('--------------------------------')
              .align('lt').style('normal');
            
            if (clienteFull) {
              printer.text(`CLIENTE: ${clienteFull.nome.toUpperCase()}`);
              printer.text(`FONE: ${clienteFull.telefone}`);
              if (isDelivery) {
                printer.text(`END: ${clienteFull.endereco || clienteFull.rua || ''}`);
                if (clienteFull.numero) printer.text(`NUM: ${clienteFull.numero}`);
                if (clienteFull.bairro) printer.text(`BAIRRO: ${clienteFull.bairro}`);
              }
              printer.text('--------------------------------');
            }

            printer.text('ITENS:');
            itens.forEach(i => {
              printer.text(`${i.nome.substring(0, 20)} x${i.quantidade} - R$${(i.preco * i.quantidade).toFixed(2)}`);
            });

            printer
              .text('--------------------------------')
              .align('ct').style('b').size(1, 1).text(`TOTAL: R$ ${total.toFixed(2)}`)
              .size(0, 0).text(`PAGAMENTO: ${pagamento.toUpperCase()}`)
              .text('--------------------------------')
              .text('Tempo estimado: 30-40 min')
              .text('Obrigado pela preferência!')
              .feed(2).cut().close();
          }
        });
      } catch (printErr) {
        if (!printErr.message.includes('Can not find printer')) {
          console.warn('[PDV] Erro na impressora:', printErr.message);
        }
      }
    }

    emitSystemUpdate('dados_atualizados', null);
    res.json({ ok: true, venda });
  } catch (err) {
    console.error('[PDV] Erro ao finalizar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Relatório do dia ─────────────────────────────────────────
router.get('/pdv/relatorio', async (req, res) => {
  const { data: dia } = req.query;
  const inicio = dia ? `${dia}T00:00:00` : new Date(new Date().setHours(0,0,0,0)).toISOString();
  const fim    = dia ? `${dia}T23:59:59` : new Date(new Date().setHours(23,59,59,0)).toISOString();

  try {
    const { data: vendas } = await supabase
      .from('vendas')
      .select('id, total, pagamento, criado_em, venda_itens(nome, quantidade, preco)')
      .gte('criado_em', inicio).lte('criado_em', fim)
      .order('criado_em', { ascending: false });

    const totais = { total: 0, dinheiro: 0, pix: 0, cartao: 0, qtdVendas: vendas?.length || 0 };
    for (const v of (vendas || [])) {
      totais.total += Number(v.total);
      const p = (v.pagamento || '').toLowerCase();
      if (p.includes('pix')) totais.pix += Number(v.total);
      else if (p.includes('dinheiro')) totais.dinheiro += Number(v.total);
      else totais.cartao += Number(v.total);
    }

    res.json({ vendas: vendas || [], totais });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Sangria / Suprimento (Movimentação manual) ─────────────
router.post('/pdv/movimentacao', async (req, res) => {
  const { tipo, valor, descricao } = req.body; // tipo: 'sangria' | 'suprimento'
  try {
    const { data: caixa } = await supabase.from('caixa').select('id').eq('status', 'aberto').maybeSingle();
    if (!caixa) return res.status(400).json({ error: 'Caixa fechado. Abra o caixa primeiro.' });

    // Salva na tabela de vendas com total negativo se for sangria (para o relatório)
    const total = tipo === 'sangria' ? -Math.abs(valor) : Math.abs(valor);
    const { data, error } = await supabase
      .from('vendas')
      .insert([{ 
        total, 
        pagamento: 'DINHEIRO', 
        origem: tipo.toUpperCase(), 
        caixa_id: caixa.id,
        operador: descricao || tipo 
      }])
      .select().single();

    if (error) throw error;
    emitSystemUpdate('dados_atualizados', null);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
