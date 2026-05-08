import { useState, useEffect, useRef } from 'react';
import { useFirebaseState, removeFirebaseData } from '../../hooks/useFirebaseState';

const TOKEN_KEY      = 'sv_strava_tokens';
const ACTIVITIES_KEY = 'sv_strava_activities';

const CLIENT_ID     = import.meta.env.VITE_STRAVA_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET;

// Auto-sync cooldown in memoria: non risincronizza più di una volta ogni 30 minuti
let lastAutoSync = 0;
const AUTO_SYNC_COOLDOWN_MS = 30 * 60 * 1000;

/* ── Sentinel: token non valido (risposta HTML invece di JSON) ── */
class TokenExpiredError extends Error {
  constructor() { super('Token Strava non valido — risposta non-JSON'); }
}

/* ── Strava API ── */
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
  if (!res.ok) throw new Error(`Token exchange fallito (${res.status})`);
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
  if (!res.ok) throw new Error(`Refresh fallito (${res.status})`);
  return res.json();
}

async function loadActivities(accessToken) {
  const res = await fetch('/strava-proxy/api/v3/athlete/activities?per_page=100&page=1', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Fetch attività fallito (${res.status})`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new TokenExpiredError();
  const all = await res.json();
  const RUCK_TYPES = ['Walk', 'Hike', 'Rucking'];
  return all
    .filter(a => RUCK_TYPES.includes(a.type) || RUCK_TYPES.includes(a.sport_type))
    .map(a => ({
      id:          a.id,
      name:        a.name,
      type:        a.type || a.sport_type,
      date:        (a.start_date_local || a.start_date).split('T')[0],
      km:          parseFloat((a.distance / 1000).toFixed(2)),
      duration:    a.moving_time,
      elevation:   Math.round(a.total_elevation_gain || 0),
      avgPace:     a.moving_time && a.distance > 0
                     ? Math.round(a.moving_time / (a.distance / 1000)) : null,
      avgHR:       a.average_heartrate ? Math.round(a.average_heartrate) : null,
      maxHR:       a.max_heartrate     ? Math.round(a.max_heartrate)     : null,
      calories:    a.calories          ? Math.round(a.calories)          : null,
      sufferScore: a.suffer_score      ?? null,
      kudos:       a.kudos_count       ?? 0,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Componente di connessione Strava — solo logica e status line, nessuna tabella.
 * Gestisce il callback OAuth e fa auto-sync al mount se già connesso.
 */
export default function StravaTracker() {
  const [tokens,     saveTokens]     = useFirebaseState(TOKEN_KEY, null);
  const [,           saveActivities] = useFirebaseState(ACTIVITIES_KEY, []);
  const [syncStatus, setSyncStatus]  = useState('idle'); // idle | syncing | refreshing | done | error
  const [lastSyncAt, setLastSyncAt]  = useState(null);
  const [error,      setError]       = useState(null);
  const exchanged = useRef(false);

  /* ── Helper: ottieni token valido (con refresh se scaduto) ── */
  const validToken = async (currentTokens) => {
    if (!currentTokens) throw new Error('Non autenticato');
    const now = Math.floor(Date.now() / 1000);
    if (currentTokens.expires_at > now + 60) return currentTokens.access_token;
    const data = await doRefresh(currentTokens.refresh_token);
    const next = {
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
    };
    saveTokens(next);
    return next.access_token;
  };

  /* ── Helper: salva attività e aggiorna stato ── */
  const finishSync = (list) => {
    saveActivities(list);
    const now = Date.now();
    lastAutoSync = now;
    setLastSyncAt(now);
    setSyncStatus('done');
  };

  /* ── Sync manuale/automatica ── */
  const sync = async (currentTokens) => {
    setSyncStatus('syncing');
    setError(null);
    try {
      const token = await validToken(currentTokens);
      const list  = await loadActivities(token);
      finishSync(list);
    } catch (e) {
      if (!(e instanceof TokenExpiredError)) {
        setError(e.message);
        setSyncStatus('error');
        return;
      }
      // Token valido secondo il clock ma rifiutato da Strava → forza refresh
      setSyncStatus('refreshing');
      try {
        const data = await doRefresh(currentTokens.refresh_token);
        const next = {
          access_token:  data.access_token,
          refresh_token: data.refresh_token,
          expires_at:    data.expires_at,
        };
        saveTokens(next);
        const list = await loadActivities(next.access_token);
        finishSync(list);
      } catch (e2) {
        setError('Token scaduto. Disconnetti e riconnetti Strava.');
        setSyncStatus('error');
      }
    }
  };

  /* ── Gestione callback OAuth ── */
  useEffect(() => {
    if (exchanged.current) return;
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const err    = params.get('error');
    window.history.replaceState({}, '', window.location.pathname);

    if (err) { setError('Autorizzazione negata da Strava.'); return; }
    if (!code) return;
    exchanged.current = true;

    setSyncStatus('syncing');
    exchangeCode(code)
      .then(data => {
        const newTokens = {
          access_token:  data.access_token,
          refresh_token: data.refresh_token,
          expires_at:    data.expires_at,
        };
        saveTokens(newTokens);
        return loadActivities(data.access_token);
      })
      .then(list => {
        saveActivities(list);
        const now = Date.now();
        lastAutoSync = now;
        setLastSyncAt(now);
        setSyncStatus('done');
      })
      .catch(e => { setError(e.message); setSyncStatus('error'); });
  }, []);

  /* ── Auto-sync al mount se già connesso e cooldown scaduto ── */
  useEffect(() => {
    if (!tokens) return;
    const elapsed = Date.now() - lastAutoSync;
    if (elapsed < AUTO_SYNC_COOLDOWN_MS) return;
    sync(tokens);
  }, [!!tokens]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Non configurato ── */
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return (
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-magenta)', margin: 0 }}>
        Variabili VITE_STRAVA_CLIENT_ID / VITE_STRAVA_CLIENT_SECRET mancanti nel .env
      </p>
    );
  }

  /* ── Non connesso ── */
  if (!tokens) {
    const connectUrl = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/corpo-mente')}&response_type=code&scope=activity:read_all&approval_prompt=auto`;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <a href={connectUrl} className="cm-btn" style={{ fontSize: 12, padding: '7px 14px' }}>
          Connetti Strava
        </a>
        {error && (
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-magenta)' }}>{error}</span>
        )}
      </div>
    );
  }

  /* ── Connesso ── */
  const syncLabel = {
    idle:       lastSyncAt ? `Sincronizzato ${new Date(lastSyncAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` : 'Connesso',
    syncing:    'Sincronizzazione…',
    refreshing: 'Aggiornamento token Strava…',
    done:       `Sincronizzato ${new Date(lastSyncAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`,
    error:      `Errore: ${error}`,
  }[syncStatus];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span style={{
        fontFamily: 'var(--font-ui)', fontSize: 12,
        color: syncStatus === 'error' ? 'var(--color-magenta)' : 'var(--color-ink-muted)',
      }}>
        {syncLabel}
      </span>
      <button
        onClick={() => sync(tokens)}
        disabled={syncStatus === 'syncing' || syncStatus === 'refreshing'}
        style={{
          fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
          background: 'none', border: '1px solid var(--color-line)',
          borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
          color: 'var(--color-ink-muted)',
        }}
      >
        {syncStatus === 'syncing' || syncStatus === 'refreshing' ? '…' : '↻ Aggiorna'}
      </button>
      <button
        onClick={() => { removeFirebaseData(TOKEN_KEY); removeFirebaseData(ACTIVITIES_KEY); saveTokens(null); }}
        style={{
          fontFamily: 'var(--font-ui)', fontSize: 11,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-ink-muted)', textDecoration: 'underline', padding: 0,
        }}
      >
        Disconnetti
      </button>
    </div>
  );
}
