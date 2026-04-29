import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Smartphone, RefreshCw, Phone, ChevronRight, Circle } from 'lucide-react';
import http from '../services/http';

import { QRCodeSVG } from 'qrcode.react';

function formatPhone(phone = '') {
  return phone.replace('@s.whatsapp.net', '').replace('@c.us', '');
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function WhatsAppPanel({ socket }) {
  const [qrCode, setQrCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [conversas, setConversas] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [messages, setMessages] = useState([]);
  const [realtimeFeed, setRealtimeFeed] = useState([]); // feed global em tempo real
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const scrollRef = useRef(null);
  const feedRef = useRef(null);

  // ── Carrega lista de conversas da API ──────────────────────
  const loadConversas = async () => {
    try {
      const res = await http.get('/chat/conversas');
      setConversas(res.data || []);
    } catch {}
  };

  useEffect(() => { loadConversas(); }, []);
  useEffect(() => {
    const t = setInterval(loadConversas, 15000); // refresh a cada 15s
    return () => clearInterval(t);
  }, []);

  // ── Carrega mensagens de uma conversa ──────────────────────
  const loadMensagens = async (phone) => {
    setLoadingMsgs(true);
    try {
      const res = await http.get(`/chat/conversa/${encodeURIComponent(phone)}`);
      setMessages(res.data || []);
    } catch { setMessages([]); }
    finally { setLoadingMsgs(false); }
  };

  useEffect(() => {
    if (selectedPhone) loadMensagens(selectedPhone);
  }, [selectedPhone]);

  // ── Socket.IO: eventos em tempo real ──────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.emit('request_whatsapp_status');

    socket.on('whatsapp_qr', (data) => {
      setQrCode(data.qr);
      setIsConnected(false);
    });

    socket.on('whatsapp_status', (data) => {
      if (data.connected) { setIsConnected(true); setQrCode(''); }
    });

    socket.on('whatsapp_message', (msg) => {
      // Feed em tempo real (aparece para todos, independente da conversa selecionada)
      setRealtimeFeed(prev => [...prev, msg].slice(-200));

      // Se for da conversa aberta, adiciona às mensagens visíveis
      if (selectedPhone && formatPhone(msg.from) === formatPhone(selectedPhone)) {
        setMessages(prev => [...prev, {
          role: msg.type === 'incoming' ? 'user' : 'assistant',
          content: msg.body,
          criado_em: msg.timestamp
        }]);
      }

      // Atualiza sidebar de conversas
      setConversas(prev => {
        const phone = msg.from;
        const exists = prev.find(c => c.telefone === phone);
        if (exists) {
          return [{ ...exists, ultimaMensagem: msg.body, atualizado: msg.timestamp },
                  ...prev.filter(c => c.telefone !== phone)];
        }
        return [{ telefone: phone, ultimaMensagem: msg.body, atualizado: msg.timestamp, total: 1 }, ...prev];
      });
    });

    return () => {
      socket.off('whatsapp_qr');
      socket.off('whatsapp_status');
      socket.off('whatsapp_message');
    };
  }, [socket, selectedPhone]);

  // ── Auto-scroll ────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);
  useEffect(() => {
    feedRef.current?.scrollTo(0, feedRef.current.scrollHeight);
  }, [realtimeFeed]);

  // ── Render: QR Code / Aguardando ──────────────────────────
  if (!isConnected) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, height: 'calc(100vh - 200px)' }}>
        <div className="table-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
          {qrCode ? (
            <>
              <div style={{ background: 'white', padding: 20, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
                {QRCodeSVG ? <QRCodeSVG value={qrCode} size={240}/> : <pre style={{ fontSize: 8 }}>{qrCode}</pre>}
              </div>
              <h2 style={{ marginTop: 28, fontSize: 22, fontWeight: 800 }}>Conectar WhatsApp</h2>
              <p style={{ marginTop: 10, color: 'var(--text-muted)', maxWidth: 280 }}>Escaneie o QR Code com seu celular para ativar o Garçom Digital.</p>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <RefreshCw size={48} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }}/>
              <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Aguardando conexão WhatsApp...</p>
            </div>
          )}
        </div>

        {/* Feed global mesmo desconectado (histórico do banco) */}
        <GlobalFeed feed={realtimeFeed} feedRef={feedRef}/>
      </div>
    );
  }

  // ── Render: Painel principal (conectado) ──────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, height: 'calc(100vh - 180px)' }}>

      {/* ─── SIDEBAR: Lista de conversas ─────────────────── */}
      <div className="table-container" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Conversas</span>
          <div style={{ background: '#f0fdf4', color: 'var(--primary)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 800 }}>
            {conversas.length}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversas.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <Smartphone size={32} style={{ opacity: 0.2, margin: '0 auto 12px' }}/>
              <p>Nenhuma conversa ainda</p>
            </div>
          ) : conversas.map((c, idx) => (
            <div key={idx} onClick={() => setSelectedPhone(c.telefone)}
              style={{
                padding: '14px 16px', borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                background: selectedPhone === c.telefone ? '#f0fdf4' : 'transparent',
                borderLeft: selectedPhone === c.telefone ? '3px solid var(--primary)' : '3px solid transparent',
                transition: '0.15s'
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                    {formatPhone(c.telefone).charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{formatPhone(c.telefone)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.total || 0} mensagens</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatTime(c.atualizado)}</div>
              </div>
              {c.ultimaMensagem && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 40, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {c.ultimaMensagem.substring(0, 50)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── AREA PRINCIPAL: Chat ou Feed global ────────────── */}
      <div className="table-container" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Header do chat */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <MessageSquare size={20} color="var(--primary)"/>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>
              {selectedPhone ? formatPhone(selectedPhone) : 'Monitor em Tempo Real'}
            </h3>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {selectedPhone ? 'Conversa via WhatsApp' : 'Todas as mensagens aparecerão aqui'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', padding: '4px 12px', borderRadius: 20 }}>
            <Circle size={8} fill="#22c55e" color="#22c55e"/>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>AGENTE ATIVO</span>
          </div>
        </div>

        {/* Área de mensagens */}
        <div ref={selectedPhone ? scrollRef : feedRef}
          style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loadingMsgs ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 40 }}>Carregando mensagens...</div>
          ) : selectedPhone ? (
            // Conversa selecionada
            messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 40 }}>
                <MessageSquare size={48} style={{ opacity: 0.15, margin: '0 auto 12px' }}/>
                <p>Nenhuma mensagem nesta conversa.</p>
              </div>
            ) : messages.map((msg, idx) => (
              <MessageBubble key={idx} role={msg.role} content={msg.content} time={msg.criado_em}/>
            ))
          ) : (
            // Feed global em tempo real
            realtimeFeed.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', textAlign: 'center' }}>
                <Smartphone size={48} style={{ opacity: 0.15, marginBottom: 16 }}/>
                <p style={{ fontWeight: 600 }}>As mensagens do WhatsApp aparecerão aqui automaticamente.</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>Selecione uma conversa na lista à esquerda para ver o histórico completo.</p>
              </div>
            ) : realtimeFeed.map((msg, idx) => (
              <MessageBubble key={idx} role={msg.type === 'incoming' ? 'user' : 'assistant'}
                content={msg.body} time={msg.timestamp} phone={formatPhone(msg.from)}/>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ role, content, time, phone }) {
  const isUser = role === 'user';
  return (
    <div style={{ alignSelf: isUser ? 'flex-start' : 'flex-end', maxWidth: '75%' }}>
      {phone && (
        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Phone size={10}/> {phone}
        </div>
      )}
      <div style={{
        padding: '12px 16px',
        borderRadius: isUser ? '4px 18px 18px 18px' : '18px 18px 4px 18px',
        background: isUser ? 'white' : 'var(--primary)',
        color: isUser ? 'var(--secondary)' : 'white',
        fontSize: 14, lineHeight: 1.6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: isUser ? '1px solid #e2e8f0' : 'none',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word'
      }}>
        {content}
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: isUser ? 'left' : 'right' }}>
        {isUser ? '👤 Cliente' : '🤖 Garçom IA'} · {formatTime(time)}
      </div>
    </div>
  );
}

function GlobalFeed({ feed, feedRef }) {
  return (
    <div className="table-container" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        Monitor em Tempo Real
      </div>
      <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc' }}>
        {feed.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: 40 }}>
            <Smartphone size={40} style={{ opacity: 0.15, margin: '0 auto 12px' }}/>
            <p>Aguardando mensagens...</p>
          </div>
        ) : feed.map((msg, idx) => (
          <MessageBubble key={idx} role={msg.type === 'incoming' ? 'user' : 'assistant'}
            content={msg.body} time={msg.timestamp} phone={formatPhone(msg.from)}/>
        ))}
      </div>
    </div>
  );
}

export default WhatsAppPanel;
