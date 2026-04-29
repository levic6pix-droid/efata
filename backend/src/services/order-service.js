const supabase = require('../config/supabase');
const { ORDER_STATUS } = require('../constants');
const { emitSystemUpdate } = require('../config/socket');
const { HttpError } = require('../utils/http-error');
const { mapPedido } = require('../utils/order-mapper');
const whatsappService = require('./whatsapp-service');

const listPedidos = async () => {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, cliente:clientes(*), entregador:entregadores(*), itens:itens_pedido(*, produto:produtos(*))')
    .order('criado_em', { ascending: false });

  if (error) {
    console.error('Erro ao listar pedidos do Supabase:', error);
    return [];
  }

  // Mapeamento para manter compatibilidade com o frontend
  return data.map(p => ({
    ...p,
    clienteId: p.cliente_id,
    entregadorId: p.entregador_id,
    formaPagamento: p.forma_pagamento,
    tipoPedido: p.tipo_pedido,
    createdAt: p.criado_em,
    itens: p.itens.map(i => ({
      ...i,
      produtoId: i.produto_id
    }))
  }));
};

const createPedido = async ({ cliente_id, cliente, itens, forma_pagamento, origem = 'APP', entrega_imediata = false, whatsapp, external_id }) => {
  // 🛡️ ANTI-DUPLICAÇÃO: Verifica se o external_id já existe
  if (external_id) {
    const { data: existing } = await supabase.from('pedidos').select('id').eq('external_id', external_id).maybeSingle();
    if (existing) {
      console.log(`[Pedido] Pedido duplicado ignorado: ${external_id}`);
      return null;
    }
  }

  let status = 'recebido'; // Valor do ENUM status_pedido
  let tipoPedido = 'DELIVERY'; // Valor do ENUM tipo_pedido

  if (origem === 'PDV') {
    status = entrega_imediata ? 'finalizado' : 'preparo';
    tipoPedido = 'RETIRADA';
  }

  let total = 0;
  itens.forEach(i => { total += (i.preco || 0) * i.quantidade; });

  const { data: novoPedido, error: errPed } = await supabase
    .from('pedidos')
    .insert([{
      cliente_id,
      status,
      total: Number(total.toFixed(2)),
      forma_pagamento,
      tipo_pedido: tipoPedido,
      origem,
      whatsapp,
      external_id
    }])
    .select('*, cliente:clientes(*), entregador:entregadores(*), itens:itens_pedido(*, produto:produtos(*))')
    .single();

  if (errPed) throw errPed;

  // Inserir itens e decrementar estoque
  const itensParaInserir = [];
  for (const i of itens) {
    itensParaInserir.push({
      pedido_id: novoPedido.id,
      produto_id: i.produto_id,
      quantidade: i.quantidade,
      preco: i.preco || 0
    });

    // Baixa automática no estoque
    const { data: prodData } = await supabase.from('produtos').select('estoque').eq('id', i.produto_id).single();
    if (prodData) {
      await supabase.from('produtos').update({ estoque: Math.max(0, prodData.estoque - i.quantidade) }).eq('id', i.produto_id);
    }
  }

  await supabase.from('itens_pedido').insert(itensParaInserir);

  // 🔔 NOTIFICAÇÃO GLOBAL: Novo pedido para a cozinha/painel
  emitSystemUpdate('novo_pedido', novoPedido);
  emitSystemUpdate('dados_atualizados', { tipo: 'pedido', id: novoPedido.id });

  // Lançamento automático no Financeiro (Vendas) se já começar como finalizado
  if (status === 'finalizado') {
    await registrarVendaNoCaixa(novoPedido);
  }

  return novoPedido;
};

const updatePedidoStatus = async (id, status) => {
  // Normalise and validate status against defined enum values
  const normalizedStatus = String(status).toLowerCase();
  const allowedStatuses = Object.values(require('../constants').ORDER_STATUS);
  if (!allowedStatuses.includes(normalizedStatus)) {
    // Throw a clear HTTP error instead of letting the DB raise a PG enum error
    const { HttpError } = require('../utils/http-error');
    throw new HttpError(400, `Invalid order status '${status}'. Allowed values: ${allowedStatuses.join(', ')}`);
  }

  const { data, error } = await supabase
    .from('pedidos')
    .update({ status: normalizedStatus })
    .eq('id', id)
    .select('*, cliente:clientes(*), entregador:entregadores(*), itens:itens_pedido(*, produto:produtos(*))')
    .single();

  if (error) throw error;
  
  // 🔔 SINCRONIZAÇÃO FINANCEIRA (INTEGRAÇÃO COMPLETA)
  // Agora todos os processos são iguais: ao finalizar qualquer pedido, ele entra no financeiro.
  if (normalizedStatus === 'finalizado') {
    await registrarVendaNoCaixa(data);
  }

  // 🔔 SINCRONIZAÇÃO IA/WHATSAPP
  if (data.whatsapp) {
    const statusText = {
      preparo: '👨‍🍳 Seu pedido já está sendo preparado!',
      pronto: '✅ Seu pedido está pronto e aguardando retirada!',
      finalizado: '🎉 Pedido entregue! Esperamos que goste. 😊',
      cancelado: '❌ Seu pedido foi cancelado. Se tiver dúvidas, entre em contato.'
    };
    if (statusText[normalizedStatus]) {
      whatsappService.enviarNotificacao(data.whatsapp, statusText[normalizedStatus]);
    }
  }

  emitSystemUpdate('pedido_atualizado', data);
  return data;
};

const assignEntregador = async (pedidoId, entregadorId) => {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ 
      entregador_id: entregadorId,
      status: ORDER_STATUS.OUT_FOR_DELIVERY 
    })
    .eq('id', pedidoId)
    .select('*, cliente:clientes(*), entregador:entregadores(*), itens:itens_pedido(*, produto:produtos(*))')
    .single();

  if (error) throw error;
  
  // 🔔 SINCRONIZAÇÃO IA/WHATSAPP - Saída para Entrega
  if (data.whatsapp) {
    whatsappService.enviarNotificacao(data.whatsapp, '🛵 Seu pedido saiu para entrega! Nosso entregador já está a caminho.');
  }

  emitSystemUpdate('pedido_atualizado', data);
  return data;
};

// Função auxiliar para padronizar o registro financeiro
const registrarVendaNoCaixa = async (pedido) => {
  try {
    const { data: caixaAberto } = await supabase.from('caixa').select('id').eq('status', 'aberto').maybeSingle();
    
    await supabase.from('vendas').insert([{
      total: Number(pedido.total || 0),
      pagamento: pedido.forma_pagamento ? pedido.forma_pagamento.toUpperCase() : 'DINHEIRO',
      origem: pedido.origem === 'PDV' ? 'PDV' : 'DELIVERY',
      caixa_id: caixaAberto?.id || null
    }]);

    emitSystemUpdate('venda_realizada', { total: pedido.total });
    console.log(`[Financeiro] Venda registrada para o pedido ${pedido.id}`);
  } catch (err) {
    console.error('[Financeiro] Erro ao registrar venda:', err.message);
  }
};

module.exports = {
  assignEntregador,
  createPedido,
  listPedidos,
  updatePedidoStatus,
};