import { useState, useEffect } from 'react';
import { Search, ShoppingBag, MapPin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { motion } from 'framer-motion';

function Home() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [catAtiva, setCatAtiva] = useState('Todas');
  
  const navigate = useNavigate();
  const { quantidadeTotal, total } = useCart();
  const socket = useSocket();

  const loadData = async () => {
    try {
      const res = await api.get('/catalog/cardapio');
      const prods = res.data.filter(p => p.ativo && p.estoque > 0);
      setProdutos(prods);
      
      const cats = [...new Set(prods.map(p => p.categoria?.nome).filter(Boolean))];
      setCategorias(['Todas', ...cats]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('dados_atualizados', loadData);
    return () => {
      socket.off('dados_atualizados', loadData);
    };
  }, [socket]);

  const produtosFiltrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCat = catAtiva === 'Todas' || p.categoria?.nome === catAtiva;
    return matchBusca && matchCat;
  });

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* HEADER */}
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 10, padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Entregando em</div>
            <div className="flex items-center gap-2" style={{ fontWeight: 800, color: 'var(--primary)', cursor: 'pointer' }}>
              <MapPin size={16} /> Definir Endereço <ChevronRight size={14} />
            </div>
          </div>
          <div style={{ background: 'var(--bg-main)', width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--secondary)' }}>
            L
          </div>
        </div>
        
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="O que vamos pedir hoje?" 
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: 16, border: 'none', background: 'var(--bg-main)', fontSize: 15, fontWeight: 500, outline: 'none' }}
          />
        </div>
      </header>

      {/* CATEGORIAS */}
      <div className="hide-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '20px', scrollSnapType: 'x mandatory' }}>
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setCatAtiva(cat)}
            style={{ 
              padding: '8px 20px', 
              borderRadius: 20, 
              border: 'none', 
              fontWeight: 700, 
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              scrollSnapAlign: 'start',
              background: cat === catAtiva ? 'var(--primary)' : 'white',
              color: cat === catAtiva ? 'white' : 'var(--text-muted)',
              boxShadow: cat === catAtiva ? 'var(--shadow-md)' : 'var(--shadow-sm)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUTOS */}
      <main className="container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Carregando cardápio...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {produtosFiltrados.map((p) => (
              <ProductCard key={p.id} produto={p} />
            ))}
            {produtosFiltrados.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhum produto encontrado.</div>
            )}
          </div>
        )}
      </main>

      {/* FLOATING CART BUTTON */}
      {quantidadeTotal > 0 && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          style={{ position: 'fixed', bottom: 20, left: 20, right: 20, zIndex: 50 }}
        >
          <button 
            onClick={() => navigate('/carrinho')}
            className="btn-accent" 
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', boxShadow: 'var(--shadow-float)' }}
          >
            <div className="flex items-center gap-3">
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 10 }}>{quantidadeTotal}</div>
              <span style={{ fontSize: 16 }}>Ver Carrinho</span>
            </div>
            <span>R$ {total.toFixed(2)}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}

function ProductCard({ produto }) {
  const { addAoCarrinho } = useCart();
  
  return (
    <div style={{ display: 'flex', background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      {/* Imagem (Placeholder se nao tiver) */}
      <div style={{ width: 110, height: 110, background: 'var(--bg-main)', flexShrink: 0 }}>
        {produto.imagem ? (
          <img src={produto.imagem} alt={produto.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>SEM FOTO</div>
        )}
      </div>
      
      {/* Infos */}
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>{produto.nome}</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {produto.descricao || 'Sem descrição.'}
          </p>
        </div>
        
        <div className="flex justify-between items-center" style={{ marginTop: 8 }}>
          <strong style={{ color: 'var(--primary)', fontSize: 16 }}>R$ {Number(produto.preco).toFixed(2)}</strong>
          <button 
            onClick={() => addAoCarrinho(produto)}
            style={{ width: 32, height: 32, borderRadius: 16, border: 'none', background: 'var(--primary-light)', color: 'var(--primary-dark)', fontWeight: 800, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
