const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, requireRole } = require('../middlewares/auth');
const { ADMIN_ROLE } = require('../constants');
const { categoriaSchema, clienteSchema, entregadorSchema, produtoSchema } = require('../validators/catalog');
const { HttpError } = require('../utils/http-error');
const { emitSystemUpdate } = require('../config/socket');
const { invalidateCache } = require('../services/menu-service');

const router = express.Router();

// --- CATEGORIAS ---
router.get('/categorias', async (req, res) => {
  const { data, error } = await supabase.from('categorias').select('*').order('nome', { ascending: true });
  if (error) return res.status(500).json(error);
  res.json(data);
});

router.post('/categorias', async (req, res, next) => {
  try {
    const validated = categoriaSchema.parse(req.body);
    const { ativa, ...rest } = validated;
    const { data, error } = await supabase.from('categorias').insert([rest]).select().single();
    if (error) throw error;
    emitSystemUpdate('categoria_atualizada', data);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.put('/categorias/:id', authenticate, requireRole(ADMIN_ROLE.ADMIN), async (req, res, next) => {
  try {
    const validated = categoriaSchema.parse(req.body);
    const { ativa, ...rest } = validated;
    const { data, error } = await supabase.from('categorias').update(rest).eq('id', req.params.id).select().single();
    if (error) throw error;
    emitSystemUpdate('categoria_atualizada', data);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete('/categorias/:id', authenticate, requireRole(ADMIN_ROLE.ADMIN), async (req, res, next) => {
  try {
    const id = req.params.id;
    // Verifica produtos vinculados
    const { count, error: countErr } = await supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('categoria_id', id);
    if (count > 0) throw new HttpError(400, 'Esta categoria possui produtos vinculados');

    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) throw error;
    emitSystemUpdate('categoria_removida', { id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// --- CLIENTES ---
router.get('/clientes', async (req, res) => {
  const { data, error } = await supabase.from('clientes').select('*').order('nome', { ascending: true });
  if (error) {
    // Se a tabela não existir (PGRST205) ou outro erro, retorna array vazio para não quebrar o painel
    return res.json([]);
  }
  res.json(data);
});

router.post('/clientes', authenticate, requireRole(ADMIN_ROLE.ADMIN), async (req, res) => {
  try {
    let body = req.body;
    // Normalização básica
    if (body.telefone) body.telefone = String(body.telefone).replace(/\D/g, '');

    const validated = clienteSchema.parse(body);
    
    // 🔥 CONSTRUÇÃO MANUAL E FORÇADA (Ignora CEP e qualquer outro campo extra)
    const payloadToSave = {
      nome: validated.nome,
      telefone: validated.telefone,
      cep: validated.cep || null,
      rua: validated.rua || null,
      numero: validated.numero || null,
      bairro: validated.bairro || null,
      cidade: validated.cidade || null,
      complemento: validated.complemento || null,
      ativo: validated.ativo !== undefined ? validated.ativo : true
    };

    console.log("🚀 Enviando para Supabase (CLIENTE):", payloadToSave);

    const { data, error } = await supabase.from('clientes').insert([payloadToSave]).select().single();
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Já existe um cliente cadastrado com este telefone.' });
      }
      throw error;
    }
    emitSystemUpdate('cliente_atualizado', data);
    res.status(201).json(data);
  } catch (error) {
    console.error("❌ ERRO CLIENTE:", error);
    if (error.errors) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(", ") });
    }
    return res.status(500).json({ error: error.message || "Erro ao salvar cliente" });
  }
});

router.put('/clientes/:id', authenticate, requireRole(ADMIN_ROLE.ADMIN), async (req, res) => {
  try {
    let body = req.body;
    if (body.telefone) body.telefone = String(body.telefone).replace(/\D/g, '');

    const validated = clienteSchema.parse(body);
    
    const payloadToUpdate = {
      nome: validated.nome,
      telefone: validated.telefone,
      cep: validated.cep || null,
      rua: validated.rua || null,
      numero: validated.numero || null,
      bairro: validated.bairro || null,
      cidade: validated.cidade || null,
      complemento: validated.complemento || null,
      ativo: validated.ativo !== undefined ? validated.ativo : true
    };

    const { data, error } = await supabase.from('clientes').update(payloadToUpdate).eq('id', req.params.id).select().single();
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Já existe um cliente cadastrado com este telefone.' });
      }
      throw error;
    }
    emitSystemUpdate('cliente_atualizado', data);
    res.json(data);
  } catch (error) {
    console.error("❌ ERRO CLIENTE (PUT):", error);
    if (error.errors) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(", ") });
    }
    return res.status(500).json({ error: error.message || "Erro ao atualizar cliente" });
  }
});

