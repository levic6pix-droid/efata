import { Plus, ShoppingBag } from 'lucide-react';

function ProductCard({ product, onAdd }) {
  return (
    <article
      style={{
        background: 'var(--bg-card)',
        borderRadius: 24,
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
        border: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          background: '#fff4ec',
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {product.imagem ? (
          <img
            src={product.imagem}
            alt={product.nome}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <ShoppingBag size={42} color="var(--primary)" />
        )}
      </div>

      <div style={{ padding: 22, display: 'grid', gap: 12, flex: 1 }}>
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'start',
            }}
          >
            <h3 style={{ fontSize: 18 }}>{product.nome}</h3>
            <span
              style={{
                color: 'var(--primary)',
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}
            >
              R$ {Number(product.preco).toFixed(2)}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
            {product.descricao || 'Produto fresco e preparado sob demanda.'}
          </p>
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {product.categoria?.nome || 'Sem categoria'} • {product.estoque} un.
          </span>

          <button
            onClick={() => onAdd(product)}
            style={{
              background: 'var(--primary)',
              color: 'white',
              width: 42,
              height: 42,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;