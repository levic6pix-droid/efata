const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  if ((await prisma.categoria.count()) === 0) {
    await prisma.categoria.createMany({
      data: [{ nome: 'Lanches' }, { nome: 'Bebidas' }, { nome: 'Pizzas' }],
    });
  }

  const categorias = await prisma.categoria.findMany({
    where: { nome: { in: ['Lanches', 'Bebidas', 'Pizzas'] } },
  });

  const categoriasMap = Object.fromEntries(
    categorias.map((categoria) => [categoria.nome, categoria]),
  );

  if ((await prisma.cliente.count()) === 0) {
    await prisma.cliente.create({
      data: {
        nome: 'Lucas ERP',
        telefone: '11999999999',
        rua: 'Rua da Inovação',
        numero: '500',
        bairro: 'Centro',
        cidade: 'São Paulo',
        ativo: true,
      },
    });
  }

  if ((await prisma.produto.count()) === 0) {
    await prisma.produto.createMany({
      data: [
        {
          nome: 'X-Burger Pro',
          preco: 25.9,
          estoque: 50,
          categoriaId: categoriasMap.Lanches.id,
          descricao: 'Blend 180g e cheddar',
          ativo: true,
          disponivel: true,
        },
        {
          nome: 'Coca-Cola 350ml',
          preco: 6.5,
          estoque: 100,
          categoriaId: categoriasMap.Bebidas.id,
          descricao: 'Gelada',
          ativo: true,
          disponivel: true,
        },
        {
          nome: 'Pizza Calabresa',
          preco: 45,
          estoque: 20,
          categoriaId: categoriasMap.Pizzas.id,
          descricao: 'Artesanal',
          ativo: true,
          disponivel: true,
        },
      ],
    });
  }

  if (
    (await prisma.adminUser.count()) === 0 &&
    process.env.ADMIN_EMAIL &&
    process.env.ADMIN_PASSWORD
  ) {
    await prisma.adminUser.create({
      data: {
        nome: 'Administrador',
        email: process.env.ADMIN_EMAIL,
        passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
        role: 'admin',
        ativo: true,
      },
    });
  }

  console.log('Seeded ERP data');
}

main()
  .catch((error) => console.error(error))
  .finally(() => prisma.$disconnect());