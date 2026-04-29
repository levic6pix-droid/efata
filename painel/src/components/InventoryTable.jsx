import { useMemo, useState } from 'react';
import { updateProduct } from '../services/admin';
import { Save, AlertTriangle } from 'lucide-react';

function InventoryTable({ categories, products, onSaved }) {
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(() => Object.keys(edits).length > 0, [edits]);

  const handleEdit = (id, field, value) => {
    setEdits((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(edits).map(async ([id, data]) => {
          const product = products.find((item) => String(item.id) === String(id));
          await updateProduct(id, {
            ...product,
            preco: data.preco !== undefined ? Number(data.preco) : Number(product.preco),
            estoque: data.estoque !== undefined ? Number(data.estoque) : Number(product.estoque),
            categoriaId: data.categoriaId !== undefined ? String(data.categoriaId) : String(product.categoriaId),
          });
        }),
      );
      setEdits({});
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="table-container" style={{ padding: 0 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 30px',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--secondary)' }}>Gestão de Inventário</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Controle rápido de preços e estoque disponível.</p>
        </div>
        
        {hasChanges && (
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '12px 24px' }}>
            <Save size={18} />
            {saving ? 'Salvando...' : 'Aplicar Alterações'}
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ paddingLeft: 30 }}>Produto</th>
              <th>Categoria</th>
              <th style={{ width: 160 }}>Preço Unitário</th>
              <th style={{ width: 160 }}>Qtd. Estoque</th>
              <th style={{ width: 100 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const draft = edits[product.id] || {};
              const currentEstoque = draft.estoque ?? product.estoque;
              const isLowStock = currentEstoque <= (product.estoqueMinimo || 5);
              
              return (
                <tr key={product.id}>
                  <td style={{ paddingLeft: 30 }}>
                    <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{product.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ref: #{product.id}</div>
                  </td>
                  <td>
                    <select
                      value={draft.categoriaId ?? product.categoriaId}
                      onChange={(event) => handleEdit(product.id, 'categoriaId', event.target.value)}
                      style={tableInputStyle}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.nome}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-muted)' }}>R$</span>
                      <input
                        type="number"
                        value={draft.preco ?? product.preco}
                        onChange={(event) => handleEdit(product.id, 'preco', event.target.value)}
                        style={{ ...tableInputStyle, paddingLeft: 34 }}
                      />
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={draft.estoque ?? product.estoque}
                      onChange={(event) => handleEdit(product.id, 'estoque', event.target.value)}
                      style={{ 
                        ...tableInputStyle, 
                        borderColor: isLowStock ? '#fc8181' : 'var(--border)',
                        color: isLowStock ? '#e53e3e' : 'inherit'
                      }}
                    />
                  </td>
                  <td>
                    {isLowStock ? (
                      <div style={{ color: '#e53e3e', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
                        <AlertTriangle size={14} /> Crítico
                      </div>
                    ) : (
                      <div style={{ color: '#48bb78', fontSize: 12, fontWeight: 700 }}>Saudável</div>
                    )}
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

const tableInputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: '#f8fafc',
  fontSize: '14px',
  fontWeight: '500',
  outline: 'none',
  transition: '0.2s'
};

export default InventoryTable;