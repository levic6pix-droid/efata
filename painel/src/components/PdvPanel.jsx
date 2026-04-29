import { useState, useMemo, useEffect } from 'react';
import http from '../services/http';
import { Search, Trash2, Plus, Minus, Printer, CheckCircle, MapPin, History, Edit2, ShoppingBag, User, QrCode, Store } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';

function PdvPanel({ clientes, products, onOrderCreated }) {
  const [clienteId, setClienteId] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [tipoPedido, setTipoPedido] = useState('ENTREGA'); // 'ENTREGA' ou 'RETIRADA'
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [carrinho, setCarrinho] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [showAskPixModal, setShowAskPixModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showPixModal) {
        setShowPixModal(false);
        processarFinalizacao();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPixModal]);
  const [lastOrder, setLastOrder] = useState(null);
  const [parcelasSelecionadas, setParcelasSelecionadas] = useState(1);
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [novoClienteForm, setNovoClienteForm] = useState({ nome:'', telefone:'', cep:'', rua:'', numero:'', bairro:'', cidade:'', endereco:'' });
  const [activePaymentMethods, setActivePaymentMethods] = useState({
    dinheiro: true, pix: true, cartao_credito: true, cartao_debito: true, max_parcelas: 1
  });
  const [companyProfile, setCompanyProfile] = useState(null);
  const [deliveryFees, setDeliveryFees] = useState({ tipo: 'fixo', taxaFixa: 0, porBairro: [] });

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    let socket;

    const loadSettings = async () => {
      try {
        const res = await http.get('/settings');
        if (res.data?.paymentMethods) {
          setActivePaymentMethods(res.data.paymentMethods);
          const firstActive = Object.keys(res.data.paymentMethods).find(k => res.data.paymentMethods[k]);
          if (firstActive) setFormaPagamento(firstActive);
        }
        if (res.data?.companyProfile) setCompanyProfile(res.data.companyProfile);
        if (res.data?.deliveryFees) setDeliveryFees(res.data.deliveryFees);
      } catch (err) {
        console.warn('Erro ao carregar configurações:', err.message);
      }
    };

    loadSettings();

    try {
      socket = io(socketUrl, { transports: ['websocket'] });
      
      socket.on('dados_atualizados', () => {
        loadSettings();
        if (onOrderCreated) onOrderCreated();
      });

      socket.on('novo_pedido', (pedido) => {
        // Alerta sonoro amigável para novos pedidos
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
        if (onOrderCreated) onOrderCreated();
      });

      socket.on('pedido_atualizado', () => {
        if (onOrderCreated) onOrderCreated();
      });
    } catch (err) {
      console.warn('Erro ao conectar socket:', err);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [onOrderCreated]);

  // ⚠️ clienteSelecionado deve ser declarado ANTES de taxaEntrega
  const clienteSelecionado = useMemo(
    () => clientes.find((c) => String(c.id) === String(clienteId)),
    [clienteId, clientes]
  );

  const subtotal = useMemo(
    () => carrinho.reduce((sum, item) => sum + Number(item.preco) * Number(item.quantidade), 0),
    [carrinho]
  );

  const taxaEntrega = useMemo(() => {
    if (tipoPedido === 'RETIRADA') return 0;
    if (deliveryFees.tipo === 'fixo') return Number(deliveryFees.taxaFixa) || 0;
    if (deliveryFees.tipo === 'bairro' && clienteSelecionado?.bairro) {
      const match = deliveryFees.porBairro.find(
        (b) => b.bairro.toLowerCase().trim() === (clienteSelecionado.bairro || '').toLowerCase().trim()
      );
      return match ? Number(match.taxa) : 0;
    }
    return 0;
  }, [deliveryFees, clienteSelecionado, tipoPedido]);

  const total = useMemo(() => subtotal + taxaEntrega, [subtotal, taxaEntrega]);

  const documentLabel = companyProfile?.tipo === 'pf' ? 'CPF' : 'CNPJ';
  const companyName = companyProfile?.nomeFantasia || 'EFATA DELIVERY';
  const companyDoc = companyProfile?.documento ? `${documentLabel}: ${companyProfile.documento}` : null;
  const companyAddress = companyProfile?.endereco ? `${companyProfile.endereco}${companyProfile.numero ? `, ${companyProfile.numero}` : ''}${companyProfile.bairro ? ` - ${companyProfile.bairro}` : ''}${companyProfile.cidade ? ` / ${companyProfile.cidade}` : ''}` : '';

  const getFallbackImage = (categoryName = '', productName = '') => {
    const cat = categoryName.toLowerCase();
    const prod = productName.toLowerCase();
    if (prod.includes('coca')) return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80';
    if (cat.includes('hamburguer') || cat.includes('burger') || cat.includes('lanche')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80';
    if (cat.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80';
    if (cat.includes('bebida')) return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=500&q=80';
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80';
  };

  const categoriasMenu = ['Todos', ...new Set(products.map(p => p.categoria?.nome || 'Outros'))];

  const produtosFiltrados = products.filter(p => {
    if (p.ativo === false || p.disponivel === false) return false;
    if (categoriaAtiva !== 'Todos' && p.categoria?.nome !== categoriaAtiva) return false;
    if (buscaProduto && !p.nome.toLowerCase().includes(buscaProduto.toLowerCase())) return false;
    return true;
  });

  const updateCartQuantity = (id, delta) => {
    setCarrinho((current) => {
      return current.map(item => {
        if (item.id === id) {
          const newQtd = item.quantidade + delta;
          if (newQtd <= 0) return null; // Será filtrado depois
          return { ...item, quantidade: newQtd };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const addToCart = (product) => {
    setCarrinho((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => item.id === product.id ? { ...item, quantidade: item.quantidade + 1 } : item);
      }
      return [...current, { ...product, quantidade: 1, observacao: '' }];
    });
  };

  const salvarNovoCliente = async () => {
    if (!novoClienteForm.nome || !novoClienteForm.telefone) {
      alert('⚠️ Nome e Telefone são obrigatórios!');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        nome: novoClienteForm.nome,
        telefone: novoClienteForm.telefone,
        cep: novoClienteForm.cep || null,
        endereco: novoClienteForm.endereco || null,
        rua: novoClienteForm.rua || null,
        numero: novoClienteForm.numero || null,
        bairro: novoClienteForm.bairro || null,
        cidade: novoClienteForm.cidade || null,
      };
      const res = await http.post('/clientes', payload);
      setClienteId(String(res.data.id));
      setShowNovoCliente(false);
      setNovoClienteForm({ nome:'', telefone:'', cep:'', rua:'', numero:'', bairro:'', cidade:'', endereco:'' });
      if (onOrderCreated) onOrderCreated();
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.response?.data?.[0]?.message || 'Erro ao salvar cliente.';
      alert('❌ ' + msg);
    } finally {
      setSubmitting(false);
    }
  };

  const buscarCepPdv = async (cep) => {
    const clean = cep.replace(/\D/g,'');
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setNovoClienteForm(c => ({ ...c, rua: data.logradouro||'', bairro: data.bairro||'', cidade: data.localidade||'' }));
      }
    } catch {}
  };

  const removeFromCart = (id) => setCarrinho(c => c.filter(item => item.id !== id));

  const processarFinalizacao = async () => {
    setSubmitting(true);
    try {
      const valorRecebidoEl = document.getElementById('valor-recebido-input');
      const valorRecebido = valorRecebidoEl ? parseFloat(valorRecebidoEl.value) : null;
      
      let troco = null;
      if (formaPagamento === 'dinheiro' && valorRecebido) {
        troco = valorRecebido > total ? valorRecebido - total : 0;
      }

      const pagamentoFmt = formaPagamento === 'cartao_credito'
        ? `CARTAO_${parcelasSelecionadas}x`
        : formaPagamento.toUpperCase();

      const payload = {
        clienteId: clienteId || null,
        tipo_pedido: tipoPedido,
        pagamento: pagamentoFmt,
        valorRecebido,
        troco,
        taxaEntrega,
        itens: carrinho.map(item => ({
          id: item.id,
          produto_id: item.id,
          nome: item.nome,
          preco: item.preco,
          quantidade: item.quantidade,
          observacao: item.observacao || ''
        }))
      };

      const resPost = await http.post('/pdv/finalizar', payload);

      const orderData = {
        pedidoId: resPost?.data?.id || resPost?.data?.pedido?.id || null,
        clienteNome: clienteSelecionado?.nome || 'Consumidor Final',
        data: new Date().toLocaleString('pt-BR'),
        forma_pagamento: pagamentoFmt,
        total,
        subtotal,
        taxaEntrega,
        itens: carrinho
      };

      setLastOrder(orderData);
      setShowSuccessModal(true);
      setCarrinho([]);
      setClienteId('');
      
      // Limpa os campos de troco caso tenha sido pago em dinheiro
      if (valorRecebidoEl) valorRecebidoEl.value = '';
      const trocoDisplay = document.getElementById('valor-troco');
      if (trocoDisplay) trocoDisplay.innerText = 'R$ 0.00';

    } catch (err) {
      console.error(err);
      alert('❌ Erro ao processar venda: ' + (err?.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      alert('⚠️ Adicione produtos ao carrinho.');
      return;
    }

    if (tipoPedido === 'ENTREGA' && !clienteId) {
      alert('⚠️ Para pedidos de DELIVERY, você deve selecionar um cliente com endereço.');
      return;
    }

    if (formaPagamento === 'pix') {
      setShowAskPixModal(true);
      return;
    }

    await processarFinalizacao();
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    if (onOrderCreated) onOrderCreated();
  };

  const imprimirCupom = (order) => {
    const sep = '--------------------------------';
    const cp = companyProfile;
    const nome = cp?.nomeFantasia || cp?.razaoSocial || 'EFATA DELIVERY';
    const doc = cp?.documento ? `${cp.tipo === 'pf' ? 'CPF' : 'CNPJ'}: ${cp.documento}` : '';
    const end = cp?.endereco ? `${cp.endereco}${cp.numero ? ', ' + cp.numero : ''}${cp.bairro ? ' - ' + cp.bairro : ''}` : '';
    const cidade = cp?.cidade || '';
    const tel = cp?.telefone || cp?.whatsapp || '';

    const itensHtml = (order.itens || []).map(item => `
      <tr>
        <td>${item.quantidade}x ${item.nome}</td>
        <td style="text-align:right">R$ ${(Number(item.preco) * Number(item.quantidade)).toFixed(2)}</td>
      </tr>
      ${item.observacao ? `<tr><td colspan="2" style="font-size:11px;color:#555;padding-left:12px">↳ ${item.observacao}</td></tr>` : ''}
    `).join('');

    const taxaLine = order.taxaEntrega > 0
      ? `<tr><td>Taxa de entrega</td><td style="text-align:right">R$ ${Number(order.taxaEntrega).toFixed(2)}</td></tr>` : '';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Cupom #${order.pedidoId || ''}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 13px; width: 80mm; padding: 8px; color: #000; }
        h1 { font-size: 15px; text-align: center; margin-bottom: 2px; }
        .center { text-align: center; }
        .sep { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; vertical-align: top; }
        .total-row td { font-weight: bold; font-size: 15px; border-top: 1px dashed #000; padding-top: 6px; }
        .footer { text-align: center; margin-top: 8px; font-size: 11px; }
        @page { margin: 0; size: 80mm auto; }
      </style>
    </head><body>
      <h1>${nome}</h1>
      ${doc ? `<p class="center" style="font-size:11px">${doc}</p>` : ''}
      ${end ? `<p class="center" style="font-size:11px">${end}${cidade ? ' - ' + cidade : ''}</p>` : ''}
      ${tel ? `<p class="center" style="font-size:11px">Tel: ${tel}</p>` : ''}
      <div class="sep"></div>
      <p><b>Pedido:</b> #${order.pedidoId || 'PDV'}</p>
      <p><b>Data:</b> ${order.data}</p>
      <p><b>Cliente:</b> ${order.clienteNome}</p>
      <p><b>Pagamento:</b> ${order.forma_pagamento}</p>
      <div class="sep"></div>
      <table>
        <thead><tr><td><b>Item</b></td><td style="text-align:right"><b>Valor</b></td></tr></thead>
        <tbody>${itensHtml}</tbody>
        ${taxaLine}
        <tr class="total-row">
          <td>TOTAL</td>
          <td style="text-align:right">R$ ${Number(order.total).toFixed(2)}</td>
        </tr>
      </table>
      <div class="sep"></div>
      <p class="footer">Obrigado pela preferência! 😊</p>
      <p class="footer" style="margin-top:4px">*** NÃO É DOCUMENTO FISCAL ***</p>
    </body></html>`;

    let iframe = document.getElementById('print-cupom-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-cupom-iframe';
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const frameDoc = iframe.contentWindow.document;
    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
    }, 500);
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 100px)', 
      background: 'var(--bg)', 
      overflow: 'hidden',
      color: 'var(--text-main)'
    }}>
      
      {/* 1. SIDEBAR DE CATEGORIAS (Esquerda) */}
      <div style={{ 
        width: 100, 
        background: 'var(--sidebar-bg)', 
        borderRight: '1px solid var(--border)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '24px 0',
        gap: 16,
        overflowY: 'auto'
      }}>
        {categoriasMenu.map(cat => (
          <button 
            key={cat}
            onClick={() => setCategoriaAtiva(cat)}
            style={{
              width: 76,
              height: 76,
              borderRadius: 20,
              border: '1px solid',
              borderColor: categoriaAtiva === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              background: categoriaAtiva === cat ? 'linear-gradient(135deg, var(--green-700), var(--green-500))' : 'white',
              color: categoriaAtiva === cat ? 'white' : '#64748b',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: categoriaAtiva === cat ? '0 8px 20px var(--primary-glow)' : '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: 24 }}>
              {cat === 'Todos' ? '🍽️' : 
               cat.toLowerCase().includes('bebida') ? '🥤' :
               cat.toLowerCase().includes('pizza') ? '🍕' :
               cat.toLowerCase().includes('hamb') ? '🍔' :
               cat.toLowerCase().includes('doce') || cat.toLowerCase().includes('sobrem') ? '🍰' : '📦'}
            </div>
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '90%', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.02em' }}>{cat}</span>
          </button>
        ))}
      </div>

      {/* 2. ÁREA CENTRAL (Produtos) */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '24px',
        gap: 20,
        overflow: 'hidden'
      }}>
        {/* TOP BAR BUSCA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="O que o cliente deseja hoje?" 
              value={buscaProduto}
              onChange={(e) => setBuscaProduto(e.target.value)}
              style={{
                width: '100%',
                height: 58,
                padding: '0 24px 0 60px',
                borderRadius: 20,
                border: '1px solid var(--border)',
                background: 'white',
                color: '#1e293b',
                fontSize: 16,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            <Search size={22} style={{ position: 'absolute', left: 24, top: 18, color: 'var(--text-muted)' }} />
          </div>
          <div style={{ 
            background: 'rgba(249, 115, 22, 0.1)', 
            padding: '0 24px', 
            height: 58, 
            borderRadius: 20, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            border: '1px solid rgba(249, 115, 22, 0.2)' 
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1 }}>Modo:</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: 'white', background: 'var(--primary)', padding: '6px 14px', borderRadius: 10 }}>PREPARO RÁPIDO</span>
          </div>
        </div>

        {/* GRID DE PRODUTOS */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
          gap: 16, 
          overflowY: 'auto', 
          paddingRight: 4,
          alignContent: 'start'
        }}>
          {produtosFiltrados.map((product) => {
            const semEstoque = Number(product.estoque) <= 0;
            return (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                style={{ 
                  background: 'white', 
                  borderRadius: 24, 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
                  opacity: semEstoque ? 0.7 : 1,
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }} 
                onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-4px)', e.currentTarget.style.borderColor = 'var(--primary)', e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)')}
                onMouseOut={e => (e.currentTarget.style.transform = 'none', e.currentTarget.style.borderColor = '#e2e8f0', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)')}
              >
                <div style={{ height: 130, width: '100%', background: 'rgba(0,0,0,0.2)', position: 'relative' }}>
                  <img src={product.imagem || getFallbackImage(product.categoria?.nome, product.nome)} alt={product.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {semEstoque && (
                    <div style={{ position:'absolute', inset:0, background:'rgba(2,6,23,0.7)', backdropFilter: 'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ color:'white', fontSize:10, fontWeight:900, background: '#ef4444', padding: '6px 12px', borderRadius: 100, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>ESGOTADO</span>
                    </div>
                  )}
                  {!semEstoque && (
                    <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(10px)', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800, color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                      ESTOQUE: {product.estoque}
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <strong style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>{product.nome}</strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontSize: 19, fontWeight: 900, color: 'var(--primary)' }}>R$ {Number(product.preco).toFixed(2)}</span>
                    <div style={{ width: 32, height: 32, background: 'var(--primary)', color: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px var(--primary-glow)' }}>
                      <Plus size={18} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. COLUNA DE CHECKOUT (Direita) */}
      <div style={{ 
        width: 400, 
        background: 'var(--sidebar-bg)', 
        borderLeft: '1px solid var(--border)', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.4)'
      }}>
        
        {/* HEADER: CLIENTE */}
        <div style={{ padding: '28px 24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Painel de Fechamento</h3>
            <button onClick={() => setShowNovoCliente(true)} style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--primary)', border: '1px solid rgba(249, 115, 22, 0.2)', padding: '8px 14px', borderRadius: 12, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={14}/> NOVO CLIENTE
            </button>
          </div>

          {/* SELETOR TIPO PEDIDO */}
          <div style={{ 
            display: 'flex', 
            background: 'rgba(255,255,255,0.03)', 
            padding: 4, 
            borderRadius: 16, 
            border: '1px solid var(--border)' 
          }}>
            <button 
              onClick={() => setTipoPedido('RETIRADA')}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                border: 'none',
                background: tipoPedido === 'RETIRADA' ? 'var(--green-700)' : 'transparent',
                color: tipoPedido === 'RETIRADA' ? 'white' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <Store size={16} /> BALCÃO
            </button>
            <button 
              onClick={() => setTipoPedido('ENTREGA')}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                border: 'none',
                background: tipoPedido === 'ENTREGA' ? 'var(--green-700)' : 'transparent',
                color: tipoPedido === 'ENTREGA' ? 'white' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <ShoppingBag size={16} /> DELIVERY
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <select 
              value={clienteId} 
              onChange={(e) => setClienteId(e.target.value)} 
              style={{
                width: '100%', height: 52, padding: '0 40px 0 48px', borderRadius: 16, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 14, fontWeight: 600, outline: 'none', appearance: 'none'
              }}
            >
              <option value="" style={{ background: '#0f172a' }}>Consumidor Final</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>{c.nome} ({c.telefone})</option>
              ))}
            </select>
            <User size={18} style={{ position: 'absolute', left: 16, top: 17, color: 'var(--primary)' }} />
            {clienteId && (
              <button onClick={() => setClienteId('')} style={{ position: 'absolute', right: 12, top: 14, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                <Trash2 size={18} />
              </button>
            )}
          </div>

          {clienteSelecionado && (
            <div style={{ padding: 18, background: 'linear-gradient(135deg, var(--green-700), var(--green-500))', borderRadius: 20, color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 20px var(--primary-glow)' }}>
              <div style={{ position: 'absolute', right: -15, bottom: -15, opacity: 0.15 }}><MapPin size={100} /></div>
              <div style={{ fontSize: 10, fontWeight: 900, opacity: 0.8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Dados de Entrega</div>
              <strong style={{ display: 'block', fontSize: 16, marginBottom: 4, fontWeight: 900 }}>{clienteSelecionado.nome}</strong>
              <div style={{ fontSize: 13, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <MapPin size={14} /> {clienteSelecionado.endereco || 'Retirada no Balcão'}
              </div>
            </div>
          )}
        </div>

        {/* LISTA DE ITENS */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {carrinho.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 80, height: 80, background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShoppingBag size={32} color="#cbd5e1" />
              </div>
              <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>Nenhum item selecionado</p>
            </div>
          ) : (
            carrinho.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 20, transition: 'all 0.2s' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--primary)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                  {item.quantidade}x
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 2 }}>{item.nome}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--primary)' }}>R$ {(item.preco * item.quantidade).toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => updateCartQuantity(item.id, -1)} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16}/></button>
                  <button onClick={() => updateCartQuantity(item.id, 1)} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16}/></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* RODAPÉ: PAGAMENTO E TOTAL */}
        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* MÉTODOS DE PAGAMENTO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {Object.keys(activePaymentMethods).filter(m => activePaymentMethods[m] && m !== 'max_parcelas').map(metodo => (
              <button 
                key={metodo}
                onClick={() => setFormaPagamento(metodo)}
                style={{
                  height: 52, borderRadius: 14, border: '2px solid',
                  borderColor: formaPagamento === metodo ? 'var(--primary)' : 'var(--border)',
                  background: formaPagamento === metodo ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255,255,255,0.03)',
                  color: formaPagamento === metodo ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 800, fontSize: 10, cursor: 'pointer', textTransform: 'uppercase',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                  boxShadow: formaPagamento === metodo ? '0 4px 12px var(--primary-glow)' : 'none'
                }}
              >
                {metodo === 'pix' && <QrCode size={18} style={{ marginBottom: 2 }} />}
                {metodo.replace('cartao_', '').replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* INPUTS DE VALOR (DINHEIRO / PARCELAS) */}
          {formaPagamento === 'dinheiro' && (
            <div style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4, letterSpacing: 1 }}>RECEBIDO</span>
                <input 
                  id="valor-recebido-input"
                  type="number" 
                  placeholder="0,00" 
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    const troco = value > total ? value - total : 0;
                    const display = document.getElementById('valor-troco');
                    if (display) display.innerText = `R$ ${troco.toFixed(2)}`;
                  }}
                  style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 20, fontWeight: 900, outline: 'none', color: 'white' }}
                />
              </div>
              <div style={{ width: '1px', background: 'var(--border)' }}></div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4, letterSpacing: 1 }}>TROCO</span>
                <div id="valor-troco" style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>R$ 0.00</div>
              </div>
            </div>
          )}

          {formaPagamento === 'cartao_credito' && (
            <select 
              value={parcelasSelecionadas} 
              onChange={(e) => setParcelasSelecionadas(Number(e.target.value))}
              style={{ width: '100%', height: 48, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 12px', fontWeight: 700, outline: 'none' }}
            >
              {Array.from({ length: activePaymentMethods.max_parcelas || 1 }).map((_, i) => (
                <option key={i+1} value={i+1}>{i+1}x de R$ {(total/(i+1)).toFixed(2)}</option>
              ))}
            </select>
          )}

          {/* RESUMO DE VALORES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 20, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
              <span>Subtotal</span>
              <span style={{ color: 'white' }}>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
              <span>Taxa de Entrega</span>
              <span style={{ color: taxaEntrega > 0 ? 'white' : '#10b981' }}>{taxaEntrega > 0 ? `R$ ${taxaEntrega.toFixed(2)}` : 'GRÁTIS'}</span>
            </div>
            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, fontWeight: 900, color: 'white' }}>
              <span>TOTAL</span>
              <span style={{ color: 'var(--primary)' }}>R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={() => finalizarVenda()} 
            disabled={submitting || carrinho.length === 0} 
            style={{ 
              width: '100%', height: 72, borderRadius: 24, border: 'none',
              background: carrinho.length > 0 ? 'linear-gradient(135deg, var(--primary), #ea580c)' : 'rgba(255,255,255,0.05)', 
              color: 'white', 
              fontSize: 20, fontWeight: 900, 
              cursor: carrinho.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: carrinho.length > 0 ? '0 12px 30px var(--primary-glow)' : 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14
            }}
          >
            {submitting ? 'PROCESSANDO...' : (
              <>
                <ShoppingBag size={22} /> FINALIZAR VENDA
              </>
            )}
          </button>
        </div>

      </div>

      {/* REPRODUÇÃO DOS MODAIS ORIGINAIS (SEM ALTERAÇÃO DE FUNÇÃO) */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            {/* Título e Status */}
            <div style={{ background: 'var(--green-700)', padding: '20px', textAlign: 'center', color: 'white' }}>
               <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>Venda Finalizada!</h2>
            </div>
            
            {/* Visualização do Cupom (Estilo Papel) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '30px', background: '#f8fafc' }}>
               <div style={{ 
                 background: 'white', 
                 padding: '24px', 
                 boxShadow: '0 4px 15px rgba(0,0,0,0.05)', 
                 borderRadius: 4, 
                 fontFamily: "'Courier New', Courier, monospace",
                 color: '#000',
                 border: '1px solid #e2e8f0',
                 position: 'relative'
               }}>
                  {/* Detalhes do Cupom */}
                  <div style={{ textAlign: 'center', marginBottom: 15 }}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{companyProfile?.nomeFantasia || 'EFATA DELIVERY'}</div>
                    <div style={{ fontSize: 11 }}>{companyProfile?.endereco || ''}</div>
                    <div style={{ fontSize: 11 }}>PEDIDO: #{lastOrder?.pedidoId || 'PDV'}</div>
                  </div>

                  <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0' }}></div>

                  <div style={{ fontSize: 12, marginBottom: 10 }}>
                    <div><b>DATA:</b> {lastOrder?.data}</div>
                    <div><b>CLIENTE:</b> {lastOrder?.clienteNome}</div>
                    <div><b>PAGTO:</b> {lastOrder?.forma_pagamento}</div>
                  </div>

                  <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0' }}></div>

                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px dashed #eee' }}>
                        <th style={{ textAlign: 'left', paddingBottom: 5 }}>ITEM</th>
                        <th style={{ textAlign: 'right', paddingBottom: 5 }}>VALOR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(lastOrder?.itens || []).map((i, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '4px 0' }}>{i.quantidade}x {i.nome.substring(0,18)}</td>
                          <td style={{ textAlign: 'right' }}>R$ {(i.preco * i.quantidade).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0' }}></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 14 }}>
                    <span>TOTAL</span>
                    <span>R$ {Number(lastOrder?.total || 0).toFixed(2)}</span>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: 20, fontSize: 10, fontStyle: 'italic' }}>
                    Obrigado pela preferência!
                  </div>
               </div>
            </div>

            {/* Ações: Imprimir Sim ou Não */}
            <div style={{ padding: '24px', background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 12 }}>
               <div style={{ textAlign: 'center', marginBottom: 8, fontSize: 14, fontWeight: 800, color: '#64748b' }}>Deseja imprimir o cupom?</div>
               <div style={{ display: 'flex', gap: 12 }}>
                 <button 
                   onClick={() => { imprimirCupom(lastOrder); closeSuccessModal(); }} 
                   style={{ flex: 1, height: 56, background: 'var(--green-700)', color: 'white', borderRadius: 16, border: 'none', fontWeight: 900, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 20px rgba(34, 197, 94, 0.2)' }}
                 >
                   <Printer size={20} /> SIM (IMPRIMIR)
                 </button>
                 <button 
                   onClick={closeSuccessModal} 
                   style={{ flex: 1, height: 56, background: '#f1f5f9', color: '#64748b', borderRadius: 16, border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
                 >
                   NÃO (FECHAR)
                 </button>
               </div>
            </div>

          </div>
        </div>
      )}

      {showAskPixModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 400, borderRadius: 32, padding: 40, textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ width: 80, height: 80, background: '#f0fdf4', color: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <QrCode size={40} />
            </div>
            <h2 style={{ marginTop: 0, color: '#1e293b', fontSize: 24, fontWeight: 800 }}>Pagamento PIX</h2>
            <p style={{ color: '#64748b', marginBottom: 32, fontSize: 16, lineHeight: 1.5 }}>Deseja gerar o QR Code para o cliente realizar o pagamento agora?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => { setShowAskPixModal(false); setShowPixModal(true); }} style={{ width: '100%', height: 56, background: 'var(--primary)', color: 'white', borderRadius: 16, border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 20px rgba(234, 88, 12, 0.2)' }}>SIM, GERAR QR CODE</button>
              <button onClick={() => { setShowAskPixModal(false); processarFinalizacao(); }} style={{ width: '100%', height: 56, background: 'white', color: '#64748b', borderRadius: 16, border: '1px solid #e2e8f0', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>NÃO, JÁ RECEBI / OUTRO</button>
            </div>
          </div>
        </div>
      )}

      {showNovoCliente && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 550, borderRadius: 32, padding: 40, boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <div style={{ width: 48, height: 48, background: '#fff7ed', color: 'var(--primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} />
              </div>
              <h2 style={{ margin: 0, color: '#1e293b', fontSize: 24, fontWeight: 800 }}>Novo Cliente Rápido</h2>
            </div>

            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <label style={labelStyle}>Nome Completo *</label>
                  <input type="text" value={novoClienteForm.nome} onChange={e => setNovoClienteForm(c => ({...c, nome: e.target.value}))} style={modernInput} placeholder="Ex: João Silva" />
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <label style={labelStyle}>Telefone / WhatsApp *</label>
                  <input type="text" value={novoClienteForm.telefone} onChange={e => setNovoClienteForm(c => ({...c, telefone: e.target.value}))} style={modernInput} placeholder="(00) 00000-0000" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 20 }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <label style={labelStyle}>CEP 🔍</label>
                  <input type="text" value={novoClienteForm.cep||''} onChange={e => setNovoClienteForm(c => ({...c, cep: e.target.value}))} onBlur={e => buscarCepPdv(e.target.value)} style={modernInput} placeholder="00000-000" maxLength={9}/>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <label style={labelStyle}>Endereço / Rua</label>
                  <input type="text" value={novoClienteForm.rua||''} onChange={e => setNovoClienteForm(c => ({...c, rua: e.target.value}))} style={modernInput} placeholder="Rua, Avenida..." />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 20 }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <label style={labelStyle}>Nº</label>
                  <input type="text" value={novoClienteForm.numero||''} onChange={e => setNovoClienteForm(c => ({...c, numero: e.target.value}))} style={modernInput}/>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <label style={labelStyle}>Bairro</label>
                  <input type="text" value={novoClienteForm.bairro||''} onChange={e => setNovoClienteForm(c => ({...c, bairro: e.target.value}))} style={modernInput}/>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <label style={labelStyle}>Cidade</label>
                  <input type="text" value={novoClienteForm.cidade||''} onChange={e => setNovoClienteForm(c => ({...c, cidade: e.target.value}))} style={modernInput}/>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
              <button onClick={() => setShowNovoCliente(false)} style={{ flex: 1, height: 56, borderRadius: 16, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 800, cursor: 'pointer' }}>CANCELAR</button>
              <button onClick={salvarNovoCliente} disabled={submitting} style={{ flex: 1, height: 56, borderRadius: 16, border: 'none', background: 'var(--green-700)', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px var(--primary-glow)' }}>{submitting ? 'SALVANDO...' : 'SALVAR E USAR'}</button>
            </div>
          </div>
        </div>
      )}

      {showPixModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 450, borderRadius: 32, padding: 40, textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ background: '#f0fdf4', color: '#22c55e', padding: '24px', borderRadius: 24, marginBottom: 32 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Pagamento PIX</h2>
              <div style={{ fontSize: 14, marginTop: 8, opacity: 0.8, fontWeight: 600 }}>Escaneie o código abaixo</div>
            </div>
            
            <div style={{ background: 'white', padding: 24, borderRadius: 32, border: '2px solid #f1f5f9', display: 'inline-block', marginBottom: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <QRCodeSVG 
                value={`00020126330014BR.GOV.BCB.PIX0111${companyProfile?.pixKey || '00482817518'}5204000053039865405${total.toFixed(2).replace('.','')}5802BR5914${(companyProfile?.nomeFantasia || 'EFATA DELIVERY').substring(0,25)}6008SAO PAULO62070503***6304`}
                size={240}
              />
            </div>
            
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Total a Receber</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#1e293b' }}>R$ {total.toFixed(2)}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => { setShowPixModal(false); processarFinalizacao(); }} style={{ width: '100%', height: 64, borderRadius: 20, border: 'none', background: '#22c55e', color: 'white', fontSize: 18, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 12px 24px rgba(34, 197, 94, 0.3)' }}>
                <CheckCircle size={24}/> CONFIRMAR PAGAMENTO
              </button>
              <button onClick={() => setShowPixModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>
                Voltar e alterar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modernInput = {
  width: '100%',
  height: 52,
  padding: '0 16px',
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  fontSize: 15,
  fontWeight: 600,
  outline: 'none',
  transition: 'all 0.2s'
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginLeft: 4
};

const inputStyle = {
  width: '100%',
  height: 48,
  padding: '0 16px',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  fontSize: 14,
  fontWeight: 600,
  outline: 'none'
};

export default PdvPanel;