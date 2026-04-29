const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function diagnostic() {
    console.log('--- DIAGNÓSTICO DE INSERÇÃO DE PRODUTO ---');
    
    // Teste 1: Inserção Mínima
    console.log('\nTeste 1: Inserção Mínima (Apenas nome e preço)...');
    const t1 = await supabase.from('produtos').insert([{ nome: 'TESTE DIAGNOSTICO', preco: 10.50 }]).select();
    if (t1.error) console.error('❌ Erro Teste 1:', t1.error.message);
    else console.log('✅ Teste 1 OK');

    // Teste 2: Inserção com UUID Inválido (Simulando o erro do painel)
    console.log('\nTeste 2: Inserção com categoria_id = "1" (Deve falhar se não houver blindagem)...');
    const t2 = await supabase.from('produtos').insert([{ nome: 'TESTE UUID', preco: 10, categoria_id: '1' }]);
    if (t2.error) console.log('✅ Teste 2 detectou o erro esperado:', t2.error.message);

    // Teste 3: Verificação de todas as colunas existentes
    console.log('\nTeste 3: Listando colunas reais da tabela...');
    const { data: cols } = await supabase.from('produtos').select('*').limit(1);
    if (cols && cols[0]) {
        console.log('Colunas encontradas no banco:', Object.keys(cols[0]).join(', '));
    } else {
        console.log('Tabela vazia, não foi possível listar colunas via select.');
    }
}
diagnostic();
