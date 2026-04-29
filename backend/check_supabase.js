const supabase = require('./src/config/supabase');

async function checkTables() {
  const { data, error } = await supabase.from('conversas').select('*').limit(1);
  if (error) {
    console.error('❌ Erro na tabela conversas:', error.message);
  } else {
    console.log('✅ Tabela conversas existe.');
  }

  const { data: prodData, error: prodError } = await supabase.from('produtos').select('*').limit(1);
  if (prodError) {
    console.error('❌ Erro na tabela produtos:', prodError.message);
  } else {
    console.log('✅ Tabela produtos existe.');
  }
}

checkTables();
