const { MercadoPagoConfig, Payment } = require('mercadopago');
const settingsService = require('./settings-service');

class MercadoPagoService {
  constructor() {
    this.client = null;
    this.payment = null;
  }

  async init() {
    const token = process.env.MP_ACCESS_TOKEN || "SEU_TOKEN_MERCADO_PAGO";
    this.client = new MercadoPagoConfig({ accessToken: token });
    this.payment = new Payment(this.client);
  }

  async criarPagamentoPix(pedido) {
    if (!this.payment) await this.init();

    const body = {
      transaction_amount: Number(pedido.total),
      description: `Pedido Delivery #${pedido.id || 'NOVO'}`,
      payment_method_id: 'pix',
      notification_url: process.env.MP_WEBHOOK_URL, // Opcional, pode ser configurado no painel do MP
      payer: {
        email: pedido.email || 'cliente@delivery.com',
        first_name: pedido.nome.split(' ')[0],
        last_name: pedido.nome.split(' ').slice(1).join(' ') || 'Cliente',
      },
      metadata: {
        pedido_id: pedido.id,
        origem: 'EFATA_DELIVERY'
      }
    };

    const response = await this.payment.create({ body });
    
    return {
      id: response.id,
      status: response.status,
      qr_code: response.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: response.point_of_interaction.transaction_data.qr_code_base64,
    };
  }

  async buscarPagamento(id) {
    if (!this.payment) await this.init();
    return await this.payment.get({ id });
  }
}

module.exports = new MercadoPagoService();
