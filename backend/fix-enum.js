require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixEnum() {
  console.log('⏳ Conectando ao Supabase...');
  console.log('URL:', supabaseUrl);

  // 1. First, let's check what the current status values look like
  console.log('\n📋 Verificando pedidos atuais...');
  const { data: pedidos, error: errPedidos } = await supabase
    .from('pedidos')
    .select('id, status')
    .limit(10);

  if (errPedidos) {
    console.error('Erro ao ler pedidos:', errPedidos);
  } else {
    console.log('Pedidos encontrados:', pedidos);
  }

  // 2. Try to update a pedido status to 'pronto' to see the exact error
  if (pedidos && pedidos.length > 0) {
    const testId = pedidos[0].id;
    console.log(`\n🧪 Testando update de status para 'pronto' no pedido ${testId}...`);

    const { data: testData, error: testError } = await supabase
      .from('pedidos')
      .update({ status: 'pronto' })
      .eq('id', testId)
      .select('id, status')
      .single();

    if (testError) {
      console.error('❌ Erro ao testar update:', JSON.stringify(testError, null, 2));

      // 3. Try via RPC to alter the column type
      console.log('\n🔧 Tentando converter coluna via RPC...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
        query: "ALTER TABLE pedidos ALTER COLUMN status TYPE TEXT USING status::TEXT; DROP TYPE IF EXISTS status_pedido;"
      });

      if (rpcError) {
        console.error('RPC não disponível:', rpcError.message);
        console.log('\n⚠️  SOLUÇÃO MANUAL NECESSÁRIA:');
        console.log('Execute este SQL no Editor SQL do Supabase Dashboard:');
        console.log('---');
        console.log('ALTER TABLE pedidos ALTER COLUMN status TYPE TEXT USING status::TEXT;');
        console.log('DROP TYPE IF EXISTS status_pedido;');
        console.log('ALTER TABLE pedidos ALTER COLUMN status SET DEFAULT \'recebido\';');
        console.log('---');
        console.log('\nURL do Dashboard: https://supabase.com/dashboard/project/bsbclyjesniebrpixvao/sql/new');
      } else {
        console.log('✅ Coluna convertida com sucesso via RPC!');
      }
    } else {
      console.log('✅ Update funcionou! Status atualizado para:', testData.status);

      // Revert back to preparo for testing
      await supabase.from('pedidos').update({ status: 'preparo' }).eq('id', testId);
      console.log('↩️  Revertido para preparo.');
    }
  }
}

fixEnum();
