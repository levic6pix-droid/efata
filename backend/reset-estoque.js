const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const supabase = require('./src/config/supabase');

async function resetEstoque() {
  console.log('🔄 Resetando estoque de todos os produtos para 100...');
  
  const { data: prods } = await supabase.from('produtos').select('id');
  
  if (prods && prods.length > 0) {
    const ids = prods.map(p => p.id);
    const { error } = await supabase
      .from('produtos')
      .update({ estoque: 100, ativo: true })
      .in('id', ids);

    if (error) {
      console.error('❌ Erro ao atualizar:', error.message);
    } else {
      console.log('✅ Todos os produtos agora têm 100 unidades e estão ATIVOS!');
    }
  } else {
    console.log('ℹ️ Nenhum produto encontrado para atualizar.');
  }
  
  process.exit(0);
}

resetEstoque();
