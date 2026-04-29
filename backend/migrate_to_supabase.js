const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL ou SUPABASE_ANON_KEY não configurados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🚀 Iniciando migração para a nuvem (Supabase)...');

  try {
    // 1. Migrar Categorias
    console.log('📦 Migrando categorias...');
    const localCategorias = await prisma.categoria.findMany();
    for (const cat of localCategorias) {
      const { error } = await supabase
        .from('categorias')
        .upsert({
          id: cat.id,
          nome: cat.nome,
          ativa: cat.ativa
        });
      if (error) console.error(`Erro ao migrar categoria ${cat.nome}:`, error.message);
    }
    console.log(`✅ ${localCategorias.length} categorias migradas.`);

    // 2. Migrar Produtos
    console.log('🍔 Migrando produtos...');
    const localProdutos = await prisma.produto.findMany();
    for (const prod of localProdutos) {
      const { error } = await supabase
        .from('produtos')
        .upsert({
          id: prod.id,
          nome: prod.nome,
          descricao: prod.descricao,
          preco: prod.preco,
          estoque: prod.estoque,
          estoque_minimo: prod.estoqueMinimo,
          unidade: prod.unidade,
          categoria_id: prod.categoriaId,
          imagem: prod.imagem,
          ativo: prod.ativo,
          disponivel: prod.disponivel
        });
      if (error) console.error(`Erro ao migrar produto ${prod.nome}:`, error.message);
    }
    console.log(`✅ ${localProdutos.length} produtos migrados.`);

    // 3. Migrar Clientes
    console.log('👥 Migrando clientes...');
    const localClientes = await prisma.cliente.findMany();
    for (const cli of localClientes) {
      const { error } = await supabase
        .from('clientes')
        .upsert({
          id: cli.id,
          nome: cli.nome,
          telefone: cli.telefone,
          rua: cli.rua,
          numero: cli.numero,
          bairro: cli.bairro,
          cidade: cli.cidade,
          complemento: cli.complemento,
          ativo: cli.ativo
        });
      if (error) console.error(`Erro ao migrar cliente ${cli.nome}:`, error.message);
    }
    console.log(`✅ ${localClientes.length} clientes migrados.`);

    console.log('\n✨ MIGRACÃO CONCLUÍDA COM SUCESSO! ✨');
    console.log('Seu cardápio agora está disponível na nuvem para o Agente de IA.');

  } catch (err) {
    console.error('❌ Erro crítico durante a migração:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
