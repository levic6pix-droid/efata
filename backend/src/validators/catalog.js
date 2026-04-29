const { z } = require('zod');

const categoriaSchema = z.object({
  nome: z.string().trim().min(2, 'Nome obrigatório'),
  ativa: z.boolean().optional(),
});

// CORRIGIDO: Campos de endereço opcionais para aceitar tanto PDV (endereco único) 
// quanto CadastrosPanel (campos separados)
const clienteSchema = z.object({
  nome: z.string().trim().min(2, 'Nome obrigatório'),
  telefone: z.string().trim().min(6, 'Telefone obrigatório'),
  // Endereço estruturado (CadastrosPanel)
  rua: z.string().trim().optional().nullable(),
  numero: z.string().trim().optional().nullable(),
  bairro: z.string().trim().optional().nullable(),
  cidade: z.string().trim().optional().nullable(),
  complemento: z.string().trim().optional().nullable(),
  cep: z.string().trim().optional().nullable(),
  // Endereço único (PDV / Chatbot)
  endereco: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  ativo: z.boolean().optional(),
});

const produtoSchema = z.object({
  nome: z.string().trim().min(2, 'Nome obrigatório'),

  descricao: z.string().trim().optional().nullable(),

  preco: z.preprocess((val) => {
    if (!val) return 0;
    if (typeof val === 'string') {
      const numero = parseFloat(val.replace(/[^\d,.-]/g, '').replace(',', '.'));
      return isNaN(numero) ? 0 : numero;
    }
    return val;
  }, z.number().min(0, 'Preço inválido')),

  estoque: z.preprocess((val) => {
    if (!val) return 0;
    if (typeof val === 'string') {
      return parseInt(val.replace(/\D/g, '')) || 0;
    }
    return val;
  }, z.number().int().min(0)),

  estoqueMinimo: z.preprocess((val) => {
    if (!val) return 0;
    if (typeof val === 'string') {
      return parseInt(val.replace(/\D/g, '')) || 0;
    }
    return val;
  }, z.number().int().min(0).optional()),

  minimo: z.any().optional(),

  unidade: z.string().trim().min(1).default('UN'),

  categoriaEstoque: z.string().trim().optional().nullable(),
  categoria_estoque: z.string().trim().optional().nullable(),

  categoriaId: z.preprocess((val) => {
    if (!val || typeof val !== 'string') return null;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    return isUUID ? val : null;
  }, z.string().uuid().optional().nullable()),

  imagem: z.string().optional().nullable(),

  ativo: z.boolean().optional(),
  disponivel: z.boolean().optional(),
});

const entregadorSchema = z.object({
  nome: z.string().trim().min(2, 'Nome obrigatório'),
  telefone: z.string().trim().min(8, 'Telefone obrigatório'),
  documento: z.string().trim().optional().nullable(),
  tipoVeiculo: z.string().trim().min(2, 'Veículo obrigatório'),
  placa: z.string().trim().optional().nullable(),
  modelo: z.string().trim().optional().nullable(),
  areaAtuacao: z.string().trim().optional().nullable(),
  ativo: z.boolean().optional(),
  disponibilidade: z.string().trim().optional(),
  turno: z.string().trim().optional(),
});

module.exports = {
  categoriaSchema,
  clienteSchema,
  produtoSchema,
  entregadorSchema,
};