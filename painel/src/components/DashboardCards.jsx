import { DollarSign, ShoppingBag, Package, TrendingUp, Truck } from 'lucide-react';

function DashboardCards({ stats }) {
  const cards = [
    { 
      label: 'Faturamento', 
      value: `R$ ${Number(stats?.total || 0).toFixed(2)}`, 
      icon: <DollarSign size={24} />,
      color: 'var(--green-700)',
      bg: 'var(--green-100)',
      trend: '+12%'
    },
    { 
      label: 'Pedidos', 
      value: stats.orders, 
      icon: <ShoppingBag size={24} />,
      color: 'var(--yellow-600)',
      bg: 'var(--yellow-100)',
      trend: '+5'
    },
    { 
      label: 'Em Preparo', 
      value: stats.preparing || 0, 
      icon: <TrendingUp size={24} />,
      color: '#1E88E5',
      bg: '#E3F2FD',
      trend: '+2.4%'
    },
    { 
      label: 'Entregues', 
      value: stats.delivered || 0, 
      icon: <Truck size={24} />,
      color: 'var(--green-500)',
      bg: 'var(--green-100)',
      trend: 'Estável'
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <div key={card.label} className="stat-card" style={{ borderLeft: `5px solid ${card.color}` }}>
          <div className="stat-icon-circle" style={{ background: card.bg, color: card.color }}>
            {card.icon}
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{card.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-main)', letterSpacing: -0.5 }}>{card.value}</h2>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>{card.trend}</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>em relação a ontem</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashboardCards;