const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Tentando criar tabelas no Supabase ---');
  
  const sqlCommands = [
    `create table if not exists caixa (
      id uuid primary key default gen_random_uuid(),
      aberto_em timestamp with time zone default now(),
      fechado_em timestamp with time zone,
      saldo_inicial numeric default 0,
      saldo_final numeric default 0,
      status text default 'aberto',
      operador text default 'admin'
    );`,
    `alter table vendas add column if not exists caixa_id uuid references caixa(id);`,
    `create table if not exists venda_itens (
      id uuid primary key default gen_random_uuid(),
      venda_id uuid references vendas(id) on delete cascade,
      produto_id uuid,
      nome text,
      quantidade int,
      preco numeric
    );`
  ];

  for (const sql of sqlCommands) {
    console.log(`Executando: ${sql.substring(0, 50)}...`);
    // O cliente padrão não permite rodar SQL puro. 
    // Tentaremos via RPC se existir, ou via insert simulado para testar se a tabela existe.
    const { error } = await supabase.from('caixa').select('id').limit(1);
    if (error && error.code === '42P01') {
      console.log('Tabela "caixa" não existe. Infelizmente o cliente JS não pode criar tabelas diretamente sem um RPC específico.');
      console.log('Por favor, cole o comando no SQL Editor do Dashboard do Supabase.');
    } else {
      console.log('Tabela "caixa" já parece existir ou o acesso foi negado.');
    }
  }
}

run();
