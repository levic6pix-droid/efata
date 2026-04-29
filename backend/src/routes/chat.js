const express = require('express');
const supabase = require('../config/supabase');
const chatbotService = require('../services/chatbot-service');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// Lista todas as conversas ativas (para o WhatsApp Monitor)
// ─────────────────────────────────────────────────────────────
router.get('/chat/conversas', async (req, res) => {
  try {
    const conversas = await chatbotService.listarConversas();
    res.json(conversas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Mensagens de uma conversa específica por telefone
// ─────────────────────────────────────────────────────────────
router.get('/chat/conversa/:phone', async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const mensagens = await chatbotService.listarMensagens(phone);
    res.json(mensagens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Histórico bruto do Supabase (últimas N mensagens globais)
// ─────────────────────────────────────────────────────────────
router.get('/chat/historico', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const { data, error } = await supabase
      .from('mensagens_chatbot')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;