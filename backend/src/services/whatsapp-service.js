const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const chatbotService = require('./chatbot-service');
const { emitSystemUpdate } = require('../config/socket');
const supabase = require('../config/supabase');
const settingsService = require('./settings-service');

class WhatsAppService {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      qrMaxRetries: 100000,
      puppeteer: {
        headless: 'new',
        executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-extensions'
        ],
      }
    });

    this.isReady = false;
    this.lastQr = '';
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveMessage(conversaId, corpo, tipo) {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .insert([{ conversa_id: conversaId, mensagem: corpo, tipo }]);
      
      if (error) throw error;

      // Atualiza o timestamp da conversa para ordenação no painel
      await supabase
        .from('conversas')
        .update({ atualizado_em: new Date().toISOString() })
        .eq('id', conversaId);

      return data;
    } catch (err) {
      console.error('Erro ao salvar mensagem no Supabase:', err);
    }
  }

  async getOrCreateConversa(whatsapp) {
    try {
      // Busca conversa existente
      const { data: existing, error: findError } = await supabase
        .from('conversas')
        .select('*')
        .eq('whatsapp', whatsapp)
        .single();

      if (existing) return existing;

      // Cria nova se não existir
      const { data: created, error: createError } = await supabase
        .from('conversas')
        .insert([{ whatsapp, status: 'aberta' }])
        .select()
        .single();

      if (createError) throw createError;
      return created;
    } catch (err) {
      console.error('Erro ao gerenciar conversa no Supabase:', err);
    }
  }

  async enviarNotificacao(to, text) {
    if (!this.isReady) return;
    try {
      await this.client.sendMessage(to.includes('@c.us') ? to : `${to}@c.us`, text);
      console.log(`[WhatsApp] Notificação enviada para ${to}`);
    } catch (err) {
      console.error(`[WhatsApp] Erro ao enviar notificação:`, err.message);
    }
  }

  async enviarPedidoDelivery(pedido) {
    if (!this.isReady) return;
    try {
      const to = pedido.telefone.includes('@c.us') ? pedido.telefone : `${pedido.telefone.replace(/\D/g, '')}@c.us`;
      
      // 1. Gerar PIX se for PIX
      if (pedido.pagamento.toLowerCase().includes('pix')) {
        const settings = await settingsService.getSettings();
        const chave = settings.companyProfile.pixKey || process.env.PIX_CHAVE || "SEU-PIX-AQUI";
        const valor = Number(pedido.total).toFixed(2);
        // Payload PIX estático simplificado para o exemplo (BRCode real é recomendado)
        const payload = `00020126330014BR.GOV.BCB.PIX0111${chave}5204000053039865405${valor.replace('.','')}5802BR5914EFATA DELIVERY6008SAO PAULO62070503***6304`;
        
        const qrDataUrl = await QRCode.toDataURL(payload);
        const media = MessageMedia.fromDataURL(qrDataUrl);
        
        await this.client.sendMessage(to, `Perfeito, *${pedido.nome}*! 🙌\nPara finalizar, segue a forma de pagamento via PIX:\n\n🔑 Chave PIX:\n*${chave}*\n\n👉 Ou pague escaneando o QR Code abaixo 👇`);
        await this.client.sendMessage(to, media);
      }

      // 2. Enviar Resumo do Pedido
      const msg = `
📦 *PEDIDO DELIVERY REGISTRADO*

👤 *Cliente:* ${pedido.nome}
📞 *Contato:* ${pedido.telefone}

🛒 *Itens:*
${pedido.itens.map(i => `- ${i.nome} (x${i.quantidade})`).join("\n")}

💰 *Total:* R$ ${Number(pedido.total).toFixed(2)}

📍 *Endereço:*
${pedido.endereco}

💳 *Pagamento:* ${pedido.pagamento}

⏱️ *Tempo estimado:* 30-40 min
`;
      await this.client.sendMessage(to, msg);
      console.log(`[WhatsApp] Fluxo de delivery enviado para ${to}`);
    } catch (err) {
      console.error(`[WhatsApp] Erro no fluxo de delivery:`, err.message);
    }
  }

  async notificarErro(error) {
    const adminNum = process.env.ADMIN_WHATSAPP;
    if (!this.isReady || !adminNum) {
      console.error('[WhatsApp] Impossível notificar admin:', error.message);
      return;
    }

    try {
      const msg = `⚠️ *ALERTA DE SISTEMA*\n\nUm erro crítico ocorreu no servidor:\n\n*Erro:* ${error.message}\n*Hora:* ${new Date().toLocaleString()}\n\nO servidor está tentando reiniciar...`;
      await this.client.sendMessage(adminNum.includes('@c.us') ? adminNum : `${adminNum}@c.us`, msg);
      console.log('[WhatsApp] Administrador notificado sobre o erro.');
    } catch (err) {
      console.error('[WhatsApp] Erro ao notificar administrador:', err.message);
    }
  }

  getStatus() {
    return {
      connected: this.isReady,
      qr: this.lastQr
    };
  }

  async init(groqKey) {
    console.log('--- Iniciando WhatsApp Service (Supabase Integration) ---');
    
    await chatbotService.init(groqKey);

    this.client.on('qr', async (qr) => {
      console.log('ESCANEIE O QR CODE NO PAINEL OU NO TERMINAL:');
      qrcodeTerminal.generate(qr, { small: true });
      this.lastQr = qr;
      emitSystemUpdate('whatsapp_qr', { qr });

      // Salvar em arquivo para caso o terminal falhe
      try {
        const fs = require('fs');
        const path = require('path');
        const qrImage = await QRCode.toDataURL(qr);
        const base64Data = qrImage.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync(path.join(process.cwd(), 'whatsapp-qr.png'), base64Data, 'base64');
        console.log('✅ QR Code salvo em: backend/whatsapp-qr.png');
      } catch (err) {
        console.error('Erro ao salvar QR Code em arquivo:', err.message);
      }
    });

    this.client.on('ready', () => {
      console.log('✅ WhatsApp conectado com sucesso!');
      this.isReady = true;
      emitSystemUpdate('whatsapp_status', { connected: true });
    });

    this.client.on('message', async (msg) => {
      if (msg.from.includes('@g.us')) return;

      // Gerencia conversa no Supabase
      const conversa = await this.getOrCreateConversa(msg.from);
      if (!conversa) return;

      // Salva mensagem recebida no Supabase
      await this.saveMessage(conversa.id, msg.body, 'incoming');

      emitSystemUpdate('whatsapp_message', {
        from: msg.from,
        body: msg.body,
        timestamp: new Date(),
        type: 'incoming'
      });

      try {
        const response = await chatbotService.generateResponse(msg.from, msg.body);

        // ══════ FLUXO PIX MULTI-STEP (Alta Conversão) ══════
        if (response.pixCopiaECola) {
          // 1️⃣ Mensagem de confirmação do pedido
          await this.client.sendMessage(msg.from, response.text);
          await this._delay(500);

          // 2️⃣ Chave PIX "Copia e Cola" em mensagem separada (fácil de copiar)
          await this.client.sendMessage(msg.from, `🔑 *Chave PIX Copia e Cola:*\n\n${response.pixCopiaECola}`);
          await this._delay(500);

          // 3️⃣ Valor exato
          await this.client.sendMessage(msg.from, `💰 *Valor a pagar:* ${response.pixValor}\n\n📲 Cole a chave acima no app do seu banco ou escaneie o QR Code abaixo 👇`);
          await this._delay(300);

          // 4️⃣ QR Code como imagem
          if (response.media) {
            const qrMedia = MessageMedia.fromDataURL(response.media);
            await this.client.sendMessage(msg.from, qrMedia, { caption: '📱 QR Code PIX — Escaneie no app do banco' });
            await this._delay(300);
          }

          // 5️⃣ PDF com detalhes do pagamento
          if (response.pdf) {
            const pdfMedia = new MessageMedia('application/pdf', response.pdf.toString('base64'), response.pdfName || 'pagamento.pdf');
            await this.client.sendMessage(msg.from, pdfMedia);
            await this._delay(300);
          }

          // 6️⃣ Pedir comprovante
          if (response.pixFinalMsg) {
            await this.client.sendMessage(msg.from, response.pixFinalMsg);
          }

        // ══════ FLUXO NORMAL (sem PIX) ══════
        } else if (response.media) {
          const media = MessageMedia.fromDataURL(response.media);
          await this.client.sendMessage(msg.from, media, { caption: response.text });
        } else {
          await msg.reply(response.text);
        }

        // Salva resposta da IA no Supabase
        await this.saveMessage(conversa.id, response.text, 'outgoing');

        emitSystemUpdate('whatsapp_message', {
          from: msg.from,
          body: response.text,
          timestamp: new Date(),
          type: 'outgoing'
        });
      } catch (error) {
        console.error('Erro WhatsApp:', error);
      }
    });

    this.client.on('auth_failure', async (msg) => {
      console.error('❌ [WhatsApp] Falha na Autenticação:', msg);
      this.isReady = false;
      this.lastQr = '';
      try {
        await this.client.destroy();
        const fs = require('fs');
        fs.rmSync('.wwebjs_auth', { recursive: true, force: true });
        console.log('🗑️ Sessão antiga apagada. Reiniciando...');
        this.client.initialize().catch(e=>console.error(e));
      } catch (e) {}
    });

    this.client.on('disconnected', async (reason) => {
      console.error('❌ [WhatsApp] Cliente desconectado:', reason);
      this.isReady = false;
      this.lastQr = '';
      emitSystemUpdate('whatsapp_status', { connected: false });
      try {
        await this.client.destroy();
        setTimeout(() => {
          console.log('🔄 Reiniciando conexão...');
          this.client.initialize().catch(e=>console.error(e));
        }, 3000);
      } catch (e) {}
    });

    try {
      console.log('[WhatsApp] Tentando inicializar WhatsApp Web...');
      this.client.initialize().catch(err => {
        console.error('❌ [WhatsApp] Erro na promessa de inicialização:', err);
      });
    } catch (err) {
      console.error('❌ [WhatsApp] Erro síncrono na inicialização:', err);
    }
  }
}

module.exports = new WhatsAppService();
