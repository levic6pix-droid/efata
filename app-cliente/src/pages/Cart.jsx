import { ChevronLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Cart() {
  const navigate = useNavigate();
  const { carrinho, updateQuantidade, removerDoCarrinho, total } = useCart();

  if (carrinho.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', paddingTop: 100 }}>
        <h2 style={{ marginBottom: 10 }}>Seu carrinho está vazio 😕</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>Volte ao cardápio e escolha algo delicioso!</p>
        <button onClick={() => navigate('/')} className="btn-primary" style={{ width: '100%' }}>Ver Cardápio</button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 100, minHeight: '100vh', background: 'white' }}>
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 10, padding: 20, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 16 }}>
          <ChevronLeft size={24} color="var(--secondary)" />
        </button>
        <h2 style={{ fontSize: 18, margin: 0 }}>Meu Carrinho</h2>
      </header>

      <div className="container" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {carrinho.map((item, idx) => (
            <div key={`${item.id}-${idx}`} style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, marginBottom: 4 }}>{item.nome}</h3>
                {item.observacao && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Observação: {item.observacao}</p>
                )}
                <strong style={{ color: 'var(--primary)', fontSize: 16 }}>R$ {Number(item.preco).toFixed(2)}</strong>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <button 
                  onClick={() => removerDoCarrinho(item.id, item.observacao)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                  <Trash2 size={18} />
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-main)', borderRadius: 20, padding: '4px 8px' }}>
                  <button 
                    onClick={() => updateQuantidade(item.id, item.quantidade - 1, item.observacao)}
                    style={{ width: 24, height: 24, borderRadius: 12, border: 'none', background: 'white', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
                  >-</button>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{item.quantidade}</span>
                  <button 
                    onClick={() => updateQuantidade(item.id, item.quantidade + 1, item.observacao)}
                    style={{ width: 24, height: 24, borderRadius: 12, border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
                  >+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 30 }}>
          <div className="flex justify-between" style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-muted)' }}>
            <span>Subtotal</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between" style={{ marginBottom: 20, fontSize: 18, fontWeight: 800, color: 'var(--secondary)' }}>
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 20, left: 20, right: 20, zIndex: 50 }}>
        <button 
          onClick={() => navigate('/checkout')}
          className="btn-primary" 
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px 24px', boxShadow: 'var(--shadow-float)' }}
        >
          <span>Continuar</span>
          <span>R$ {total.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}

export default Cart;
