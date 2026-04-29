import { useState } from 'react';

function MenuPreview({ categories, products }) {
  const [activeCat, setActiveCat] = useState('Todos');

  // Filtra apenas produtos que não estão marcados como inativos
  const filtered = products.filter(p => 
    p.ativo !== false && (activeCat === 'Todos' || String(p.categoria_id || p.categoriaId) === String(activeCat))
  );

  if (products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
        <p>Nenhum produto cadastrado no sistema.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      {/* Filtros por Categoria */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10 }}>
        <button 
          onClick={() => setActiveCat('Todos')}
          className={activeCat === 'Todos' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 24px', borderRadius: 20, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}
        >
          🍔 Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={activeCat === cat.id ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '10px 24px', borderRadius: 20, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}
          >
            {cat.nome}
          </button>
        ))}
      </div>

      {/* Grid de Produtos Premium */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: 24 
      }}>
        {filtered.map(product => {
          const semEstoque = Number(product.estoque) <= 0;
          return (
            <div key={product.id} className="table-container" style={{ 
              padding: 0, 
              overflow: 'hidden', 
              transition: '0.3s transform',
              cursor: 'default',
              opacity: semEstoque ? 0.7 : 1
            }}>
              {/* Imagem do Produto */}
              <div style={{ position: 'relative', height: 180, width: '100%', background: '#f1f5f9' }}>
                <img 
                  src={product.imagem || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'} 
                  alt={product.nome}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {semEstoque && (
                  <div style={{ 
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: 14, textTransform: 'uppercase' }}>Esgotado</span>
                  </div>
                )}
                <div style={{ 
                  position: 'absolute', bottom: 12, right: 12, 
                  background: 'white', padding: '6px 14px', 
                  borderRadius: 20, fontSize: 14, fontWeight: 800, color: 'var(--primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  R$ {Number(product.preco).toFixed(2)}
                </div>
              </div>
              
              {/* Informações */}
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--secondary)' }}>{product.nome}</h4>
                </div>
                
                <p style={{ 
                  margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)', 
                  height: 38, overflow: 'hidden', display: '-webkit-box', 
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5
                }}>
                  {product.descricao || 'Produto artesanal preparado com os melhores ingredientes.'}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ 
                      width: 8, height: 8, borderRadius: '50%', 
                      background: semEstoque ? '#e53e3e' : '#48bb78' 
                    }}></div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {semEstoque ? 'Sem estoque' : `${product.estoque} disponíveis`}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', 
                    letterSpacing: 1, color: 'var(--primary)', opacity: 0.8
                  }}>
                    {product.categoria?.nome || 'Geral'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && products.length > 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <p>Nenhum produto encontrado nesta categoria.</p>
        </div>
      )}
    </div>
  );
}

export default MenuPreview;