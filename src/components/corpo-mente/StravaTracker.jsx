import { useState, useEffect, useRef } from 'react';

const TOKEN_KEY      = 'sv_strava_tokens';
const ACTIVITIES_KEY = 'sv_strava_activities';
const BAG_KG         = 10;

const CLIENT_ID     = import.meta.env.VITE_STRAVA_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET;

/* ── helpers ── */
function fmtDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: '2-digit',
  });
}

/* ── Strava API calls (via Vite proxy /strava-proxy → strava.com) ── */
async function exchangeCode(code) {
  const res = await fetch('/strava-proxy/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token exchange fallito (${res.status}): ${txt}`);
  }
  return res.json();
}

async function doRefresh(refreshToken) {
  const res = await fetch('/strava-proxy/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Refresh token fallito (${res.status})`);
  return res.json();
}

async function loadActivities(accessToken) {
  const res = await fetch('/strava-proxy/api/v3/athlete/activities?per_page=100&page=1', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Fetch attività fallito (${res.status})`);
  const all = await res.json();
  return all
    .filter(a => ['Walk', 'Hike'].includes(a.type) || ['Walk', 'Hike'].includes(a.sport_type))
    .map(a => ({
      id:        a.id,
      name:      a.name,
      type:      a.type || a.sport_type,
      date:      (a.start_date_local || a.start_date).split('T')[0],
      km:        parseFloat((a.distance / 1000).toFixed(2)),
      duration:  a.moving_time,
      elevation: Math.round(a.total_elevation_gain || 0),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* ── component ── */
export default function StravaTracker() {
  const [tokens, setTokens] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TOKEN_KEY)); }
    catch { return null; }
  });
  const [activities, setActivities] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ACTIVITIES_KEY) || '[]'); }
    catch { return []; }
  });
  const [busy,   setBusy]   = useState(false);
  const [status, setStatus] = useState('');
  const [error,  setError]  = useState(null);
  const exchanged = useRef(false); // prevent double exchange in StrictMode

  const saveTokens = (t) => {
    setTokens(t);
    localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
  };
  const saveActivities = (list) => {
    setActivities(list);
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(list));
  };

  /* Handle OAuth callback — detect ?code= in URL after Strava redirect */
  useEffect(() => {
    if (exchanged.current) return;
    const params = new URLSearchParams(window.location.search);
    const code  = params.get('code');
    const err   = params.get('error');

    if (err) {
      setError('Autorizzazione negata da Strava.');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    if (!code) return;
    exchanged.current = true;

    // Clean URL immediately
    window.history.replaceState({}, '', window.location.pathname);

    setBusy(true);
    setError(null);
    setStatus('Connessione a Strava in corso...');

    exchangeCode(code)
      .then(data => {
        saveTokens({
          access_token:  data.access_token,
          refresh_token: data.refresh_token,
          expires_at:    data.expires_at,
        });
        setStatus('Recupero attività...');
        return loadActivities(data.access_token);
      })
      .then(list => {
        saveActivities(list);
        setStatus('');
        setBusy(false);
      })
      .catch(e => {
        setError(e.message);
        setBusy(false);
      });
  }, []);

  /* Get a valid (possibly refreshed) access token */
  const validToken = async () => {
    if (!tokens) throw new Error('Non autenticato');
    const now = Math.floor(Date.now() / 1000);
    if (tokens.expires_at > now + 60) return tokens.access_token;
    setStatus('Rinnovo token...');
    const data = await doRefresh(tokens.refresh_token);
    const next = {
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
    };
    saveTokens(next);
    return next.access_token;
  };

  const sync = async () => {
    setBusy(true);
    setError(null);
    setStatus('Sincronizzazione...');
    try {
      const token = await validToken();
      const list  = await loadActivities(token);
      saveActivities(list);
      setStatus('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const disconnect = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACTIVITIES_KEY);
    setTokens(null);
    setActivities([]);
    setError(null);
  };

  const connectUrl = () => {
    const redirect = encodeURIComponent(`${window.location.origin}/corpo-mente`);
    return `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=activity:read_all&approval_prompt=auto`;
  };

  /* ── Credenziali mancanti ── */
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return (
      <div className="sv-box">
        <div className="cm-label" style={{ marginBottom: 10 }}>Configurazione richiesta</div>
        <p className="sv-desc">
          Crea un file <code className="sv-code-inline">.env</code> nella root del progetto:
        </p>
        <pre className="sv-pre">
{`VITE_STRAVA_CLIENT_ID=il_tuo_client_id
VITE_STRAVA_CLIENT_SECRET=il_tuo_client_secret`}
        </pre>
        <p className="sv-hint">
          Ottieni le credenziali da <strong>strava.com/settings/api</strong><br />
          Redirect URI da registrare: <code className="sv-code-inline">http://localhost:5173/corpo-mente</code>
        </p>
      </div>
    );
  }

  /* ── Non connesso ── */
  if (!tokens) {
    return (
      <div>
        {error && <div className="sv-error">{error}</div>}
        {busy ? (
          <div className="sv-loading">{status}</div>
        ) : (
          <>
            <p className="sv-desc">
              Connetti Strava per importare automaticamente le sessioni Walk e Hike.<br />
              Ogni attività mostra: data, km, durata, dislivello e zaino fisso {BAG_KG}kg.
            </p>
            <a href={connectUrl()} className="cm-btn sv-connect-btn">
              Connetti Strava
            </a>
          </>
        )}
      </div>
    );
  }

  /* ── Connesso ── */
  const totalKm   = activities.reduce((s, a) => s + a.km, 0);
  const totalElev = activities.reduce((s, a) => s + a.elevation, 0);

  return (
    <div>
      {/* Stats */}
      <div className="cm-stat-strip">
        <div className="cm-stat-cell">
          <div className="cm-stat-label">Attività</div>
          <div className="cm-stat-value">{activities.length}</div>
        </div>
        <div className="cm-stat-cell">
          <div className="cm-stat-label">KM totali</div>
          <div className="cm-stat-value">{totalKm.toFixed(1)}</div>
        </div>
        <div className="cm-stat-cell">
          <div className="cm-stat-label">Dislivello</div>
          <div className="cm-stat-value">{totalElev.toLocaleString('it-IT')}m</div>
        </div>
        <div className="cm-stat-cell">
          <div className="cm-stat-label">Zaino fisso</div>
          <div className="cm-stat-value">{BAG_KG}kg</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
        <button className="cm-btn" onClick={sync} disabled={busy}>
          {busy ? (status || '...') : 'Sincronizza Strava'}
        </button>
        <button className="cm-btn cm-btn-ghost" onClick={disconnect}>Disconnetti</button>
        {busy && !status && <span className="sv-loading" style={{ padding: 0 }}>...</span>}
      </div>

      {error && <div className="sv-error">{error}</div>}

      {activities.length === 0 ? (
        <div className="cm-empty">Nessuna attività Walk o Hike trovata su Strava</div>
      ) : (
        <table className="cm-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Attività</th>
              <th>KM</th>
              <th>Durata</th>
              <th>Dislivello</th>
              <th>Zaino</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(a => (
              <tr key={a.id}>
                <td>{fmtDate(a.date)}</td>
                <td>
                  <strong>{a.name}</strong>
                  <span className="sv-type-badge">{a.type}</span>
                </td>
                <td><strong>{a.km} km</strong></td>
                <td>{fmtDuration(a.duration)}</td>
                <td>{a.elevation > 0 ? `${a.elevation}m` : '—'}</td>
                <td style={{ color: 'var(--text2)' }}>{BAG_KG}kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
