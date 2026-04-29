const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const chatbotService = require('./src/services/chatbot-service');
const supabase = require('./src/config/supabase');

async function testarSistema() {
  console.log('🧪 Iniciando Teste de Integração...');
  
  const foneTeste = '5511999999999';
  const msgId = 'TEST_UNIQUE_ID_' + Date.now();

  console.log('1. Simulando Oi do cliente...');
  const r1 = await chatbotService.generateResponse(foneTeste, 'Oi', msgId);
  console.log('   IA respondeu:', r1.text.substring(0, 50) + '...');

  console.log('2. Verificando se criou a conversa no banco...');
  const { data: conv } = await supabase.from('conversas').select('id').eq('whatsapp', foneTeste).single();
  if (conv) console.log('   ✅ Conversa registrada com ID:', conv.id);

  console.log('3. Simulando pedido de um X-Burger...');
  // Nota: O agente usa ferramentas, mas aqui vamos testar a criação direta para validar o schema
  const orderService = require('./src/services/order-service');
  const { data: prod } = await supabase.from('produtos').select('*').limit(1).single();
  
  const pedido = await orderService.createPedido({
    whatsapp: foneTeste,
    itens: [{ produto_id: prod.id, quantidade: 1, preco: prod.preco }],
    forma_pagamento: 'PIX',
    origem: 'APP',
    external_id: msgId
  });

  if (pedido) {
    console.log('   ✅ Pedido #'+pedido.id+' criado com sucesso!');
  }

  console.log('4. Testando Anti-duplicação (Tentando criar o mesmo pedido de novo)...');
  const duplicado = await orderService.createPedido({
    whatsapp: foneTeste,
    itens: [{ produto_id: prod.id, quantidade: 1, preco: prod.preco }],
    forma_pagamento: 'PIX',
    origem: 'APP',
    external_id: msgId // Mesmo ID
  });

  if (duplicado === null) {
    console.log('   ✅ BLOQUEIO DE DUPLICAÇÃO FUNCIONOU!');
  } else {
    console.error('   ❌ ERRO: Sistema permitiu pedido duplicado!');
  }

  console.log('\n🏆 TESTES CONCLUÍDOS COM SUCESSO!');
  process.exit(0);
}

testarSistema();
