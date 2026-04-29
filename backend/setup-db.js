const { Client } = require('pg');

const sql = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpa tipos se existirem
DROP TYPE IF EXISTS status_pedido CASCADE;
DROP TYPE IF EXISTS tipo_origem CASCADE;
DROP TYPE IF EXISTS tipo_pedido CASCADE;

CREATE TYPE status_pedido AS ENUM ('recebido', 'preparo', 'pronto', 'despachado', 'finalizado', 'cancelado');
CREATE TYPE tipo_origem AS ENUM ('APP', 'PDV', 'WEB');
CREATE TYPE tipo_pedido AS ENUM ('DELIVERY', 'RETIRADA');

CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.atualizado_em = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS categorias (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT UNIQUE NOT NULL, criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now());
CREATE TABLE IF NOT EXISTS produtos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, preco NUMERIC(10,2) NOT NULL DEFAULT 0, estoque INTEGER DEFAULT 0, estoque_minimo INTEGER DEFAULT 5, descricao TEXT, imagem TEXT, categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL, categoria_estoque TEXT, unidade TEXT DEFAULT 'UN', ativo BOOLEAN DEFAULT true, disponivel BOOLEAN DEFAULT true, criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(), atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now());
CREATE TABLE IF NOT EXISTS clientes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, telefone TEXT UNIQUE NOT NULL, endereco TEXT, cep TEXT, rua TEXT, numero TEXT, bairro TEXT, cidade TEXT, complemento TEXT, ativo BOOLEAN DEFAULT true, criado_em TIMESTAMP DEFAULT now(), atualizado_em TIMESTAMP DEFAULT now());
CREATE TABLE IF NOT EXISTS entregadores (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, telefone TEXT, documento TEXT, tipo_veiculo TEXT, placa TEXT, modelo TEXT, disponibilidade TEXT DEFAULT 'Disponível', turno TEXT, area_atuacao TEXT, ativo BOOLEAN DEFAULT true, criado_em TIMESTAMP DEFAULT now());
CREATE TABLE IF NOT EXISTS caixa (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), status TEXT DEFAULT 'fechado', saldo_inicial NUMERIC(10,2) DEFAULT 0, saldo_final NUMERIC(10,2), aberto_em TIMESTAMP DEFAULT now(), fechado_em TIMESTAMP);
CREATE TABLE IF NOT EXISTS pedidos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), external_id TEXT UNIQUE, cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL, whatsapp TEXT, total NUMERIC(10,2) DEFAULT 0, status status_pedido DEFAULT 'recebido', origem tipo_origem DEFAULT 'APP', tipo_pedido tipo_pedido DEFAULT 'DELIVERY', forma_pagamento TEXT, entregador_id UUID REFERENCES entregadores(id), taxa_entrega NUMERIC(10,2) DEFAULT 0, criado_em TIMESTAMP DEFAULT now(), atualizado_em TIMESTAMP DEFAULT now());
CREATE TABLE IF NOT EXISTS itens_pedido (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE, produto_id UUID REFERENCES produtos(id), quantidade INTEGER DEFAULT 1, preco NUMERIC(10,2), observacao TEXT);
CREATE TABLE IF NOT EXISTS vendas (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), total NUMERIC(10,2), pagamento TEXT, origem TEXT DEFAULT 'PDV', caixa_id UUID REFERENCES caixa(id), operador TEXT, criado_em TIMESTAMP DEFAULT now());
CREATE TABLE IF NOT EXISTS venda_itens (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE, produto_id UUID, nome TEXT, quantidade INTEGER, preco NUMERIC(10,2));
CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, data JSONB NOT NULL, atualizado_em TIMESTAMP DEFAULT now());
CREATE TABLE IF NOT EXISTS conversas (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), whatsapp TEXT, status TEXT DEFAULT 'aberta', atualizado_em TIMESTAMP DEFAULT now());
CREATE TABLE IF NOT EXISTS mensagens (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), conversa_id UUID REFERENCES conversas(id) ON DELETE CASCADE, mensagem TEXT, tipo TEXT, criado_em TIMESTAMP DEFAULT now());
CREATE TABLE IF NOT EXISTS menu_version (id SERIAL PRIMARY KEY, versao INTEGER DEFAULT 1, atualizado_em TIMESTAMP DEFAULT now());

-- Triggers
DROP TRIGGER IF EXISTS trg_produtos_update ON produtos;
CREATE TRIGGER trg_produtos_update BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_timestamp();
DROP TRIGGER IF EXISTS trg_clientes_update ON clientes;
CREATE TRIGGER trg_clientes_update BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_timestamp();
DROP TRIGGER IF EXISTS trg_pedidos_update ON pedidos;
CREATE TRIGGER trg_pedidos_update BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Config Inicial
INSERT INTO menu_version (versao) VALUES (1) ON CONFLICT DO NOTHING;
INSERT INTO settings (id, data) VALUES (1, '{"paymentMethods": {"pix": true, "dinheiro": true, "cartao_debito": true, "cartao_credito": true}, "companyProfile": {"nomeFantasia": "Efatá Delivery", "pixKey": ""}, "deliveryFees": {"tipo": "fixo", "taxaFixa": 0}}') ON CONFLICT (id) DO NOTHING;
`;

async function setupDB() {
  const client = new Client({
    connectionString: "postgres://postgres:Bahia%40866019@db.bsbclyjesniebrpixvao.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('⏳ Conectando ao PostgreSQL do Supabase...');
    await client.connect();
    console.log('✅ Conectado! Executando o esquema SQL...');
    await client.query(sql);
    console.log('🚀 TABELAS CRIADAS COM SUCESSO!');
  } catch (err) {
    console.error('❌ ERRO AO CRIAR TABELAS:', err.message);
  } finally {
    await client.end();
  }
}

setupDB();
