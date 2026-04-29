const { Client } = require('pg');

const sql = `
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT false;
`;

async function updateDB() {
  const client = new Client({
    connectionString: "postgres://postgres:Bahia%40866019@db.bsbclyjesniebrpixvao.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('⏳ Conectando ao PostgreSQL do Supabase...');
    await client.connect();
    console.log('✅ Conectado! Aplicando atualizações...');
    await client.query(sql);
    console.log('🚀 BASE DE DADOS SINCRONIZADA COM SUCESSO!');
  } catch (err) {
    console.error('❌ ERRO AO SINCRONIZAR BASE:', err.message);
  } finally {
    await client.end();
  }
}

updateDB();
