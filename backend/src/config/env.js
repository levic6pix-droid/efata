require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });

const toList = (value, fallback = []) =>
  value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : fallback;

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  groqApiKey: process.env.GROQ_API_KEY || '',
  corsOrigins: toList(process.env.CORS_ORIGINS, ['http://localhost:5173', 'http://localhost:5174']),
  socketOrigins: toList(process.env.SOCKET_ORIGINS, ['http://localhost:5173', 'http://localhost:5174']),
  uploadMaxSizeMb: Number(process.env.UPLOAD_MAX_SIZE_MB || 5),
  uploadAllowedTypes: toList(process.env.UPLOAD_ALLOWED_TYPES, ['image/jpeg', 'image/png', 'image/webp']),
  adminUsername: process.env.ADMIN_USERNAME || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  clientAppUrl: process.env.CLIENT_APP_URL || 'http://localhost:5173',
  panelAppUrl: process.env.PANEL_APP_URL || 'http://localhost:5174',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_ANON_KEY || '',
};

const validateEnv = () => {
  const required = ['supabaseUrl', 'supabaseKey', 'groqApiKey'];
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️ Aviso: Faltam variáveis de ambiente: ${missing.join(', ')}`);
  }
};

module.exports = {
  env,
  validateEnv,
};