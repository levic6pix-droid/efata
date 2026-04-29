import { Lock, User } from 'lucide-react';
import { useState } from 'react';

function LoginScreen({ error, onSubmit }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    await onSubmit({ username, password });
    setSubmitting(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'linear-gradient(135deg, var(--secondary) 0%, #065f46 100%)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="table-container"
        style={{ 
          width: '100%', 
          maxWidth: 420, 
          display: 'grid', 
          gap: 18, 
          padding: 40,
          borderRadius: 32,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' 
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <img
            src="/logo.png"
            alt="Efata Delivery"
            style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 20, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}
          />
          <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: 3 }}>
            SISTEMA ERP EFATA
          </div>
          <h1 style={{ marginTop: 10, fontSize: 32, fontWeight: 900, letterSpacing: -1, color: 'var(--secondary)' }}>Bem-vindo</h1>
          <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>
            Insira suas credenciais para continuar.
          </p>
        </div>

        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Usuário</span>
          <div style={{ position: 'relative' }}>
            <User
              size={18}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Digite seu login"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              style={fieldStyle}
              required
            />
          </div>
        </label>

        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Senha</span>
          <div style={{ position: 'relative' }}>
            <Lock
              size={18}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={fieldStyle}
              required
            />
          </div>
        </label>

        {error && (
          <div
            style={{
              background: 'rgba(252, 129, 129, 0.1)',
              color: '#fc8181',
              padding: '14px 16px',
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 600,
              border: '1px solid rgba(252, 129, 129, 0.2)'
            }}
          >
            {error}
          </div>
        )}

        <button 
          className="btn-primary" 
          type="submit" 
          disabled={submitting}
          style={{ height: 56, fontSize: 16, fontWeight: 800, marginTop: 10 }}
        >
          {submitting ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}
        </button>
      </form>
    </div>
  );
}

const fieldStyle = {
  width: '100%',
  padding: '16px 16px 16px 44px',
  borderRadius: 14,
  border: '1px solid var(--border)',
  outline: 'none',
  fontSize: '15px',
  background: '#f8fafc',
  transition: 'all 0.2s'
};

export default LoginScreen;