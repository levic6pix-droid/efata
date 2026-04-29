import { MessageSquare, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { sendChat } from '../services/admin';

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const nextMessages = [...messages, { role: 'user', content: input }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChat(nextMessages);
      const answer = response.choices?.[0]?.message;

      if (answer) {
        setMessages((current) => [...current, answer]);
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'Falha ao consultar a IA. Verifique o backend.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div
          style={{
            position: 'fixed',
            right: 24,
            bottom: 100,
            width: 340,
            height: 480,
            background: 'white',
            borderRadius: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.16)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
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
            <strong>Efata AI</strong>
            <button onClick={() => setOpen(false)} style={{ background: 'none', color: 'white' }}>
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: 'auto',
              background: '#f7fafc',
              display: 'grid',
              gap: 10,
            }}
          >
            {messages.length === 0 && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>
                Faça perguntas sobre vendas, pedidos e operação.
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  justifySelf: message.role === 'user' ? 'end' : 'start',
                  background: message.role === 'user' ? 'var(--primary)' : 'white',
                  color: message.role === 'user' ? 'white' : 'var(--text-main)',
                  padding: '12px 14px',
                  borderRadius: 16,
                  maxWidth: '85%',
                }}
              >
                {message.content}
              </div>
            ))}

            {loading && <div>Digitando...</div>}
            <div ref={ref} />
          </div>

          <div style={{ display: 'flex', gap: 10, padding: 14, borderTop: '1px solid var(--border)' }}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSend();
                }
              }}
              placeholder="Pergunte à IA"
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid var(--border)',
              }}
            />
            <button className="btn-primary" onClick={handleSend} disabled={loading}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((current) => !current)}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          width: 60,
          height: 60,
          borderRadius: 20,
          background: 'var(--primary)',
          color: 'white',
          boxShadow: '0 12px 25px rgba(255, 92, 0, 0.3)',
          zIndex: 999,
        }}
      >
        <MessageSquare />
      </button>
    </>
  );
}

export default ChatWidget;