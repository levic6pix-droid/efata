const { Server } = require('socket.io');
const { env } = require('./env');

let io;

const createSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        // Permitir todas as origens para garantir que o painel conecte corretamente independente do domínio (Vercel, Railway, etc)
        return callback(null, true);
      },
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket conectado:', socket.id);

    // Quando o painel abrir, ele pode pedir o status atual do WhatsApp
    socket.on('request_whatsapp_status', () => {
      console.log('Recebido pedido de status do WhatsApp');
      const whatsappService = require('../services/whatsapp-service');
      if (whatsappService.isReady) {
        console.log('Respondendo: Conectado');
        socket.emit('whatsapp_status', { connected: true });
      } else if (whatsappService.lastQr) {
        console.log('Respondendo: Enviando QR Cacheado');
        socket.emit('whatsapp_qr', { qr: whatsappService.lastQr });
      } else {
        console.log('Respondendo: Sem status ou QR ainda');
      }
    });
  });

  return io;
};

const getIo = () => io;

const emitSystemUpdate = (event, payload) => {
  if (io) {
    io.emit(event, payload);
    io.emit('dados_atualizados');
  }
};

module.exports = {
  createSocketServer,
  emitSystemUpdate,
  getIo,
};