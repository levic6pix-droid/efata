const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function inspect() {
    const { data, error } = await supabase.rpc('get_columns', { table_name: 'produtos' });
    if (error) {
        // Fallback: tentar listar um registro para ver as chaves
        const { data: records } = await supabase.from('produtos').select('*').limit(1);
        console.log('Colunas detectadas:', records && records[0] ? Object.keys(records[0]) : 'Nenhum registro para inspecionar');
    } else {
        console.log('Colunas via RPC:', data);
    }
}
inspect();
