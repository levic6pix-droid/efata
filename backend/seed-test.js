const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const supabase = require('./src/config/supabase');
const { emitSystemUpdate } = require('./src/config/socket');

async function seed() {
  console.log('🚀 Iniciando cadastro inteligente (Sem duplicar)...');

  // 1. Gerenciar Categorias
  const categoriasNomes = ['Hambúrgueres Artesanais', 'Pizzas', 'Bebidas', 'Sobremesas'];
  
  // Busca as que já existem
  const { data: existingCats } = await supabase.from('categorias').select('id, nome');
  const existingNames = existingCats?.map(c => c.nome) || [];

  // Filtra apenas as novas
  const newCats = categoriasNomes
    .filter(n => !existingNames.includes(n))
    .map(n => ({ nome: n }));

  if (newCats.length > 0) {
    console.log(`- Inserindo ${newCats.length} novas categorias...`);
    await supabase.from('categorias').insert(newCats);
  }

  // Busca todas novamente para ter os IDs atualizados
  const { data: allCats } = await supabase.from('categorias').select('id, nome');
  const getCatId = (nome) => allCats.find(c => c.nome === nome)?.id;

  console.log('✅ Categorias prontas.');

  // 2. Definir Produtos
  const produtosParaTestar = [
    { 
      nome: 'X-Burger Clássico', 
      preco: 22.90, 
      estoque: 50, 
      descricao: 'Pão brioche, blend 150g, queijo cheddar e maionese da casa.',
      categoria_id: getCatId('Hambúrgueres Artesanais'),
      imagem: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
      ativo: true 
    },
    { 
      nome: 'X-Bacon Especial', 
      preco: 28.50, 
      estoque: 30, 
      descricao: 'Pão brioche, blend 150g, muito bacon crocante, queijo e barbecue.',
      categoria_id: getCatId('Hambúrgueres Artesanais'),
      imagem: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=800&auto=format&fit=crop',
      ativo: true 
    },
    { 
      nome: 'Pizza Calabresa (G)', 
      preco: 45.00, 
      estoque: 20, 
      descricao: 'Molho de tomate, mussarela, calabresa fatiada e cebola.',
      categoria_id: getCatId('Pizzas'),
      imagem: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop',
      ativo: true 
    },
    { 
      nome: 'Coca-Cola 2L', 
      preco: 12.00, 
      estoque: 100, 
      descricao: 'Garrafa pet 2 litros gelada.',
      categoria_id: getCatId('Bebidas'),
      imagem: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop',
      ativo: true 
    },
    { 
      nome: 'Suco de Laranja 500ml', 
      preco: 8.50, 
      estoque: 40, 
      descricao: 'Suco natural da fruta.',
      categoria_id: getCatId('Bebidas'),
      imagem: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=800&auto=format&fit=crop',
      ativo: true 
    },
    { 
      nome: 'Brownie de Chocolate', 
      preco: 15.00, 
      estoque: 15, 
      descricao: 'Brownie artesanal com gotas de chocolate belga.',
      categoria_id: getCatId('Sobremesas'),
      imagem: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?q=80&w=800&auto=format&fit=crop',
      ativo: true 
    }
  ];

  // 3. Gerenciar Produtos (Mesma lógica)
  const { data: existingProds } = await supabase.from('produtos').select('nome');
  const existingProdNames = existingProds?.map(p => p.nome) || [];

  const newProds = produtosParaTestar.filter(p => !existingProdNames.includes(p.nome));

  if (newProds.length > 0) {
    console.log(`- Inserindo ${newProds.length} novos produtos...`);
    const { error } = await supabase.from('produtos').insert(newProds);
    if (error) console.error('❌ Erro nos produtos:', error.message);
    else {
      console.log('✅ Produtos e imagens cadastrados!');
      // 🔔 AVISA O FRONTEND PARA RECARREGAR
      emitSystemUpdate('dados_atualizados', { tipo: 'produtos' });
    }
  } else {
    console.log('ℹ️ Todos os produtos já existem no banco.');
    // Mesmo que existam, avisa para garantir
    emitSystemUpdate('dados_atualizados', { tipo: 'produtos' });
  }

  process.exit(0);
}

seed();
