const { z } = require('zod');
const { ORDER_STATUS } = require('../constants');

const orderItemSchema = z.object({
  produto_id: z.union([z.string().uuid(), z.coerce.number().int().positive('Produto inválido')]),
  quantidade: z.coerce.number().int().positive('Quantidade inválida'),
  observacao: z.string().trim().max(300).optional().nullable(),
});

const checkoutClienteSchema = z.object({
  nome: z.string().trim().min(2, 'Nome obrigatório'),
  telefone: z.string().trim().min(8, 'Telefone obrigatório'),
  rua: z.string().trim().min(2, 'Rua obrigatória'),
  numero: z.string().trim().min(1, 'Número obrigatório'),
  bairro: z.string().trim().min(2, 'Bairro obrigatório'),
  cidade: z.string().trim().optional().nullable(),
  complemento: z.string().trim().optional().nullable(),
});

const createOrderSchema = z.object({
  cliente_id: z.union([z.string().uuid(), z.coerce.number().int().positive('Cliente obrigatório')]).optional(),
  cliente: checkoutClienteSchema.optional(),
  itens: z.array(orderItemSchema).min(1, 'Informe ao menos um item'),
  forma_pagamento: z.string().trim().min(2, 'Forma de pagamento obrigatória'),
  origem: z.string().optional().default('APP'),
}).superRefine((data, ctx) => {
  if (!data.cliente_id && !data.cliente) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['cliente'],
      message: 'Informe um cliente existente ou dados do cliente',
    });
  }
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    ORDER_STATUS.RECEIVED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
  ]),
});

const assignEntregadorSchema = z.object({
  entregadorId: z.union([z.string().uuid(), z.coerce.number().int().positive('Entregador inválido')]),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  assignEntregadorSchema,
};