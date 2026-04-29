const supabase = require('../config/supabase');

const SETTINGS_TABLE = 'settings';
const SETTINGS_ROW_ID = 1;

const DEFAULT_SETTINGS = {
  paymentMethods: {
    dinheiro: true,
    pix: true,
    cartao_credito: true,
    cartao_debito: true,
    max_parcelas: 1,
  },
  companyProfile: {
    tipo: 'pj',
    razaoSocial: '',
    nomeFantasia: 'Efatá Delivery',
    documento: '',
    endereco: '',
    telefone: '',
    pixKey: '',
  },
  deliveryFees: {
    tipo: 'fixo',
    taxaFixa: 0,
    porBairro: [],
  },
};

async function readSettings() {
  try {
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select('data')
      .eq('id', SETTINGS_ROW_ID)
      .maybeSingle();

    if (error) throw error;

    if (data?.data) {
      return {
        ...DEFAULT_SETTINGS,
        ...data.data,
      };
    }
  } catch (error) {
    console.warn('Erro ao ler configurações do Supabase:', error.message);
  }
  return DEFAULT_SETTINGS;
}

async function saveSettings(payload = {}) {
  try {
    const current = await readSettings();
    const updated = {
      ...current,
      ...payload,
    };

    const { error } = await supabase
      .from(SETTINGS_TABLE)
      .upsert([{ id: SETTINGS_ROW_ID, data: updated }], { onConflict: 'id' });

    if (error) throw error;
    return updated;
  } catch (error) {
    console.error('Erro ao salvar configurações no Supabase:', error.message);
    throw error;
  }
}

module.exports = {
  getSettings: readSettings,
  saveSettings,
};
