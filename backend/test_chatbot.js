const chatbot = require('./src/services/chatbot-service');

(async () => {
  try {
    console.log('Iniciando testes do chatbot...');

    // Simula ENDERECO com CEP válido (01001-000 é CEP de teste do ViaCEP)
    const sess = { estado: 'ENDERECO', carrinho: [], categoriaAtual: null, tipo: 'DELIVERY' };
    console.log('\n> Testando CEP válido (01001000)...');
    const resp = await chatbot._processar('testphone', '01001000', '01001000', sess);
    console.log('Resposta:', resp);
    console.log('Sessão após CEP:', sess);

    // Simula NUMERO (número + complemento). Evita chamar getSettings substituindo _menuPagamento.
    chatbot._menuPagamento = async () => 'MENU PAGAMENTO (mock)\n1️⃣ PIX\n2️⃣ Cartão\n3️⃣ Dinheiro';
    const sess2 = { estado: 'NUMERO', enderecoBase: sess.enderecoBase, carrinho: [], tipo: 'DELIVERY' };
    console.log('\n> Testando número e complemento ("123, Apto 2")...');
    const resp2 = await chatbot._processar('testphone', '123, Apto 2', '123, apto 2', sess2);
    console.log('Resposta:', resp2);
    console.log('Sessão após número:', sess2);

    // Testa CEP inválido
    const sess3 = { estado: 'ENDERECO', carrinho: [], categoriaAtual: null, tipo: 'DELIVERY' };
    console.log('\n> Testando CEP inválido (00000000)...');
    const resp3 = await chatbot._processar('testphone', '00000000', '00000000', sess3);
    console.log('Resposta CEP inválido:', resp3);
    console.log('Sessão após CEP inválido:', sess3);

    // Testa endereço digitado manualmente
    const sess4 = { estado: 'ENDERECO', carrinho: [], categoriaAtual: null, tipo: 'DELIVERY' };
    console.log('\n> Testando endereço manual ("Rua das Flores 123, Centro")...');
    const resp4 = await chatbot._processar('testphone', 'Rua das Flores 123, Centro', 'rua das flores 123, centro', sess4);
    console.log('Resposta endereço manual:', resp4);
    console.log('Sessão após endereço manual:', sess4);

    console.log('\nTestes finalizados.');
  } catch (err) {
    console.error('Erro no teste:', err);
  }
})();