import { RefreshCcw, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';

function Header({ subtitle, title, onRefresh, refreshing }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="main-header">
      <div className="search-bar">
        <RefreshCcw size={16} color="var(--text-muted)" className={refreshing ? 'spin-anim' : ''} />
        <input type="text" placeholder="Buscar pedido, cliente ou telefone..." />
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ 
          textAlign: 'right', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--secondary)' }}>{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              width: 40,
              height: 40,
              borderRadius: 10, 
              cursor: 'pointer',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Bell size={20} />
            <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></div>
          </button>

          <button 
            onClick={onRefresh} 
            disabled={refreshing}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: 13, opacity: refreshing ? 0.8 : 1 }}
          >
            <RefreshCcw size={14} className={refreshing ? 'spin-anim' : ''} />
            {refreshing ? 'Atualizando...' : 'Atualizar Dados'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;