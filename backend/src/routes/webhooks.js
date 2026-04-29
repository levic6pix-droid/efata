const express = require('express');
const supabase = require('../config/supabase');
const mpService = require('../services/mercadopago-service');
const whatsappService = require('../services/whatsapp-service');
const { emitSystemUpdate } = require('../config/socket');

const router = express.Router();

router.post('/mercadopago', async (req, res) => {
  const type = req.body.type || req.body.action;
  const dataPayload = req.body.data || req.body;

  console.log(`[Webhook MP] Evento: ${type}, ID: ${dataPayload?.id}`);

  if (type === 'payment' || type === 'payment.created' || type === 'payment.updated') {
    try {
      const pagamentoId = dataPayload.id;
      const pagamento = await mpService.buscarPagamento(pagamentoId);

      if (pagamento && pagamento.status === 'approved') {
        const pedidoId = pagamento.metadata?.pedido_id || pagamento.external_reference;
        
        console.log(`✅ Pagamento Aprovado PIX! Referência/Pedido: ${pedidoId}`);

        // 🔥 Atualiza pedido
        const { data: pedido, error } = await supabase
          .from('pedidos')
          .update({ status: 'preparo', pago: true, payment_id: String(pagamentoId) })
          .eq('payment_id', String(pagamentoId))
          .select('*, cliente:clientes(*), itens:itens_pedido(*, produto:produtos(*))')
          .single();

        if (!error && pedido) {
          // 📲 Notifica cliente via WhatsApp
          if (whatsappService.isReady && pedido.cliente?.telefone) {
            const msg = `✅ *Pagamento Confirmado!*\n\nOlá, *${pedido.cliente.nome}*! Recebemos seu PIX.\nSeu pedido já está em preparo 🍔🔥\n\n⏱️ *Tempo estimado:* 30-40 min`;
            await whatsappService.enviarNotificacao(pedido.cliente.telefone, msg);
          }

          // Atualiza painel via Socket
          emitSystemUpdate('dados_atualizados', { type: 'payment_confirmed', pedidoId: pedido.id });
          emitSystemUpdate('imprimir_pedido', { pedido }); // 🖨️ Aciona impressão automática no PDV

          // 🖨️ Impressão Direta USB (Opcional caso haja impressora física ligada ao servidor local)
          imprimirPedidoAutomaticoUSB(pedido);
        }
      }
    } catch (err) {
      console.error('[Webhook MP] Erro ao processar:', err.message);
    }
  }

  res.sendStatus(200);
});

// 🖨️ Função para Impressão Automática (Backend USB)
async function imprimirPedidoAutomaticoUSB(pedido) {
  try {
    const escpos = require('escpos');
    const USB = require('escpos-usb');
    escpos.USB = USB;
    
    const device = new USB();
    const printer = new escpos.Printer(device);
    
    device.open(function() {
      printer
        .font('a')
        .align('ct')
        .style('b')
        .size(1, 1)
        .text('EFATA DELIVERY')
        .text('--------------------------------')
        .text(`PEDIDO: #${pedido.id.substring(0, 8).toUpperCase()}`)
        .text('PAGAMENTO: PIX APROVADO')
        .text('--------------------------------');
      
      printer.cut().close();
    });
  } catch (e) {
    console.warn('⚠️ Impressora USB não detectada para impressão automática. Enviado via Socket para o PDV.');
  }
}

module.exports = router;
