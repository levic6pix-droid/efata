const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const supabase = require('./src/config/supabase');

async function hardReset() {
  console.log('⚠️ INICIANDO LIMPEZA TOTAL DO BANCO DE DADOS...');

  const tabelas = [
    'itens_pedido',
    'venda_itens',
    'pedidos',
    'vendas',
    'produtos',
    'categorias',
    'clientes',
    'entregadores',
    'caixa',
    'mensagens',
    'conversas',
    'settings'
  ];

  for (const tabela of tabelas) {
    console.log(`- Limpando tabela: ${tabela}...`);
    const { error } = await supabase.from(tabela).delete().not('id', 'is', null);
    if (error) {
      console.warn(`  ⚠️ Erro em ${tabela}: ${error.message}`);
    }
  }

  console.log('✅ BANCO DE DADOS LIMPO COM SUCESSO!');
  console.log('ℹ️ As colunas permanecem as mesmas. Para alterar colunas, use o Dashboard do Supabase.');
  process.exit(0);
}

hardReset();