router.delete('/clientes/:id', authenticate, requireRole(ADMIN_ROLE.ADMIN), async (req, res, next) => {
  try {
    const id = req.params.id;
    const { count } = await supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('cliente_id', id);
    if (count > 0) throw new HttpError(400, 'Cliente possui pedidos vinculados');

    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
    emitSystemUpdate('cliente_removido', { id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// --- PRODUTOS (CARDÁPIO) ---
router.get('/cardapio', async (req, res) => {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias(nome)')
    .order('ativo', { ascending: false })
    .order('nome', { ascending: true });
  
  if (error) return res.status(500).json(error);
  
  // Ajuste para manter compatibilidade com o frontend que espera .categoria.nome e categoriaId
  const formatted = data.map(p => ({
    ...p,
    categoriaId: p.categoria_id,
    categoria: p.categorias,
    imagem: p.imagem || null
  }));
  
  res.json(formatted);
});

router.post('/produtos', async (req, res) => {
  try {
    let body = req.body;

    // 🔥 NORMALIZAÇÃO FORÇADA (evita erro do Zod)
    body.preco = body.preco || "0";
    body.estoque = body.estoque || "0";
    body.minimo = body.minimo || "0";

    const parsed = produtoSchema.parse(body);

    let {
      categoriaId,
      categoria_estoque,
      categoriaEstoque,
      estoqueMinimo,
      minimo,
      ...rest
    } = parsed;

    // 🔥 CONVERSÃO SEGURA
    const preco = parseFloat(String(rest.preco).replace(",", ".")) || 0;
    const estoque = parseInt(rest.estoque) || 0;
    const estoque_minimo = parseInt(estoqueMinimo || minimo) || 0;

    let finalCategoriaId = categoriaId || categoria_estoque || categoriaEstoque;

    // 🔥 RESOLVE CATEGORIA POR NOME (SE NÃO FOR UUID)
    const isUUID = /^[0-9a-f-]{36}$/i.test(finalCategoriaId || "");

    if (finalCategoriaId && !isUUID) {
      const { data } = await supabase
        .from('categorias')
        .select('id')
        .ilike('nome', finalCategoriaId)
        .single();

      finalCategoriaId = data?.id || null;
    }

    // 🔥 INSERT LIMPO
    const { data, error } = await supabase
      .from('produtos')
      .insert([{
        ...rest,
        preco,
        estoque,
        estoque_minimo,
        categoria_id: finalCategoriaId,
        categoria_estoque: categoriaEstoque || categoria_estoque || null,
        imagem: rest.imagem || null
      }])
      .select('*, categorias(nome)')
      .single();

    if (error) {
      console.error("❌ ERRO SUPABASE:", error);
      return res.status(400).json({ error: error.message });
    }

    invalidateCache();
    emitSystemUpdate('produto_atualizado', data);
    res.status(201).json(data);

  } catch (error) {
    console.error("❌ ERRO GERAL:", error);

    if (error.errors) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(", ")
      });
    }

    res.status(500).json({ error: "Erro ao salvar produto" });
  }
});

router.put('/produtos/:id', async (req, res, next) => {
  try {
    const parsed = produtoSchema.parse(req.body);
    const { categoriaId, categoria_estoque, categoriaEstoque, estoqueMinimo, minimo, ...rest } = parsed;
    
    const finalCategoriaId = categoriaId || categoria_estoque || categoriaEstoque;
    const finalEstoqueMinimo = estoqueMinimo ?? minimo ?? 0;

    // BLINDAGEM: Se o ID não for um UUID válido, removemos para não dar erro no banco
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalCategoriaId);
    const categoriaIdToSave = isUUID ? finalCategoriaId : null;

    const { data, error } = await supabase.from('produtos').update({
      ...rest,
      categoria_id: categoriaIdToSave,
      estoque_minimo: finalEstoqueMinimo,
      categoria_estoque: categoriaEstoque || categoria_estoque,
      imagem: rest.imagem || null
    }).eq('id', req.params.id).select('*, categorias(nome)').single();
    
    if (error) throw error;
    const formatted = { ...data, categoria: data.categorias };
    invalidateCache();
    emitSystemUpdate('produto_atualizado', formatted);
    res.json(formatted);
  } catch (error) {
    console.error("❌ ERRO REAL:", error);
    if (error.errors) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: error.message || "Erro interno" });
  }
});

