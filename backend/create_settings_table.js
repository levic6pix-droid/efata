const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL ou chave não configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSettingsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `;

  try {
    // Try to execute SQL directly (requires service role)
    const { data, error } = await supabase.rpc('exec', { query: sql });
    if (error) {
      console.log('⚠️  Não foi possível executar via RPC. Execute manualmente no painel do Supabase:');
      console.log(sql);
    } else {
      console.log('✅ Tabela settings criada com sucesso!');
    }
  } catch (error) {
    console.log('⚠️  Execute este SQL no painel do Supabase:');
    console.log(sql);
  }
}

createSettingsTable();