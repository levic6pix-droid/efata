const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('../config/env');
const { ADMIN_ROLE } = require('../constants');
const { HttpError } = require('../utils/http-error');

const getAuthPayload = (admin) => ({
  id: admin.id,
  nome: admin.nome,
  username: admin.username,
  role: admin.role,
});

const resolvedJwtSecret = env.jwtSecret || crypto.randomUUID();

const ensureDefaultAdmin = async () => {
  // Desativado: Agora usamos autenticação direta via .env para o painel
  return null;
};

const login = async ({ username, password }) => {
  console.log(`Tentativa de login: ${username}`);
  
  // Verifica contra as variáveis do .env (com trim para segurança)
  const envUser = (env.adminUsername || '').trim();
  const envPass = (env.adminPassword || '').trim();
  const isDefaultAdmin = username.trim() === envUser && password.trim() === envPass;

  if (!isDefaultAdmin) {
    console.log('Credenciais inválidas');
    throw new HttpError(401, 'Credenciais inválidas');
  }

  const admin = {
    id: 'admin',
    nome: 'Administrador',
    username: env.adminUsername,
    role: ADMIN_ROLE.ADMIN
  };

  const token = jwt.sign({ role: admin.role }, resolvedJwtSecret, {
    expiresIn: env.jwtExpiresIn,
    subject: String(admin.id),
  });

  return {
    token,
    user: getAuthPayload(admin),
  };
};

module.exports = {
  ensureDefaultAdmin,
  getAuthPayload,
  login,
  resolvedJwtSecret,
};