import { useState } from 'react';

const PRESET_EMAIL = 'samuele.coccione@gmail.com';

function translateError(code) {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Password errata.';
    case 'auth/user-not-found':     return 'Utente non trovato.';
    case 'auth/too-many-requests':  return 'Troppi tentativi. Riprova tra qualche minuto.';
    case 'auth/network-request-failed': return 'Errore di rete. Controlla la connessione.';
    default: return 'Errore di accesso. Riprova.';
  }
}

export default function Login({ login }) {
  const [email,    setEmail]    = useState(PRESET_EMAIL);
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!password.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(translateError(err.code));
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
    }}>
      <div className="global-grain" />
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'var(--surface)', border: '1px solid var(--border)',
        padding: '40px 32px',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text)', marginBottom: 28,
        }}>
          Sistema di Vita
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="cm-label" style={{ display: 'block', marginBottom: 5 }}>Email</label>
            <input
              className="cm-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label className="cm-label" style={{ display: 'block', marginBottom: 5 }}>Password</label>
            <input
              className="cm-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              placeholder="••••••••"
              style={{ width: '100%' }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--status-red)', marginTop: -4 }}>
              {error}
            </div>
          )}

          <button
            className="cm-btn"
            type="submit"
            disabled={loading || !password.trim()}
            style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}
          >
            {loading ? '...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