router.delete('/produtos/:id', authenticate, requireRole(ADMIN_ROLE.ADMIN), async (req, res, next) => {
  try {
    const id = req.params.id;
    const { count } = await supabase.from('itens_pedido').select('*', { count: 'exact', head: true }).eq('produto_id', id);
    if (count > 0) throw new HttpError(400, 'Produto vinculado a pedidos não pode ser excluído');

    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) throw error;
    invalidateCache();
    emitSystemUpdate('produto_removido', { id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// --- ENTREGADORES ---
router.get('/entregadores', async (req, res) => {
  const { data, error } = await supabase.from('entregadores').select('*').order('nome', { ascending: true });
  if (error) return res.status(500).json(error);
  res.json(data);
});

router.post('/entregadores', authenticate, requireRole(ADMIN_ROLE.ADMIN), async (req, res) => {
  try {
    let body = req.body;
    if (body.telefone) body.telefone = String(body.telefone).replace(/\D/g, '');

    const validated = entregadorSchema.parse(body);
    const payloadToSave = {
      nome: validated.nome,
      telefone: validated.telefone,
      documento: validated.documento,
      tipo_veiculo: validated.tipoVeiculo || 'Moto',
      placa: validated.placa,
      modelo: validated.modelo,
      area_atuacao: validated.areaAtuacao,
      turno: validated.turno,
      disponibilidade: validated.disponibilidade || 'Disponível',
      ativo: validated.ativo !== undefined ? validated.ativo : true
    };

    const { data, error } = await supabase.from('entregadores').insert([payloadToSave]).select().single();
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Já existe um entregador cadastrado com este telefone.' });
      }
      throw error;
    }
    emitSystemUpdate('entregador_atualizado', data);
    res.status(201).json(data);
  } catch (error) {
    console.error("❌ ERRO ENTREGADOR (POST):", error);
    if (error.errors) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(", ") });
    }
    return res.status(500).json({ error: error.message || "Erro ao salvar entregador" });
  }
});

router.put('/entregadores/:id', authenticate, requireRole(ADMIN_ROLE.ADMIN), async (req, res) => {
  try {
    let body = req.body;
    if (body.telefone) body.telefone = String(body.telefone).replace(/\D/g, '');

    const validated = entregadorSchema.parse(body);
    const payloadToSave = {
      nome: validated.nome,
      telefone: validated.telefone,
      documento: validated.documento,
      tipo_veiculo: validated.tipoVeiculo,
      placa: validated.placa,
      modelo: validated.modelo,
      area_atuacao: validated.areaAtuacao,
      turno: validated.turno,
      disponibilidade: validated.disponibilidade,
      ativo: validated.ativo !== undefined ? validated.ativo : true
    };

    const { data, error } = await supabase.from('entregadores').update(payloadToSave).eq('id', req.params.id).select().single();
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Já existe um entregador cadastrado com este telefone.' });
      }
      throw error;
    }
    emitSystemUpdate('entregador_atualizado', data);
    res.json(data);
  } catch (error) {
    console.error("❌ ERRO ENTREGADOR (PUT):", error);
    if (error.errors) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(", ") });
    }
    return res.status(500).json({ error: error.message || "Erro ao atualizar entregador" });
  }
});

router.delete('/entregadores/:id', authenticate, requireRole(ADMIN_ROLE.ADMIN), async (req, res, next) => {
  try {
    const id = req.params.id;
    // Verifica pedidos vinculados
    const { count } = await supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('entregador_id', id);
    if (count > 0) throw new HttpError(400, 'Entregador vinculado a pedidos não pode ser excluído');

    const { error } = await supabase.from('entregadores').delete().eq('id', id);
    if (error) throw error;
    emitSystemUpdate('entregador_removido', { id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// --- CAIXA (Histórico Legado) ---
router.get('/caixa', authenticate, requireRole(ADMIN_ROLE.ADMIN), async (req, res) => {
  const { data, error } = await supabase.from('caixa').select('*').order('aberto_em', { ascending: false });
  if (error) return res.status(500).json(error);
  res.json(data);
});

module.exports = router;