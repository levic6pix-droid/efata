const express = require('express');
const { authenticate, requireRole } = require('../middlewares/auth');
const { ADMIN_ROLE } = require('../constants');
const { assignEntregadorSchema, createOrderSchema, updateOrderStatusSchema } = require('../validators/order');
const { assignEntregador, createPedido, listPedidos, updatePedidoStatus } = require('../services/order-service');

const router = express.Router();

router.get('/pedidos', async (req, res, next) => {
  try {
    const pedidos = await listPedidos();
    res.json(pedidos);
  } catch (error) {
    next(error);
  }
});

router.post('/pedidos', async (req, res, next) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const pedido = await createPedido(data);
    res.status(201).json(pedido);
  } catch (error) {
    next(error);
  }
});

router.put('/pedidos/:id/status', authenticate, requireRole(ADMIN_ROLE.ADMIN), async (req, res, next) => {
  try {
    const { status } = updateOrderStatusSchema.parse(req.body);
    const pedido = await updatePedidoStatus(req.params.id, status);
    res.json(pedido);
  } catch (error) {
    next(error);
  }
});

router.put('/pedidos/:id/entregador', authenticate, requireRole(ADMIN_ROLE.ADMIN), async (req, res, next) => {
  try {
    const { entregadorId } = assignEntregadorSchema.parse(req.body);
    const pedido = await assignEntregador(req.params.id, entregadorId);
    res.json(pedido);
  } catch (error) {
    next(error);
  }
});

module.exports = router;