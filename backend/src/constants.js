const ORDER_STATUS = {
  RECEIVED: 'recebido',
  PREPARING: 'preparo',
  READY: 'pronto',
  OUT_FOR_DELIVERY: 'despachado',
  DELIVERED: 'finalizado',
  CANCELLED: 'cancelado',
};

const ORDER_STATUS_FLOW = [
  ORDER_STATUS.RECEIVED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
];

const ADMIN_ROLE = {
  ADMIN: 'admin',
};

module.exports = {
  ADMIN_ROLE,
  ORDER_STATUS,
  ORDER_STATUS_FLOW,
};