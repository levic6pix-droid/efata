import { assignEntregador, updatePedidoStatus } from '../services/admin';
import { Clock, User, Package, ChevronRight, CheckCircle, Printer, MapPin, Store, X } from 'lucide-react';
import { useState } from 'react';

const columns = [
  { key: 'recebido', title: 'Novos Pedidos', nextStatus: 'preparo', color: '#fbbf24', action: 'Preparar' }, // Amber
  { key: 'preparo', title: 'Cozinha / Preparo', nextStatus: 'pronto', color: '#3b82f6', action: 'Pronto' }, // Blue
  { key: 'pronto', title: 'Pronto p/ Entrega', nextStatus: 'finalizado', color: '#10b981', action: 'Finalizar' }, // Green
  { key: 'despachado', title: 'Em Rota de Entrega', nextStatus: 'finalizado', color: '#8b5cf6', action: 'Entregue' }, // Violet
];

function DeliveryBoard({ entregadores, onRefresh, pedidos }) {
  const [printData, setPrintData] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const handleStatus = async (id, status) => {
    setProcessingId(id);
    try {
      await updatePedidoStatus(id, status);
      onRefresh();
    } catch (e) {
      alert('Erro ao atualizar status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssign = async (pedidoId, entregadorId) => {
    if (!entregadorId) return;
    setProcessingId(pedidoId);
    try {
      await assignEntregador(pedidoId, entregadorId);
      onRefresh();
    } catch(e) {
      alert('Erro ao despachar.');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePrint = (pedido) => {
    setPrintData(pedido);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <>
      <style>
        {`
          @media print {
            @page { margin: 0; size: 80mm auto; }
            body { margin: 0; padding: 0; width: 80mm; background: white !important; }
            body * { visibility: hidden !important; }
            #kitchen-receipt, #kitchen-receipt * { visibility: visible !important; }
            #kitchen-receipt { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 72mm; 
              padding: 4mm;
              font-family: 'Courier New', Courier, monospace;
              color: black !important;
              background: white !important;
              display: block !important;
            }
            #kitchen-receipt::after {
              content: "";
              display: block;
              height: 30mm;
            }
          }
        `}
      </style>

      {/* Comanda Oculta */}
      <div id="kitchen-receipt" style={{ display: 'none' }}>
        {printData && (
          <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: '0', fontSize: '20px', borderBottom: '2px solid #000' }}>#{printData.id}</h2>
              <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold' }}>
                {printData.tipoPedido === 'RETIRADA' ? '⚠️ RETIRADA BALCÃO' : '🛵 DELIVERY'}
              </p>
              <p style={{ fontSize: '11px' }}>Origem: {printData.origem}</p>
            </div>
            <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
            <p><strong>DATA:</strong> {new Date(printData.createdAt).toLocaleString('pt-BR')}</p>
            <p><strong>CLIENTE:</strong> {printData.cliente?.nome?.toUpperCase()}</p>
            
            {printData.tipoPedido === 'DELIVERY' && (
              <>
                <p><strong>📍 ENDEREÇO:</strong> {printData.cliente?.rua}, {printData.cliente?.numero}</p>
                <p>{printData.cliente?.bairro}</p>
              </>
            )}

            <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
            {printData.itens.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '5px' }}>
                <strong>{item.quantidade}x {item.produto?.nome?.toUpperCase()}</strong>
                {item.observacao && <p style={{ fontSize: '11px', margin: '2px 0 0 15px' }}>- {item.observacao}</p>}
              </div>
            ))}
            <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
            <p style={{ textAlign: 'right', fontWeight: 'bold' }}>TOTAL: R$ {Number(printData.total).toFixed(2)}</p>
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px' }}>
              {printData.tipoPedido === 'RETIRADA' ? '*** CLIENTE IRÁ RETIRAR NO LOCAL ***' : '*** ENTREGAR NO ENDEREÇO ACIMA ***'}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 20 }}>
        {columns.map((column) => {
          const items = pedidos.filter((pedido) => pedido.status === column.key);

          return (
            <div key={column.key} style={{ 
              minWidth: 320, 
              width: 320, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 16,
              background: '#f1f5f9',
              padding: 12,
              borderRadius: 24,
              border: '1px solid #e2e8f0'
            }}>
              {/* Header da Coluna */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '16px 20px', 
                background: 'white', 
                borderRadius: 18, 
                borderBottom: `4px solid ${column.color}`,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{column.title}</h3>
                </div>
                <span style={{ fontSize: 12, fontWeight: 900, color: 'white', background: column.color, padding: '4px 12px', borderRadius: 10 }}>
                  {items.length}
                </span>
              </div>

              {/* Lista de Pedidos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((pedido) => (
                  <article
                    key={pedido.id}
                    style={{ 
                      background: 'white',
                      padding: 18, 
                      borderRadius: 20,
                      border: '1px solid #e2e8f0',
                      borderTop: `4px solid ${column.color}`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>ORD #{pedido.id}</span>
                        {pedido.origem === 'PDV' && (
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: 6 }}>PDV</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <button 
                            onClick={() => {
                              if(window.confirm('Deseja realmente CANCELAR este pedido? O estoque será devolvido.')) {
                                handleStatus(pedido.id, 'cancelado');
                              }
                            }}
                            disabled={processingId === pedido.id}
                            style={{ background: 'none', border: 'none', cursor: processingId === pedido.id ? 'not-allowed' : 'pointer', color: '#fc8181', opacity: processingId === pedido.id ? 0.5 : 1 }}
                            title="Cancelar Pedido"
                          >
                            <X size={16} />
                          </button>
                          <button 
                            onClick={() => handlePrint(pedido)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            title="Imprimir Comanda"
                          >
                            <Printer size={16} />
                          </button>
                        </div>
                         <div style={{ fontSize: 10, fontWeight: 700, color: column.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                           <Clock size={10} /> {new Date(pedido.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 14, color: 'var(--secondary)' }}>{pedido.cliente?.nome}</strong>
                        {pedido.tipoPedido === 'RETIRADA' && <Store size={12} color="#059669" />}
                      </div>
                      {pedido.tipoPedido === 'DELIVERY' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          <MapPin size={10} /> {pedido.cliente?.bairro}
                        </div>
                      ) : (
                        <div style={{ fontSize: 10, color: '#059669', fontWeight: 700, marginTop: 2 }}>RETIRADA NA LOJA</div>
                      )}
                    </div>

                    <div style={{ background: '#f8fafc', padding: 10, borderRadius: 12, marginBottom: 14 }}>
                      {pedido.itens.map((item) => (
                        <div key={item.id} style={{ fontSize: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                          <span><span style={{ fontWeight: 700 }}>{item.quantidade}x</span> {item.produto?.nome}</span>
                        </div>
                      ))}
                    </div>

                    {column.key === 'pronto' && pedido.tipoPedido === 'DELIVERY' && (
                      <select
                        defaultValue=""
                        disabled={processingId === pedido.id}
                        onChange={(event) => handleAssign(pedido.id, event.target.value)}
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: 12, marginBottom: 0, opacity: processingId === pedido.id ? 0.5 : 1 }}
                      >
                        <option value="">Despachar...</option>
                        {entregadores.filter((e) => e.ativo).map((e) => (
                          <option key={e.id} value={e.id}>{e.nome}</option>
                        ))}
                      </select>
                    )}

                    {column.nextStatus && (
                      <button
                        disabled={processingId === pedido.id}
                        onClick={() => {
                          const isFinalizing = (pedido.tipoPedido === 'RETIRADA' && column.key === 'pronto') || column.nextStatus === 'finalizado';
                          if (isFinalizing) {
                            if (window.confirm('Confirmar finalização e entrega deste pedido? O valor será lançado no Caixa.')) {
                              handleStatus(pedido.id, 'finalizado');
                            }
                          } else {
                            handleStatus(pedido.id, column.nextStatus);
                          }
                        }}
                        style={{ 
                          width: '100%', 
                          height: 36, 
                          borderRadius: 10, 
                          border: 'none', 
                          background: column.color, 
                          color: 'white', 
                          fontSize: 12, 
                          fontWeight: 800, 
                          cursor: processingId === pedido.id ? 'not-allowed' : 'pointer',
                          opacity: processingId === pedido.id ? 0.6 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          marginTop: (column.key === 'pronto' && pedido.tipoPedido === 'DELIVERY') ? 12 : 0
                        }}
                      >
                        {processingId === pedido.id ? (
                           <>Processando...</>
                        ) : pedido.tipoPedido === 'RETIRADA' && column.key === 'pronto' ? (
                          <> <CheckCircle size={14} /> Entregar ao Cliente </>
                        ) : (
                          <> {column.key === 'despachado' ? <CheckCircle size={14} /> : <ChevronRight size={14} />} {column.action} </>
                        )}
                      </button>
                    )}

                    {column.key === 'despachado' && pedido.entregador && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: column.color, marginTop: 8, textAlign: 'center' }}>
                        Entregador: {pedido.entregador.nome}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

const inputStyle = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: '#f8fafc',
  outline: 'none'
};

export default DeliveryBoard;