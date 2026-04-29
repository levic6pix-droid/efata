import {
  BookOpen,
  DollarSign,
  LayoutDashboard,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Truck,
  MessageCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import CadastrosPanel from '../components/CadastrosPanel';
import ChatWidget from '../components/ChatWidget';
import DashboardCards from '../components/DashboardCards';
import DeliveryBoard from '../components/DeliveryBoard';
import FinanceTable from '../components/FinanceTable';
import Header from '../components/Header';
import InventoryTable from '../components/InventoryTable';
import LoginScreen from '../components/LoginScreen';
import MenuPreview from '../components/MenuPreview';
import OrdersOverview from '../components/OrdersOverview';
import PdvPanel from '../components/PdvPanel';
import SettingsPanel from '../components/SettingsPanel';
import WhatsAppPanel from '../components/WhatsAppPanel';
import Sidebar from '../components/Sidebar';
import { useAdminData } from '../hooks/useAdminData';
import { useAuth } from '../hooks/useAuth';
import { useSocketConnection } from '../hooks/useSocketConnection';

const views = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'whatsapp', label: 'WhatsApp / IA', icon: <MessageCircle size={18} /> },
  { id: 'cadastros', label: 'Cadastros', icon: <Plus size={18} /> },
  { id: 'cardapio', label: 'Cardápio', icon: <BookOpen size={18} /> },
  { id: 'estoque', label: 'Estoque', icon: <Package size={18} /> },
  { id: 'financeiro', label: 'Financeiro', icon: <DollarSign size={18} /> },
  { id: 'pdv', label: 'PDV', icon: <ShoppingCart size={18} /> },
  { id: 'delivery', label: 'Delivery', icon: <Truck size={18} /> },
  { id: 'configuracoes', label: 'Configurações', icon: <Settings size={18} /> },
];

function AdminPanelPage() {
  const [hasError, setHasError] = useState(false);
  const auth = useAuth();
  const [view, setView] = useState('dashboard');
  const adminData = useAdminData(auth.isAuthenticated);

  useEffect(() => {
    const handleError = (error) => {
      console.error('Erro global capturado:', error);
      setHasError(true);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Ops! Algo deu errado.</h2>
        <p>Ocorreu um erro inesperado no painel.</p>
        <button className="btn-primary" onClick={() => window.location.reload()} style={{ margin: '20px auto' }}>
          Recarregar Página
        </button>
      </div>
    );
  }

  const { reload } = adminData;

  useEffect(() => {
    if (auth.isAuthenticated) {
      reload();
    }
  }, [auth.isAuthenticated, reload]);

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Erro ao tocar som:', e));
    } catch (error) {
      console.log('Audio API não disponível');
    }
  }, []);

  const handleNovoPedido = useCallback(() => {
    playNotificationSound();
    reload();
  }, [playNotificationSound, reload]);

  const socket = useSocketConnection(auth.isAuthenticated, {
    onDadosAtualizados: reload,
    onNovoPedido: handleNovoPedido,
    onPedidoAtualizado: reload,
  });

  const title = useMemo(
    () => views.find((item) => item.id === view)?.label || 'Dashboard',
    [view],
  );

  if (auth.loading) {
    return <div style={{ padding: 24 }}>Carregando autenticação...</div>;
  }

  if (!auth.isAuthenticated) {
    return <LoginScreen error={auth.error} onSubmit={auth.login} />;
  }

  return (
    <div className="erp-container">
      <Sidebar
        currentView={view}
        items={views}
        onChange={setView}
        onLogout={auth.logout}
        user={auth.user}
      />

      <main className="main-content">
        <Header
          onRefresh={reload}
          refreshing={adminData.refreshing}
          subtitle="Controle total de vendas, estoque e inteligência artificial."
          title={title}
        />

        <div className="content-inner">

        {adminData.error && (
          <div
            style={{
              background: '#fff5f5',
              color: '#b63b3b',
              padding: '14px 16px',
              borderRadius: 14,
              marginBottom: 20,
            }}
          >
            {adminData.error}
          </div>
        )}

        {adminData.loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
            <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Carregando dados do sistema...</p>
          </div>
        ) : (
          <>
            {view === 'dashboard' && (
              <div style={{ display: 'grid', gap: 20 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                    Efatá <span style={{ color: 'var(--primary)' }}>Delivery</span>
                  </h1>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Bem-vindo ao centro de comando do seu delivery.</p>
                </div>
                <DashboardCards stats={adminData.stats} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                  {/* Desempenho de Vendas */}
                  <div style={{ 
                    background: 'var(--card)', 
                    padding: 20, 
                    borderRadius: 16, 
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>Desempenho de Vendas</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Média diária baseada nos últimos pedidos</p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 180, paddingBottom: 10 }}>
                      {[65, 45, 85, 30, 95, 70, 55, 90, 40, 75].map((val, i) => (
                        <div key={i} style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: '100%', height: `${val}%`, background: 'var(--green-500)', borderRadius: '6px 6px 4px 4px', transition: 'all 0.5s ease' }}></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ 
                    background: 'var(--card)', 
                    padding: 20, 
                    borderRadius: 16, 
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border)'
                  }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 24 }}>Top Produtos</h3>
                    <div style={{ display: 'grid', gap: 20 }}>
                      {[
                        { nome: 'Pizza de Calabresa', valor: 'R$ 3.432' },
                        { nome: 'X-Burger Artesanal', valor: 'R$ 2.904' },
                        { nome: 'Coca-Cola 2L', valor: 'R$ 882' }
                      ].map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{p.nome}</span>
                          <strong style={{ fontSize: 14, color: 'var(--green-700)' }}>{p.valor}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <OrdersOverview pedidos={adminData.pedidos} />
              </div>
            )}

            {view === 'whatsapp' && (
              <WhatsAppPanel socket={socket} />
            )}

            {view === 'cadastros' && (
              <CadastrosPanel
                categories={adminData.categories}
                clientes={adminData.clientes}
                entregadores={adminData.entregadores}
                onRefresh={reload}
                products={adminData.products}
              />
            )}

            {view === 'cardapio' && (
              <MenuPreview
                categories={adminData.categories}
                products={adminData.products}
              />
            )}

            {view === 'estoque' && (
              <InventoryTable
                categories={adminData.categories}
                onSaved={reload}
                products={adminData.products}
              />
            )}

            {view === 'financeiro' && <FinanceTable />}

            {view === 'pdv' && (
              <PdvPanel
                clientes={adminData.clientes}
                onOrderCreated={reload}
                products={adminData.products}
              />
            )}

            {view === 'delivery' && (
              <DeliveryBoard
                entregadores={adminData.entregadores}
                onRefresh={reload}
                pedidos={adminData.pedidos}
              />
            )}

            {view === 'configuracoes' && <SettingsPanel />}
          </>
        )}
        </div>
      </main>

      <ChatWidget />
    </div>
  );
}

export default AdminPanelPage;