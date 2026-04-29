const express = require('express');
const supabase = require('../config/supabase');
const { createPedido } = require('../services/order-service');

const router = express.Router();

router.post('/pedidos', async (req, res, next) => {
  try {
    const { cliente, carrinho, forma_pagamento, tipo_pedido, origem, total } = req.body;

    // 1. Achar ou criar cliente
    const telefoneNumerico = String(cliente.telefone).replace(/\D/g, '');
    let clienteId = null;

    const { data: exCliente } = await supabase.from('clientes').select('id').eq('telefone', telefoneNumerico).maybeSingle();
    
    if (exCliente) {
      clienteId = exCliente.id;
      // Atualizar endereco se for delivery
      if (tipo_pedido === 'DELIVERY' && cliente.endereco) {
        await supabase.from('clientes').update({ endereco: cliente.endereco, atualizado_em: new Date().toISOString() }).eq('id', clienteId);
      }
    } else {
      const { data: novoCliente, error: errCli } = await supabase.from('clientes').insert([{
        nome: cliente.nome,
        telefone: telefoneNumerico,
        endereco: cliente.endereco || null
      }]).select('id').single();
      
      if (errCli) throw errCli;
      clienteId = novoCliente.id;
    }

    // 2. Criar o pedido (usando o order-service que já gerencia o estoque, eventos e socket)
    const itensParseados = carrinho.map(c => ({
      produto_id: c.produto_id,
      quantidade: c.quantidade,
      preco: c.preco
    }));

    const novoPedido = await createPedido({
      cliente_id: clienteId,
      itens: itensParseados,
      forma_pagamento,
      tipo_pedido,
      origem: origem || 'APP',
      whatsapp: telefoneNumerico
    });

    // 3. Se foi PIX, poderíamos gerar o QRCode, mas para o app simplificado, podemos só retornar o pedido
    // E o frontend lida ou espera atualizacao
    res.status(201).json(novoPedido);
  } catch (error) {
    console.error('Erro ao criar pedido via APP:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar pedido' });
  }
});

router.get('/pedidos/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, itens:itens_pedido(*, produto:produtos(*)), cliente:clientes(*)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Pedido não encontrado' });

  // Mapeamento compatível
  const formatado = {
    ...data,
    clienteId: data.cliente_id,
    formaPagamento: data.forma_pagamento,
    tipoPedido: data.tipo_pedido
  };

  res.json(formatado);
});

module.exports = router;
