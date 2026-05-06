import { useState } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import { computeBookDebt } from '../utils/bookDebt';
import { getMondayStr } from '../../../utils/weekRange';
import BookTracker from '../../../components/corpo-mente/BookTracker';
import './drawers.css';

export default function BooksDrawer() {
  const [books]       = useFirebaseState('sv_books_v2',         []);
  const [weeklyTarget]= useFirebaseState('sv_book_weekly_target', 1);
  const [systemStart, setSystemStart] = useFirebaseState('sv_book_system_start', null);
  const [confirm, setConfirm] = useState(false);

  const debt = systemStart
    ? computeBookDebt(books, {
        weeklyTarget,
        systemStartWeek: new Date(systemStart + 'T00:00:00'),
      })
    : null;

  function resetDebt() {
    setSystemStart(getMondayStr(0));
    setConfirm(false);
  }

  return (
    <div className="dr-content">
      <section className="dr-section">
        <BookTracker />
      </section>

      {/* ── Impostazioni debito ── */}
      <section className="dr-section" style={{ borderTop: '1px solid var(--color-line)', paddingTop: 16 }}>
        <h3 className="dr-section-title" style={{ color: 'var(--color-ink-muted)' }}>Impostazioni lettura</h3>

        {!confirm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', margin: 0, lineHeight: 1.6 }}>
              {debt && debt.carriedDebt > 0
                ? `Debito attuale: ${debt.carriedDebt} libr${debt.carriedDebt === 1 ? 'o' : 'i'} da recuperare dalla settimana del ${debt.oldestPendingWeekLabel}.`
                : 'Nessun debito accumulato. Il conteggio è in pari.'
              }
            </p>
            {systemStart && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', margin: 0 }}>
                Tracking attivo dal {new Date(systemStart + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </p>
            )}
            <button
              onClick={() => setConfirm(true)}
              style={{
                alignSelf: 'flex-start',
                fontFamily: 'var(--font-ui)', fontSize: 11,
                color: 'var(--color-ink-muted)',
                background: 'none', border: '1px solid var(--color-line)',
                borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
              }}
            >
              Azzera debito
            </button>
          </div>
        ) : (
          <div style={{
            background: 'rgba(31,24,18,0.04)', borderRadius: 10,
            padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink)', margin: 0, lineHeight: 1.6 }}>
              Vuoi azzerare il debito accumulato
              {debt && debt.carriedDebt > 0 ? ` di ${debt.carriedDebt} libr${debt.carriedDebt === 1 ? 'o' : 'i'}` : ''}?
              {' '}La cronologia delle letture resta invariata, ma il counter riparte da questa settimana.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={resetDebt}
                style={{
                  fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
                  color: 'var(--color-ink)', background: 'var(--color-surface)',
                  border: '1px solid var(--color-line)', borderRadius: 6,
                  padding: '7px 14px', cursor: 'pointer',
                }}
              >
                Conferma azzeramento
              </button>
              <button
                onClick={() => setConfirm(false)}
                style={{
                  fontFamily: 'var(--font-ui)', fontSize: 12,
                  color: 'var(--color-ink-muted)', background: 'none',
                  border: 'none', cursor: 'pointer',
                }}
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
