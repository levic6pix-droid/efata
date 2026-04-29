const jwt = require('jsonwebtoken');
const { resolvedJwtSecret } = require('../services/auth-service');
const { ADMIN_ROLE } = require('../constants');

const extractToken = (header = '') => {
  if (!header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7);
};

const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization || '');
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    let payload;
    try {
      payload = jwt.verify(token, resolvedJwtSecret);
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    if (!payload?.sub) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Como migramos para o Supabase e usamos login via .env,
    // apenas validamos se o payload contém o role correto.
    if (payload.role !== ADMIN_ROLE.ADMIN) {
      return res.status(401).json({ error: 'Acesso restrito' });
    }

    // Criamos o objeto de usuário virtual para os próximos middlewares
    req.user = {
      id: payload.sub,
      role: payload.role,
      nome: 'Administrador'
    };

    return next();
  } catch (error) {
    console.error('[Auth Middleware] Erro:', error.message);
    return res.status(500).json({ error: 'Erro interno ao autenticar' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  return next();
};

module.exports = {
  authenticate,
  requireRole,
};