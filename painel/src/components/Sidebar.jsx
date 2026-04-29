import { LogOut } from 'lucide-react';

function Sidebar({ items, currentView, onChange, onLogout, user }) {
  return (
    <aside className="sidebar">
      <div className="logo-area" style={{ marginBottom: 30, display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--green-700)', margin: 0 }}>
          🌿 Green<span style={{ color: 'var(--yellow-500)' }}>ERP</span>
        </h2>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ 
        marginTop: 'auto', 
        paddingTop: 20, 
        borderTop: '1px solid #eeeeee',
        display: 'grid',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px' }}>
          <div style={{ 
            width: 36, 
            height: 36, 
            borderRadius: 10, 
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
            color: 'white'
          }}>
            {user?.nome?.charAt(0) || 'A'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#333', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {user?.nome || 'Administrador'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
               <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}></div>
               <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e' }}>Online</span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="sidebar-item"
          style={{ 
            color: '#f87171', 
            background: 'rgba(239, 68, 68, 0.05)',
            marginTop: 8,
            justifyContent: 'center',
            fontWeight: 700
          }}
        >
          <LogOut size={16} />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;