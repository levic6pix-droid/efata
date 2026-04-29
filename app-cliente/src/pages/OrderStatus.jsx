import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, ChefHat, CheckCircle, Bike, MapPin } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

function OrderStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    carregarPedido();
    
    if (!socket) return;
    
    socket.on('dados_atualizados', carregarPedido);
    socket.on('pedido_atualizado', (data) => {
      // Opcional: Atualizar apenas se o ID do pedido for o mesmo
      if (data && data.id === Number(id)) {
        carregarPedido();
      } else if (!data) {
        carregarPedido();
      }
    });

    return () => {
      socket.off('dados_atualizados', carregarPedido);
      socket.off('pedido_atualizado');
    };
  }, [id, socket]);

  const carregarPedido = async () => {
    try {
      // Endpoint deve ser público ou baseado num token salvo. Para o app simples, vamos assumir que existe uma rota para ver pedido pelo ID (ou ID + Tel)
      const res = await api.get(`/app/pedidos/${id}`);
      setPedido(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Buscando seu pedido...</div>;
  if (!pedido) return <div style={{ padding: 40, textAlign: 'center' }}>Pedido não encontrado.</div>;

  const steps = [
    { key: 'recebido', label: 'Recebido', icon: <Package size={20} /> },
    { key: 'em_preparo', label: 'Em Preparo', icon: <ChefHat size={20} /> },
    { key: 'pronto', label: 'Pronto', icon: <CheckCircle size={20} /> },
    { key: 'em_entrega', label: 'Saiu para Entrega', icon: <Bike size={20} /> },
    { key: 'finalizado', label: 'Entregue', icon: <MapPin size={20} /> },
  ];

  if (pedido.tipoPedido === 'RETIRADA') {
    steps.splice(3, 1); // remove em_entrega
  }

  const currentIdx = steps.findIndex(s => s.key === pedido.status);

  return (
    <div style={{ paddingBottom: 100, minHeight: '100vh', background: 'white' }}>
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 10, padding: 20, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 16 }}>
          <ChevronLeft size={24} color="var(--secondary)" />
        </button>
        <h2 style={{ fontSize: 18, margin: 0 }}>Pedido #{pedido.id}</h2>
      </header>

      <div className="container" style={{ padding: '20px' }}>
        
        {/* Status Tracker */}
        <div style={{ background: 'var(--bg-main)', borderRadius: 20, padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20, textAlign: 'center', color: 'var(--secondary)' }}>Acompanhe seu pedido</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((step, idx) => {
              const isActive = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={step.key} style={{ display: 'flex', gap: 16, opacity: isActive ? 1 : 0.4 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 20, background: isActive ? 'var(--primary)' : 'var(--border-color)', color: isActive ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {step.icon}
                    </div>
                    {idx < steps.length - 1 && (
                      <div style={{ width: 2, height: 30, background: isActive && !isCurrent ? 'var(--primary)' : 'var(--border-color)', margin: '4px 0' }} />
                    )}
                  </div>
                  <div style={{ padding: '10px 0' }}>
                    <strong style={{ color: isCurrent ? 'var(--primary)' : 'var(--secondary)' }}>{step.label}</strong>
                    {isCurrent && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Neste momento</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PIX INFO (se existir e estiver aguardando) */}
        {pedido.pagamento === 'PIX' && pedido.status === 'recebido' && pedido.pix_payload && (
          <div style={{ background: 'var(--primary-light)', borderRadius: 20, padding: 24, marginBottom: 20, border: '2px dashed var(--primary)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary-dark)', marginBottom: 12 }}>Pague via PIX</h3>
            <p style={{ fontSize: 14, color: 'var(--primary-dark)', marginBottom: 16 }}>Copie o código abaixo para pagar no app do seu banco:</p>
            <div style={{ background: 'white', padding: 12, borderRadius: 12, wordBreak: 'break-all', fontSize: 12, border: '1px solid var(--border-color)', marginBottom: 12 }}>
              {pedido.pix_payload}
            </div>
            <button 
              onClick={() => { navigator.clipboard.writeText(pedido.pix_payload); alert('Código PIX copiado!'); }}
              className="btn-primary" 
              style={{ width: '100%', padding: '12px' }}
            >
              COPIAR CÓDIGO PIX
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default OrderStatus;
