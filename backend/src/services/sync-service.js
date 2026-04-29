const { invalidateCache, getMenu } = require('./menu-service');
const { resetarConversasAtivas } = require('./session-service');

const sincronizarSistema = async () => {
  invalidateCache();
  resetarConversasAtivas();
  await getMenu(true);
};

module.exports = {
  sincronizarSistema
};
