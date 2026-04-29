const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL ou SUPABASE_ANON_KEY não configurados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🌱 Cadastrando produtos de demonstração no Supabase...');

  // 1. Criar Categorias
  const { data: catData, error: catError } = await supabase
    .from('categorias')
    .upsert([
      { id: 1, nome: 'Hamburgueres', ativa: true },
      { id: 2, nome: 'Pizzas', ativa: true },
      { id: 3, nome: 'Bebidas', ativa: true }
    ])
    .select();

  if (catError) {
    console.error('Erro ao criar categorias:', catError.message);
    return;
  }
  console.log('✅ Categorias criadas.');

  // 2. Criar Produtos
  const { error: prodError } = await supabase
    .from('produtos')
    .upsert([
      { id: 1, nome: 'X-Tudo Especial', descricao: 'Pão, carne 150g, ovo, bacon, queijo, presunto e salada', preco: 28.50, categoria_id: 1, ativo: true, disponivel: true },
      { id: 2, nome: 'X-Bacon Supremo', descricao: 'Muito bacon, carne 150g e queijo cheddar', preco: 25.00, categoria_id: 1, ativo: true, disponivel: true },
      { id: 3, nome: 'Pizza de Calabresa G', descricao: 'Calabresa, cebola e mussarela', preco: 45.00, categoria_id: 2, ativo: true, disponivel: true },
      { id: 4, nome: 'Pizza de Mussarela G', descricao: 'Mussarela de búfala e orégano', preco: 40.00, categoria_id: 2, ativo: true, disponivel: true },
      { id: 5, nome: 'Coca-Cola 2L', descricao: 'Gelada', preco: 12.00, categoria_id: 3, ativo: true, disponivel: true },
      { id: 6, nome: 'Suco de Laranja 500ml', descricao: 'Natural', preco: 8.50, categoria_id: 3, ativo: true, disponivel: true }
    ]);

  if (prodError) {
    console.error('Erro ao criar produtos:', prodError.message);
    return;
  }
  console.log('✅ Produtos de demonstração cadastrados com sucesso!');
  console.log('\n🚀 Agora o seu robô do WhatsApp já tem um cardápio para oferecer!');
}

seed();
