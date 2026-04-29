const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL não encontrada no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'categorias', 'produtos', 'clientes', 'caixa', 'vendas', 
  'venda_itens', 'pedidos', 'itens_pedido', 'mensagens_chatbot'
];

async function check() {
  console.log('--- RELATÓRIO DE TABELAS SUPABASE ---');
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ [${table}]: NÃO EXISTE`);
        } else if (error.code === '42501') {
          console.log(`🔒 [${table}]: EXISTE, MAS ESTÁ PROTEGIDA (RLS ATIVO)`);
        } else {
          console.log(`⚠️ [${table}]: ERRO (${error.code}) - ${error.message}`);
        }
      } else {
        console.log(`✅ [${table}]: OK`);
      }
    } catch (e) {
      console.log(`🚨 [${table}]: ERRO CRÍTICO - ${e.message}`);
    }
  }
}

check();
