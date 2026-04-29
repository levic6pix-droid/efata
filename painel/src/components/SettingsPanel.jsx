import { Shield, Globe, Database, CreditCard, Truck, Plus, Trash2, Building2, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import http from '../services/http';

const TABS = [
  { id: 'pagamentos',  label: 'Formas de Pagamento', icon: CreditCard,  color: '#6366f1' },
  { id: 'empresa',     label: 'Dados da Empresa',     icon: Building2,   color: '#8b5cf6' },
  { id: 'entrega',     label: 'Taxas de Entrega',     icon: Truck,       color: '#f59e0b' },
  { id: 'integracoes', label: 'Integrações (APIs)',   icon: Globe,       color: '#ec4899' },
  { id: 'seguranca',   label: 'Segurança & Ambiente', icon: Lock,        color: '#14b8a6' },
  { id: 'banco',       label: 'Banco de Dados',       icon: Database,    color: '#f97316' },
];

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  fontSize: 14,
  background: 'white',
  outline: 'none',
  boxSizing: 'border-box',
};

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('pagamentos');

  const handleTabChange = (id) => {
    console.log('Trocando aba para:', id);
    setActiveTab(id);
  };

  const [paymentMethods, setPaymentMethods] = useState({
    dinheiro: true, pix: true, cartao_credito: true, cartao_debito: true, max_parcelas: 1,
  });

  const [deliveryFees, setDeliveryFees] = useState({
    tipo: 'fixo', taxaFixa: 0, porBairro: [],
  });

  const [companyProfile, setCompanyProfile] = useState({
    tipo: 'pj', razaoSocial: '', nomeFantasia: '', documento: '',
    inscricaoEstadual: '', inscricaoMunicipal: '', endereco: '', numero: '',
    bairro: '', cidade: '', cep: '', telefone: '', whatsapp: '', email: '', site: '',
    pixKey: '',
  });

  const [integrations, setIntegrations] = useState({
    pix: { enabled: true, access_token: '', auto_confirm: true },
    whatsapp: { enabled: true, api_url: '', token: '' },
    printer: { enabled: true, auto_print: true }
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    http.get('/settings').then(res => {
      const d = res.data || {};
      if (d.paymentMethods) setPaymentMethods(prev => ({ ...prev, ...d.paymentMethods }));
      if (d.companyProfile) setCompanyProfile(prev => ({ ...prev, ...d.companyProfile }));
      if (d.deliveryFees) setDeliveryFees(prev => ({ ...prev, ...d.deliveryFees }));
      if (d.integrations) setIntegrations(prev => ({ ...prev, ...d.integrations }));
    }).catch(err => console.error('Erro ao carregar settings:', err));
  }, []);

  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const persist = async (payload) => {
    try { 
      await http.post('/settings', payload); 
      flashSaved();
    } catch (err) {
      console.error('Erro ao salvar configurações no Supabase:', err);
    }
  };

  const savePaymentMethods = (v) => {
    setPaymentMethods(v);
    persist({ paymentMethods: v, companyProfile, deliveryFees, integrations });
  };
  const saveCompanyProfile = (v) => {
    setCompanyProfile(v);
    persist({ paymentMethods, companyProfile: v, deliveryFees, integrations });
  };
  const saveDeliveryFees = (v) => {
    setDeliveryFees(v);
    persist({ paymentMethods, companyProfile, deliveryFees: v, integrations });
  };
  const saveIntegrations = (v) => {
    setIntegrations(v);
    persist({ paymentMethods, companyProfile, deliveryFees, integrations: v });
  };

  const methodLabels = {
    dinheiro: 'Dinheiro', pix: 'PIX',
    cartao_credito: 'Cartão de Crédito', cartao_debito: 'Cartão de Débito',
  };

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div style={{ display: 'flex', gap: 24, height: '100%', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>

      {/* ── Sidebar de navegação ── */}
      <div className="table-container" style={{ width: 230, flexShrink: 0, padding: 12, display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px 8px' }}>
          Configurações
        </p>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: active ? `${tab.color}15` : 'transparent',
                color: active ? tab.color : 'var(--text-muted)',
                fontWeight: active ? 700 : 500, fontSize: 14,
                textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} color={active ? tab.color : '#94a3b8'} />
              {tab.label}
            </button>
          );
        })}

        {saved && (
          <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 10, background: '#f0fff4', color: '#16a34a', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
            ✓ Salvo!
          </div>
        )}
      </div>

      {/* ── Conteúdo da aba ── */}
      <div className="table-container" style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, minHeight: 400 }}>

        {/* Header da aba */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <div style={{ background: `${currentTab.color}15`, padding: 12, borderRadius: 12 }}>
            {(() => { const Icon = currentTab.icon; return <Icon size={22} color={currentTab.color} />; })()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--secondary)' }}>{currentTab.label}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              {activeTab === 'pagamentos' && 'Ative ou desative os métodos aceitos pelo PDV e pelo chatbot WhatsApp.'}
              {activeTab === 'empresa' && 'Dados fiscais exibidos em comandas, cupons e QR Code PIX.'}
              {activeTab === 'entrega' && 'Configure o valor cobrado pela entrega dos pedidos.'}
              {activeTab === 'integracoes' && 'Configure tokens do PIX, automação de WhatsApp e opções de impressão.'}
              {activeTab === 'seguranca' && 'Chaves sensíveis gerenciadas com segurança no backend.'}
              {activeTab === 'banco' && 'Informações sobre o banco de dados e sincronização em tempo real.'}
            </p>
          </div>
        </div>

        {/* ─── ABA: PAGAMENTOS ─── */}
        {activeTab === 'pagamentos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'].map(method => (
              <div key={method} style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--secondary)' }}>{methodLabels[method]}</span>
                  <div
                    onClick={() => savePaymentMethods({ ...paymentMethods, [method]: !paymentMethods[method] })}
                    style={{
                      width: 46, height: 26, borderRadius: 13, cursor: 'pointer', transition: 'background 0.2s',
                      background: paymentMethods[method] ? 'var(--primary)' : '#cbd5e1',
                      position: 'relative', flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, left: paymentMethods[method] ? 22 : 3,
                      width: 20, height: 20, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                </label>

                {method === 'pix' && paymentMethods.pix && (
                  <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>CHAVE PIX PARA RECEBIMENTO</span>
                    <input
                      type="text"
                      value={companyProfile.pixKey || ''}
                      onChange={e => saveCompanyProfile({ ...companyProfile, pixKey: e.target.value })}
                      placeholder="E-mail, CPF, CNPJ ou Chave Aleatória"
                      style={inputStyle}
                    />
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Esta chave será usada para gerar os QR Codes no WhatsApp e PDV.</p>
                  </div>
                )}

                {method === 'cartao_credito' && paymentMethods.cartao_credito && (
                  <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Limite de parcelamento</span>
                    <select
                      value={paymentMethods.max_parcelas || 1}
                      onChange={e => savePaymentMethods({ ...paymentMethods, max_parcelas: Number(e.target.value) })}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'white' }}
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                        <option key={n} value={n}>Até {n}x</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── ABA: EMPRESA ─── */}
        {activeTab === 'empresa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Tipo de Pessoa">
                <select value={companyProfile.tipo} onChange={e => saveCompanyProfile({ ...companyProfile, tipo: e.target.value })} style={inputStyle}>
                  <option value="pj">Pessoa Jurídica</option>
                  <option value="pf">Pessoa Física</option>
                </select>
              </Field>
              <Field label="Nome Fantasia">
                <input type="text" value={companyProfile.nomeFantasia} onChange={e => saveCompanyProfile({ ...companyProfile, nomeFantasia: e.target.value })} style={inputStyle} placeholder="Nome de exibição" />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Razão Social / Nome">
                <input type="text" value={companyProfile.razaoSocial} onChange={e => saveCompanyProfile({ ...companyProfile, razaoSocial: e.target.value })} style={inputStyle} placeholder="Razão social ou nome completo" />
              </Field>
              <Field label={companyProfile.tipo === 'pf' ? 'CPF' : 'CNPJ'}>
                <input type="text" value={companyProfile.documento} onChange={e => saveCompanyProfile({ ...companyProfile, documento: e.target.value })} style={inputStyle} placeholder={companyProfile.tipo === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Inscrição Estadual">
                <input type="text" value={companyProfile.inscricaoEstadual} onChange={e => saveCompanyProfile({ ...companyProfile, inscricaoEstadual: e.target.value })} style={inputStyle} placeholder="Inscrição Estadual" />
              </Field>
              <Field label="Inscrição Municipal">
                <input type="text" value={companyProfile.inscricaoMunicipal} onChange={e => saveCompanyProfile({ ...companyProfile, inscricaoMunicipal: e.target.value })} style={inputStyle} placeholder="Inscrição Municipal" />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
              <Field label="Endereço">
                <input type="text" value={companyProfile.endereco} onChange={e => saveCompanyProfile({ ...companyProfile, endereco: e.target.value })} style={inputStyle} placeholder="Rua, avenida, travessa..." />
              </Field>
              <Field label="Número">
                <input type="text" value={companyProfile.numero} onChange={e => saveCompanyProfile({ ...companyProfile, numero: e.target.value })} style={inputStyle} placeholder="Número" />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Field label="Bairro">
                <input type="text" value={companyProfile.bairro} onChange={e => saveCompanyProfile({ ...companyProfile, bairro: e.target.value })} style={inputStyle} placeholder="Bairro" />
              </Field>
              <Field label="Cidade">
                <input type="text" value={companyProfile.cidade} onChange={e => saveCompanyProfile({ ...companyProfile, cidade: e.target.value })} style={inputStyle} placeholder="Cidade" />
              </Field>
              <Field label="CEP">
                <input type="text" value={companyProfile.cep} onChange={e => saveCompanyProfile({ ...companyProfile, cep: e.target.value })} style={inputStyle} placeholder="00000-000" />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Telefone">
                <input type="text" value={companyProfile.telefone} onChange={e => saveCompanyProfile({ ...companyProfile, telefone: e.target.value })} style={inputStyle} placeholder="(00) 0000-0000" />
              </Field>
              <Field label="WhatsApp">
                <input type="text" value={companyProfile.whatsapp} onChange={e => saveCompanyProfile({ ...companyProfile, whatsapp: e.target.value })} style={inputStyle} placeholder="(00) 00000-0000" />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="E-mail">
                <input type="text" value={companyProfile.email} onChange={e => saveCompanyProfile({ ...companyProfile, email: e.target.value })} style={inputStyle} placeholder="contato@empresa.com.br" />
              </Field>
              <Field label="Site">
                <input type="text" value={companyProfile.site} onChange={e => saveCompanyProfile({ ...companyProfile, site: e.target.value })} style={inputStyle} placeholder="www.empresa.com.br" />
              </Field>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
              <Field label="Chave PIX (Para Recebimentos)">
                <input 
                  type="text" 
                  value={companyProfile.pixKey || ''} 
                  onChange={e => saveCompanyProfile({ ...companyProfile, pixKey: e.target.value })} 
                  style={{ ...inputStyle, borderColor: 'var(--primary)', borderWidth: 2 }} 
                  placeholder="E-mail, CPF, CNPJ ou Chave Aleatória" 
                />
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Esta chave é utilizada para gerar o QR Code enviado automaticamente no WhatsApp e impresso nos cupons.
                </p>
              </Field>
            </div>
          </div>
        )}

        {/* ─── ABA: TAXAS DE ENTREGA ─── */}
        {activeTab === 'entrega' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ value: 'fixo', label: '📌 Taxa Fixa' }, { value: 'bairro', label: '📍 Por Bairro' }].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => saveDeliveryFees({ ...deliveryFees, tipo: opt.value })}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 10, border: '2px solid',
                    borderColor: deliveryFees.tipo === opt.value ? '#f59e0b' : 'var(--border)',
                    background: deliveryFees.tipo === opt.value ? '#fffbeb' : 'white',
                    color: deliveryFees.tipo === opt.value ? '#b45309' : 'var(--text-muted)',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {deliveryFees.tipo === 'fixo' && (
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--secondary)', display: 'block' }}>Valor da taxa fixa</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aplicada a todos os pedidos delivery</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>R$</span>
                  <input
                    type="number" min="0" step="0.50"
                    value={deliveryFees.taxaFixa}
                    onChange={e => saveDeliveryFees({ ...deliveryFees, taxaFixa: Number(e.target.value) })}
                    style={{ width: 100, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 16, fontWeight: 700, textAlign: 'right', background: 'white' }}
                  />
                </div>
              </div>
            )}

            {deliveryFees.tipo === 'bairro' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {deliveryFees.porBairro.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', margin: 0, padding: '20px 0' }}>
                    Nenhum bairro cadastrado. Clique em "Adicionar Bairro" abaixo.
                  </p>
                )}
                {deliveryFees.porBairro.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: 12 }}>
                    <input
                      type="text" placeholder="Nome do bairro"
                      value={item.bairro}
                      onChange={e => {
                        const updated = deliveryFees.porBairro.map((b, i) => i === index ? { ...b, bairro: e.target.value } : b);
                        saveDeliveryFees({ ...deliveryFees, porBairro: updated });
                      }}
                      style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'white' }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>R$</span>
                    <input
                      type="number" min="0" step="0.50" placeholder="0,00"
                      value={item.taxa}
                      onChange={e => {
                        const updated = deliveryFees.porBairro.map((b, i) => i === index ? { ...b, taxa: Number(e.target.value) } : b);
                        saveDeliveryFees({ ...deliveryFees, porBairro: updated });
                      }}
                      style={{ width: 90, padding: '9px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, fontWeight: 600, textAlign: 'right', background: 'white' }}
                    />
                    <button
                      onClick={() => saveDeliveryFees({ ...deliveryFees, porBairro: deliveryFees.porBairro.filter((_, i) => i !== index) })}
                      style={{ background: '#fee2e2', border: 'none', borderRadius: 8, padding: '9px 11px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => saveDeliveryFees({ ...deliveryFees, porBairro: [...deliveryFees.porBairro, { bairro: '', taxa: 0 }] })}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 10, border: '2px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  <Plus size={16} /> Adicionar Bairro
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── ABA: INTEGRAÇÕES ─── */}
        {activeTab === 'integracoes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* PIX */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--secondary)' }}>💳 Integração PIX (Mercado Pago)</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  <input type="checkbox" checked={integrations?.pix?.enabled || false} onChange={e => saveIntegrations({...integrations, pix: {...integrations?.pix, enabled: e.target.checked}})} />
                  Ativar
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Access Token">
                  <input type="password" placeholder="APP_USR-..." value={integrations?.pix?.access_token || ''} onChange={e => saveIntegrations({...integrations, pix: {...integrations?.pix, access_token: e.target.value}})} style={inputStyle} />
                </Field>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={integrations?.pix?.auto_confirm || false} onChange={e => saveIntegrations({...integrations, pix: {...integrations?.pix, auto_confirm: e.target.checked}})} />
                  Confirmação automática de pedidos após pagamento
                </label>
              </div>
            </div>

            {/* WhatsApp */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--secondary)' }}>📲 Integração WhatsApp</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  <input type="checkbox" checked={integrations?.whatsapp?.enabled || false} onChange={e => saveIntegrations({...integrations, whatsapp: {...integrations?.whatsapp, enabled: e.target.checked}})} />
                  Ativar
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="API URL Base">
                  <input type="text" placeholder="https://api.whatsapp..." value={integrations?.whatsapp?.api_url || ''} onChange={e => saveIntegrations({...integrations, whatsapp: {...integrations?.whatsapp, api_url: e.target.value}})} style={inputStyle} />
                </Field>
                <Field label="Token / Chave de Autenticação">
                  <input type="password" placeholder="Token da API" value={integrations?.whatsapp?.token || ''} onChange={e => saveIntegrations({...integrations, whatsapp: {...integrations?.whatsapp, token: e.target.value}})} style={inputStyle} />
                </Field>
              </div>
            </div>

            {/* Impressora */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--secondary)' }}>🖨️ Configuração de Impressão</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  <input type="checkbox" checked={integrations?.printer?.enabled || false} onChange={e => saveIntegrations({...integrations, printer: {...integrations?.printer, enabled: e.target.checked}})} />
                  Ativar
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={integrations?.printer?.auto_print || false} onChange={e => saveIntegrations({...integrations, printer: {...integrations?.printer, auto_print: e.target.checked}})} />
                  Disparar impressão automaticamente ao confirmar pedido (PIX ou PDV)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ─── ABA: SEGURANÇA ─── */}
        {activeTab === 'seguranca' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Chave JWT', desc: 'Usada para autenticação segura dos tokens de sessão. Definida via variável de ambiente JWT_SECRET.', color: '#14b8a6' },
              { label: 'Chave Groq AI', desc: 'Integração com o modelo de linguagem Groq (llama3). Configurada em GROQ_API_KEY no arquivo .env do backend.', color: '#6366f1' },
              { label: 'Supabase Keys', desc: 'SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são carregadas do ambiente — nunca expostas ao frontend.', color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: 14, color: 'var(--secondary)', display: 'block', marginBottom: 4 }}>{item.label}</strong>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
              ⚠️ <strong>Nunca</strong> insira chaves de API diretamente no código-fonte. Sempre use variáveis de ambiente (arquivo <code>.env</code>) e adicione esse arquivo ao <code>.gitignore</code>.
            </div>
          </div>
        )}

        {/* ─── ABA: BANCO DE DADOS ─── */}
        {activeTab === 'banco' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Provedor', value: 'Supabase (PostgreSQL)', icon: '🟢' },
              { label: 'Sincronização', value: 'Tempo real via Socket.IO', icon: '⚡' },
              { label: 'Autenticação DB', value: 'Row Level Security (RLS) via Supabase', icon: '🔒' },
              { label: 'ORM', value: 'Prisma Client + Supabase JS SDK', icon: '🛠️' },
              { label: 'Ambiente', value: 'Nuvem — sem banco local em produção', icon: '☁️' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: 12, padding: '14px 20px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--secondary)' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default SettingsPanel;