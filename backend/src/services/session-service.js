let sessoes = {};

const getSessao = (userId) => {
  if (!sessoes[userId]) {
    sessoes[userId] = { nome: null, carrinho: [], tipo: null, endereco: null, pagamento: null, history: [] };
  }
  return sessoes[userId];
};

const resetSessao = (userId) => {
  sessoes[userId] = { nome: null, carrinho: [], tipo: null, endereco: null, pagamento: null, history: [] };
  return sessoes[userId];
};

const resetarConversasAtivas = () => {
  sessoes = {};
};

const totalSessoes = () => {
  return Object.keys(sessoes).length;
};

module.exports = {
  getSessao,
  resetSessao,
  resetarConversasAtivas,
  totalSessoes
};
