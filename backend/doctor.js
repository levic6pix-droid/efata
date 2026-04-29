const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const supabase = require('./src/config/supabase');

async function diagnostico() {
  console.log('🔍 Iniciando Diagnóstico do Supabase...');
  console.log('URL:', process.env.SUPABASE_URL);

  const tabelas = ['categorias', 'produtos', 'pedidos', 'clientes', 'settings'];
  
  for (const t of tabelas) {
    const { error } = await supabase.from(t).select('id').limit(1);
    if (error) {
      console.log(`❌ Tabela "${t}": ERRO - ${error.message}`);
    } else {
      console.log(`✅ Tabela "${t}": OK`);
    }
  }
}

diagnostico();
