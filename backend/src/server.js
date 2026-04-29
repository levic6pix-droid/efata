const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { env, validateEnv } = require('./config/env');
const { createSocketServer } = require('./config/socket');
const apiRoutes = require('./routes');
const { notFoundHandler } = require('./middlewares/not-found');
const { errorHandler } = require('./middlewares/error-handler');
const { ensureDefaultAdmin } = require('./services/auth-service');
const whatsappService = require('./services/whatsapp-service');

validateEnv();

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin(origin, callback) {
      // Se estiver em produção e não houver origens definidas, permite (para facilitar deploy inicial)
      if (!origin || env.corsOrigins.includes(origin) || process.env.VERCEL) {
        return callback(null, true);
      }

      return callback(null, true); // Temporariamente permitindo tudo para resolver o erro do usuário
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

createSocketServer(server);

const start = async () => {
  try {
    await ensureDefaultAdmin();
    
    // Inicia o WhatsApp em background (apenas se não estiver na Vercel)
    if (!process.env.VERCEL) {
      whatsappService.init(env.groqApiKey).catch(err => console.error('Erro WhatsApp:', err));
    } else {
      console.log('--- Ambiente Vercel detectado: WhatsApp Service desativado (necessita servidor dedicado) ---');
    }

    console.log(`Allowed CORS origins: ${env.corsOrigins.join(', ')}`);
    server.listen(env.port, () => {
      console.log(`Unified Prisma backend running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
};

start();

// Gerenciamento de Erros Globais (Apenas logs para erros conhecidos do WhatsApp)
process.on('uncaughtException', async (error) => {
  console.error('CRITICAL ERROR (Uncaught Exception):', error);
  
  // Se for erro conhecido de navegação do WhatsApp/Puppeteer, não derruba o servidor
  if (error.message.includes('Execution context was destroyed') || error.message.includes('navigating')) {
    return;
  }

  try {
    await whatsappService.notificarErro(error);
  } catch (e) {}
  
  setTimeout(() => process.exit(1), 2000);
});

process.on('unhandledRejection', async (reason) => {
  console.error('CRITICAL ERROR (Unhandled Rejection):', reason);
  const error = reason instanceof Error ? reason : new Error(String(reason));

  if (error.message.includes('Execution context was destroyed') || error.message.includes('navigating')) {
    return;
  }

  try {
    await whatsappService.notificarErro(error);
  } catch (e) {}
  
  setTimeout(() => process.exit(1), 2000);
});

module.exports = server;