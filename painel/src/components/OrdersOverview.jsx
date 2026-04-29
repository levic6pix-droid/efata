function OrdersOverview({ pedidos }) {
  const getStatusStyle = (status) => {
    const map = {
      recebido: { bg: 'var(--yellow-100)', color: 'var(--yellow-600)', label: 'Novo' },
      preparo: { bg: '#E3F2FD', color: '#1E88E5', label: 'Preparo' },
      pronto: { bg: 'var(--green-100)', color: 'var(--green-700)', label: 'Pronto' },
      despachado: { bg: '#f5f3ff', color: '#553c9a', label: 'Entrega' },
      finalizado: { bg: 'var(--green-100)', color: 'var(--green-700)', label: 'Entregue' },
      cancelado: { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelado' },
    };
    return map[status] || { bg: '#f1f5f9', color: '#475569', label: status };
  };

  return (
    <div className="table-container" style={{ padding: 0 }}>
      <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--secondary)' }}>Atividade Recente</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Últimos 8 pedidos realizados no sistema.</p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ paddingLeft: 30 }}>ID</th>
              <th>Cliente</th>
              <th>Status</th>
              <th style={{ textAlign: 'right', paddingRight: 30 }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Nenhum pedido registrado hoje.
                </td>
              </tr>
            )}
            {pedidos.slice(0, 8).map((pedido) => {
              const statusStyle = getStatusStyle(pedido.status);
              return (
                <tr key={pedido.id}>
                  <td style={{ paddingLeft: 30 }}>
                    <div style={{ 
                      fontSize: 13, 
                      fontWeight: 700,
                      color: '#64748b'
                    }}>
                      #{pedido.id}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{pedido.cliente?.nome}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pedido.cliente?.telefone}</div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '6px 12px', 
                      borderRadius: 10, 
                      fontSize: 11, 
                      fontWeight: 800, 
                      textTransform: 'uppercase',
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.color}15`
                    }}>
                      {statusStyle.label}
                    </span>
                  </td>
                  <td style={{ 
                    textAlign: 'right', 
                    paddingRight: 30,
                    fontSize: 15,
                    fontWeight: 800,
                    color: 'var(--secondary)'
                  }}>
                    R$ {Number(pedido.total).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrdersOverview;