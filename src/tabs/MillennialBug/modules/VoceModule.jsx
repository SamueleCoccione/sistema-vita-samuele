import { useState, useMemo } from 'react';
import { useFirebaseState }   from '../../../hooks/useFirebaseState';
import BentoCard              from '../../../components/primitives/BentoCard';
import DetailDrawer           from '../../../components/primitives/DetailDrawer';
import ApprendimentiDrawer    from '../drawers/ApprendimentiDrawer';
import './modules.css';

const MB_ACCENT = '#5C50CC';

function getWeekStr(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day  = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const y     = date.getUTCFullYear();
  const start = new Date(Date.UTC(y, 0, 1));
  const wk    = Math.ceil((((date - start) / 86400000) + 1) / 7);
  return `${y}-W${String(wk).padStart(2, '0')}`;
}

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

export default function VoceModule() {
  const [apprendim] = useFirebaseState('pd_apprendimenti_voce',  []);
  const [radici]    = useFirebaseState('pd_radici_settimanali',  []);
  const [open, setOpen] = useState(false);

  const app_arr = Array.isArray(apprendim) ? apprendim : [];
  const rad_arr = Array.isArray(radici)    ? radici    : [];

  const { radice, lastApp } = useMemo(() => {
    const thisWeek = getWeekStr();
    const radice   = rad_arr.find(r => r.settimana === thisWeek) || null;
    const lastApp  = app_arr.length ? app_arr[0] : null;
    return { radice, lastApp };
  }, [app_arr, rad_arr]);

  const eyebrow = (
    <div className="mb-mod-eyebrow">
      <span className="mb-mod-eyebrow-dot" />
      <span className="mb-mod-eyebrow-label">Voce 🎙️</span>
    </div>
  );

  const action = (
    <button className="mb-mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Apprendimenti
    </button>
  );

  return (
    <>
      <BentoCard
        eyebrow={eyebrow}
        action={action}
        className="mb-mod-card"
        onClick={() => setOpen(true)}
      >
        <div className="mb-mod-body">
          {/* Radice della settimana */}
          <div style={{ marginBottom: 14, flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
              marginBottom: 6,
            }}>
              Radice della settimana
            </div>

            {radice ? (
              <p style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--color-ink)',
                margin: 0,
                lineHeight: 1.55,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {radice.cosa_non_strumentale}
              </p>
            ) : (
              <p style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                color: 'var(--color-ink-muted)',
                fontStyle: 'italic',
                margin: 0,
                lineHeight: 1.55,
              }}>
                Cosa hai fatto questa settimana solo perché ti piaceva?
              </p>
            )}
          </div>

          {/* Ultimo apprendimento */}
          <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: 10 }}>
            <div style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
              marginBottom: 6,
            }}>
              Ultimo apprendimento voce
            </div>

            {lastApp ? (
              <>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-ink-muted)',
                  marginBottom: 3,
                }}>
                  {fmtDate(lastApp.date)}
                </div>
                <p style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 12,
                  color: 'var(--color-ink)',
                  margin: 0,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {lastApp.cosa_sto_imparando_a_dire}
                </p>
              </>
            ) : (
              <span style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                color: 'var(--color-ink-muted)',
                fontStyle: 'italic',
              }}>
                Nessun apprendimento ancora.
              </span>
            )}
          </div>
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow="Millennial Bug"
        title="Apprendimenti Voce"
        headerStats={[
          { label: 'Apprendimenti', value: app_arr.length },
          { label: 'Radici',        value: rad_arr.length },
        ]}
        accentColor={MB_ACCENT}
      >
        <ApprendimentiDrawer />
      </DetailDrawer>
    </>
  );
}
