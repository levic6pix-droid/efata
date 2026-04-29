import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';

const suggestions = [
  'Peça hambúrguer com refrigerante para aproveitar o ticket médio.',
  'Itens com estoque baixo podem acabar hoje.',
  'Finalize seu pedido pelo carrinho e acompanhe pelo WhatsApp da loja.',
];

function SupportChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div
          style={{
            position: 'fixed',
            right: 24,
            bottom: 100,
            width: 320,
            background: 'white',
            borderRadius: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 15,
          }}
        >
          <div
            style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '18px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <strong>Atendimento Delivey</strong>
            <button onClick={() => setOpen(false)} style={{ background: 'none', color: 'white' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: 18, display: 'grid', gap: 10 }}>
            {suggestions.map((suggestion) => (
              <div
                key={suggestion}
                style={{
                  background: '#f8f8f8',
                  borderRadius: 16,
                  padding: 14,
                  color: 'var(--text-main)',
                  fontSize: 14,
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((current) => !current)}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          width: 62,
          height: 62,
          borderRadius: 20,
          background: 'var(--primary)',
          color: 'white',
          boxShadow: '0 12px 25px rgba(255,92,0,0.3)',
          zIndex: 15,
        }}
      >
        <MessageCircle />
      </button>
    </>
  );
}

export default SupportChat;