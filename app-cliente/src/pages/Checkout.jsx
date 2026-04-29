import { useState } from 'react';
import { ChevronLeft, CheckCircle, Bike, Store, MapPin, CreditCard, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';

function Checkout() {
  const navigate = useNavigate();
  const { carrinho, total, limparCarrinho } = useCart();
  
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    tipo: 'DELIVERY', // DELIVERY ou RETIRADA
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
    pagamento: 'PIX', // PIX, CARTAO, DINHEIRO
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fetchCep = async () => {
    const cepNum = form.cep.replace(/\D/g, '');
    if (cepNum.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepNum}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm(prev => ({ ...prev, rua: data.logradouro, bairro: data.bairro }));
        }
      } catch (err) {}
    }
  };

  const handleFinalizar = async () => {
    if (!form.nome || !form.telefone) return alert('Preencha nome e WhatsApp!');
    if (form.tipo === 'DELIVERY' && (!form.rua || !form.numero || !form.bairro)) {
      return alert('Preencha o endereço completo para entrega!');
    }

    setLoading(true);
    try {
      const payload = {
        cliente: {
          nome: form.nome,
          telefone: form.telefone,
          endereco: form.tipo === 'DELIVERY' ? `${form.rua}, ${form.numero} ${form.complemento} - ${form.bairro} (${form.cep})` : null,
          rua: form.rua,
          numero: form.numero,
          bairro: form.bairro,
          cep: form.cep
        },
        carrinho: carrinho.map(c => ({ produto_id: c.id, quantidade: c.quantidade, preco: c.preco, observacao: c.observacao })),
        forma_pagamento: form.pagamento,
        tipo_pedido: form.tipo,
        origem: 'APP',
        total
      };

      // Chama a rota publica de criação de pedido do app
      const res = await api.post('/app/pedidos', payload);
      
      limparCarrinho();
      navigate(`/pedido/${res.data.id}`);
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao finalizar pedido');
    } finally {
      setLoading(false);
    }
  };

  if (carrinho.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Carrinho vazio.</div>;
  }

  return (
    <div style={{ paddingBottom: 100, minHeight: '100vh', background: 'var(--bg-main)' }}>
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 10, padding: 20, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 16 }}>
          <ChevronLeft size={24} color="var(--secondary)" />
        </button>
        <h2 style={{ fontSize: 18, margin: 0 }}>Finalizar Pedido</h2>
      </header>

      <div className="container" style={{ padding: '20px' }}>
        
        {/* Identificação */}
        <section style={{ background: 'white', padding: 20, borderRadius: 20, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--secondary)' }}>Seus Dados</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="text" name="nome" value={form.nome} onChange={handleChange} placeholder="Seu Nome" className="input-field" />
            <input type="text" name="telefone" value={form.telefone} onChange={handleChange} placeholder="WhatsApp com DDD" className="input-field" />
          </div>
        </section>

        {/* Tipo de Pedido */}
        <section style={{ background: 'white', padding: 20, borderRadius: 20, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--secondary)' }}>Como deseja receber?</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={() => setForm({ ...form, tipo: 'DELIVERY' })}
              style={{ flex: 1, padding: 16, borderRadius: 16, border: `2px solid ${form.tipo === 'DELIVERY' ? 'var(--primary)' : 'var(--border-color)'}`, background: form.tipo === 'DELIVERY' ? 'var(--primary-light)' : 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <Bike size={24} color={form.tipo === 'DELIVERY' ? 'var(--primary)' : 'var(--text-muted)'} />
              <span style={{ fontWeight: 700, color: form.tipo === 'DELIVERY' ? 'var(--primary-dark)' : 'var(--text-muted)' }}>Entrega</span>
            </button>
            <button 
              onClick={() => setForm({ ...form, tipo: 'RETIRADA' })}
              style={{ flex: 1, padding: 16, borderRadius: 16, border: `2px solid ${form.tipo === 'RETIRADA' ? 'var(--primary)' : 'var(--border-color)'}`, background: form.tipo === 'RETIRADA' ? 'var(--primary-light)' : 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <Store size={24} color={form.tipo === 'RETIRADA' ? 'var(--primary)' : 'var(--text-muted)'} />
              <span style={{ fontWeight: 700, color: form.tipo === 'RETIRADA' ? 'var(--primary-dark)' : 'var(--text-muted)' }}>Retirar na Loja</span>
            </button>
          </div>
        </section>

        {/* Endereço */}
        {form.tipo === 'DELIVERY' && (
          <section style={{ background: 'white', padding: 20, borderRadius: 20, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={18} /> Endereço</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" name="cep" value={form.cep} onChange={handleChange} onBlur={fetchCep} placeholder="CEP" className="input-field" />
              <div style={{ display: 'flex', gap: 12 }}>
                <input type="text" name="rua" value={form.rua} onChange={handleChange} placeholder="Rua" className="input-field" style={{ flex: 2 }} />
                <input type="text" name="numero" value={form.numero} onChange={handleChange} placeholder="Nº" className="input-field" style={{ flex: 1 }} />
              </div>
              <input type="text" name="bairro" value={form.bairro} onChange={handleChange} placeholder="Bairro" className="input-field" />
              <input type="text" name="complemento" value={form.complemento} onChange={handleChange} placeholder="Complemento (Opcional)" className="input-field" />
            </div>
          </section>
        )}

        {/* Pagamento */}
        <section style={{ background: 'white', padding: 20, borderRadius: 20, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--secondary)' }}>Pagamento</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 'PIX', label: 'PIX', icon: <CheckCircle size={18} /> },
              { id: 'CARTAO', label: 'Cartão (Máquina na entrega)', icon: <CreditCard size={18} /> },
              { id: 'DINHEIRO', label: 'Dinheiro', icon: <Banknote size={18} /> },
            ].map(pag => (
              <label key={pag.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, border: `2px solid ${form.pagamento === pag.id ? 'var(--primary)' : 'var(--border-color)'}`, background: form.pagamento === pag.id ? 'var(--primary-light)' : 'white', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="pagamento" 
                  value={pag.id} 
                  checked={form.pagamento === pag.id} 
                  onChange={handleChange} 
                  style={{ display: 'none' }} 
                />
                <span style={{ color: form.pagamento === pag.id ? 'var(--primary)' : 'var(--text-muted)' }}>{pag.icon}</span>
                <span style={{ fontWeight: 700, color: form.pagamento === pag.id ? 'var(--primary-dark)' : 'var(--secondary)' }}>{pag.label}</span>
              </label>
            ))}
          </div>
        </section>

      </div>

      <div style={{ position: 'fixed', bottom: 20, left: 20, right: 20, zIndex: 50 }}>
        <button 
          onClick={handleFinalizar}
          disabled={loading}
          className="btn-accent" 
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px 24px', boxShadow: 'var(--shadow-float)' }}
        >
          <span>{loading ? 'Processando...' : 'Fazer Pedido'}</span>
          <span>R$ {total.toFixed(2)}</span>
        </button>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          background: var(--bg-main);
          font-size: 15px;
          outline: none;
          transition: 0.2s;
        }
        .input-field:focus {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 3px var(--primary-light);
        }
      `}</style>
    </div>
  );
}

export default Checkout;
