import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import CheckoutForm from './CheckoutForm';

function CartDrawer({
  cart,
  isOpen,
  mode,
  onClose,
  onCheckout,
  onModeChange,
  onQuantityChange,
  onRemove,
  subtotal,
  total,
  checkoutData,
  onCheckoutDataChange,
  submitting,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <aside
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        width: 420,
        maxWidth: '100%',
        height: '100vh',
        background: 'white',
        padding: 28,
        boxShadow: '-10px 0 40px rgba(0,0,0,0.08)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>{mode === 'cart' ? 'Seu carrinho' : 'Finalizar pedido'}</h2>
        <button onClick={onClose} style={{ background: 'none' }}>
          <X />
        </button>
      </div>

      {mode === 'cart' ? (
        <>
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 14 }}>
            {cart.length === 0 ? (
              <div
                style={{
                  color: 'var(--text-muted)',
                  display: 'grid',
                  placeItems: 'center',
                  marginTop: 60,
                  gap: 12,
                }}
              >
                <ShoppingBag size={52} />
                <span>Adicione produtos para começar.</span>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 18,
                    padding: 14,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      gap: 12,
                    }}
                  >
                    <div>
                      <strong>{item.name || item.nome}</strong>
                      <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                        R$ {Number(item.price || item.preco).toFixed(2)}
                      </div>
                    </div>

                    <button onClick={() => onRemove(item.id)} style={{ background: 'none' }}>
                      <Trash2 size={18} color="#d64545" />
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: '#f7f7f7',
                        borderRadius: 999,
                        padding: '8px 10px',
                      }}
                    >
                      <button onClick={() => onQuantityChange(item.id, -1)} style={{ background: 'none' }}>
                        <Minus size={16} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onQuantityChange(item.id, 1)} style={{ background: 'none' }}>
                        <Plus size={16} />
                      </button>
                    </div>

                    <strong>
                      R$ {(Number(item.price || item.preco) * item.quantity).toFixed(2)}
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
              >
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}
              >
                <strong>Total</strong>
                <strong style={{ color: 'var(--primary)' }}>R$ {total.toFixed(2)}</strong>
              </div>

              <button
                onClick={() => onModeChange('checkout')}
                style={{
                  width: '100%',
                  background: 'var(--primary)',
                  color: 'white',
                  padding: 18,
                  borderRadius: 18,
                  fontWeight: 800,
                }}
              >
                Continuar para entrega
              </button>
            </div>
          )}
        </>
      ) : (
        <CheckoutForm
          checkoutData={checkoutData}
          onChange={onCheckoutDataChange}
          onSubmit={onCheckout}
          onBack={() => onModeChange('cart')}
          submitting={submitting}
          total={total}
        />
      )}
    </aside>
  );
}

export default CartDrawer;