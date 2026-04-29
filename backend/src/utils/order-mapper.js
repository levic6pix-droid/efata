const { ORDER_STATUS } = require('../constants');

const statusLabels = {
  [ORDER_STATUS.RECEIVED]: 'Recebido',
  [ORDER_STATUS.PREPARING]: 'Em preparo',
  [ORDER_STATUS.READY]: 'Pronto',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Em entrega',
  [ORDER_STATUS.DELIVERED]: 'Finalizado',
  [ORDER_STATUS.CANCELLED]: 'Cancelado',
};

const mapPedido = (pedido) => ({
  ...pedido,
  statusLabel: statusLabels[pedido.status] || pedido.status,
});

module.exports = {
  mapPedido,
  statusLabels,
};