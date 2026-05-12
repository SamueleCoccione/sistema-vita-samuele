import { useState } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import './drawers.css';

const TOTAL_STEPS = 8;

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 86400000);
}

function ProgressBar({ step }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < step ? 'var(--mb-accent)' : 'var(--color-line)',
            transition: 'background 300ms',
          }}
        />
      ))}
    </div>
  );
}

export default function CheckCicloDrawer() {
  const [checks,       saveChecks]      = useFirebaseState('pd_check_ciclo', []);
  const [metriche,     saveMetriche]    = useFirebaseState('pd_metriche_risultato', []);
  const [journal,      saveJournal]     = useFirebaseState('pd_journal_progetto', []);
  const [pubblicazioni]                  = useFirebaseState('pd_pubblicazioni', []);

  const [step,          setStep]          = useState(0); // 0 = overview
  const [antiProceed,   setAntiProceed]   = useState(false);
  const [form, setForm] = useState({
    cosa_e_andato_bene: '',
    cosa_non_ha_funzionato: '',
    tono_sostenibile: null,
    compassione_note: '',
    decisioni_prossimo_ciclo: '',
    subscriber_totali: '',
    delta_subscriber: '',
    open_rate_medio: '',
    note_qualitative: '',
    pezzi_da_non_riscrivere_uguale: [],
    journal_entry: '',
  });

  const checks_arr  = Array.isArray(checks)  ? checks  : [];
  const metr_arr    = Array.isArray(metriche) ? metriche : [];
  const pub_arr     = Array.isArray(pubblicazioni) ? pubblicazioni : [];
  const journal_arr = Array.isArray(journal)  ? journal  : [];

  const lastCheck = checks_arr[0] ?? null;
  const daysSinceCheck = lastCheck ? daysSince(lastCheck.data) : 999;
  const canStart = daysSinceCheck >= 25;

  const set = (k) => (val) => setForm(f => ({ ...f, [k]: val }));

  const finish = () => {
    const today   = new Date().toISOString().split('T')[0];
    const metricaId = Date.now();

    const metrica = {
      id: metricaId,
      data_check: today,
      subscriber_totali: Number(form.subscriber_totali) || 0,
      delta_subscriber:  Number(form.delta_subscriber)  || 0,
      pezzi_pubblicati_ciclo: lastCheck
        ? pub_arr.filter(p => p.date >= lastCheck.data && p.date <= today).length
        : pub_arr.length,
      open_rate_medio: Number(form.open_rate_medio) || 0,
      note_qualitative: form.note_qualitative,
    };

    const check = {
      id: Date.now() + 1,
      data: today,
      cosa_e_andato_bene: form.cosa_e_andato_bene,
      cosa_non_ha_funzionato: form.cosa_non_ha_funzionato,
      compassione_check: {
        tono_sostenibile: form.tono_sostenibile === true,
        note: form.compassione_note,
      },
      decisioni_prossimo_ciclo: form.decisioni_prossimo_ciclo,
      metriche_risultato_id: String(metricaId),
      pezzi_da_non_riscrivere_uguale: form.pezzi_da_non_riscrivere_uguale,
    };

    const journalEntry = {
      id: Date.now() + 2,
      date: today,
      text: form.journal_entry,
      tags: ['ciclo'],
    };

    saveMetriche([metrica, ...metr_arr]);
    saveChecks([check, ...checks_arr]);
    if (form.journal_entry.trim()) saveJournal([journalEntry, ...journal_arr]);

    setStep(0);
    setAntiProceed(false);
    setForm({
      cosa_e_andato_bene: '', cosa_non_ha_funzionato: '', tono_sostenibile: null,
      compassione_note: '', decisioni_prossimo_ciclo: '',
      subscriber_totali: '', delta_subscriber: '', open_rate_medio: '', note_qualitative: '',
      pezzi_da_non_riscrivere_uguale: [], journal_entry: '',
    });
  };

  // ── Overview ────────────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="mb-dr-content">
        <div className="mb-dr-section">
          <span className="mb-section-label">Check di ciclo</span>

          {lastCheck ? (
            <div className="mb-check-summary">
              <div className="mb-check-summary-date">Ultimo check — {fmtDate(lastCheck.data)}</div>
              {lastCheck.cosa_e_andato_bene && (
                <div className="mb-check-summary-field">
                  <div className="mb-check-summary-field-label">Cosa è andato bene</div>
                  <div className="mb-check-summary-field-text">{lastCheck.cosa_e_andato_bene}</div>
                </div>
              )}
              {lastCheck.cosa_non_ha_funzionato && (
                <div className="mb-check-summary-field">
                  <div className="mb-check-summary-field-label">Cosa non ha funzionato</div>
                  <div className="mb-check-summary-field-text">{lastCheck.cosa_non_ha_funzionato}</div>
                </div>
              )}
              {lastCheck.decisioni_prossimo_ciclo && (
                <div className="mb-check-summary-field">
                  <div className="mb-check-summary-field-label">Decisioni operative</div>
                  <div className="mb-check-summary-field-text">{lastCheck.decisioni_prossimo_ciclo}</div>
                </div>
              )}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8, height: 8, borderRadius: '50%',
                    background: lastCheck.compassione_check?.tono_sostenibile
                      ? 'var(--color-success)'
                      : 'var(--color-magenta)',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)' }}>
                  Tono {lastCheck.compassione_check?.tono_sostenibile ? 'sostenibile' : 'da monitorare'}
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-empty">Nessun check di ciclo ancora.</div>
          )}

          <div style={{ marginTop: 16 }}>
            {canStart ? (
              <button className="mb-btn" onClick={() => setStep(1)}>
                Avvia nuovo check di ciclo
              </button>
            ) : (
              <div
                style={{
                  fontFamily: 'var(--font-ui)', fontSize: 13,
                  color: 'var(--color-ink-muted)', fontStyle: 'italic',
                }}
              >
                Prossimo check disponibile tra {25 - daysSinceCheck} giorni.
              </div>
            )}
          </div>
        </div>

        {checks_arr.length > 1 && (
          <div className="mb-dr-section">
            <span className="mb-section-label">Storico check</span>
            <div className="mb-list">
              {checks_arr.slice(1).map(c => (
                <div key={c.id} className="mb-list-item" style={{ opacity: 0.75 }}>
                  <div className="mb-list-item-body">
                    <div className="mb-list-item-meta">{fmtDate(c.data)}</div>
                    <div className="mb-list-item-title" style={{ fontSize: 13 }}>
                      {c.cosa_e_andato_bene?.slice(0, 80) || '—'}
                      {c.cosa_e_andato_bene?.length > 80 ? '…' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Step flow ────────────────────────────────────────────────────────────────
  return (
    <div className="mb-dr-content">
      <div className="mb-dr-section">
        <ProgressBar step={step} />

        {step === 1 && (
          <>
            <div className="mb-step-header">
              <span className="mb-step-num">1</span>
              <span className="mb-step-title">Cosa è andato bene in questo ciclo?</span>
            </div>
            <textarea
              className="mb-textarea"
              placeholder="Pezzi pubblicati, momenti di flusso, cose di cui sei fiero..."
              rows={6}
              value={form.cosa_e_andato_bene}
              onChange={e => set('cosa_e_andato_bene')(e.target.value)}
            />
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-step-header">
              <span className="mb-step-num">2</span>
              <span className="mb-step-title">Cosa non ha funzionato?</span>
            </div>
            <textarea
              className="mb-textarea"
              placeholder="Resistenze, blocchi, cose che hai evitato, settimane difficili..."
              rows={6}
              value={form.cosa_non_ha_funzionato}
              onChange={e => set('cosa_non_ha_funzionato')(e.target.value)}
            />
          </>
        )}

        {step === 3 && (
          <>
            <div className="mb-step-header">
              <span className="mb-step-num">3</span>
              <span className="mb-step-title">Compassione check</span>
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, lineHeight: 1.7, color: 'var(--color-ink)', margin: '0 0 24px' }}>
              "Il tono con cui mi sono parlato di questo progetto è quello che userei con un amico che fa la stessa cosa?"
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {[true, false].map(v => (
                <button
                  key={String(v)}
                  className="mb-btn mb-btn-small"
                  style={form.tono_sostenibile === v
                    ? { background: 'var(--mb-accent)', color: '#fff' }
                    : { background: 'var(--mb-accent-soft)', color: 'var(--mb-accent)', border: '1px solid var(--mb-accent-muted)' }
                  }
                  onClick={() => set('tono_sostenibile')(v)}
                >
                  {v ? 'Sì, sostanzialmente' : 'No, sono stato duro'}
                </button>
              ))}
            </div>
            <textarea
              className="mb-textarea"
              placeholder="Note (opzionale) — cosa noti nel tono che usi con te stesso?"
              rows={4}
              value={form.compassione_note}
              onChange={e => set('compassione_note')(e.target.value)}
            />
          </>
        )}

        {step === 4 && (
          <>
            <div className="mb-step-header">
              <span className="mb-step-num">4</span>
              <span className="mb-step-title">Decisioni operative per il prossimo ciclo</span>
            </div>
            <textarea
              className="mb-textarea"
              placeholder="Cosa cambi? Cosa mantieni? Una o due cose concrete."
              rows={6}
              value={form.decisioni_prossimo_ciclo}
              onChange={e => set('decisioni_prossimo_ciclo')(e.target.value)}
            />
          </>
        )}

        {step === 5 && (
          <div className="mb-antirecidiva">
            <div className="mb-step-header" style={{ justifyContent: 'center' }}>
              <span className="mb-step-num">5</span>
            </div>
            <p>
              Stai per vedere i numeri di Substack.
              <br /><br />
              Hai detto a te stesso che questi numeri non definiscono il successo del progetto.
              <br /><br />
              Quando li avrai visti, qualunque essi siano, scriverai una riga nel journal su come ti senti, prima di uscire da questa sezione.
            </p>
            {!antiProceed ? (
              <button className="mb-btn" onClick={() => setAntiProceed(true)}>
                Ho letto e voglio procedere
              </button>
            ) : (
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-success)', margin: 0 }}>
                ✓ Continua con il passaggio successivo.
              </p>
            )}
          </div>
        )}

        {step === 6 && (
          <>
            <div className="mb-step-header">
              <span className="mb-step-num">6</span>
              <span className="mb-step-title">Metriche di risultato (inserimento manuale)</span>
            </div>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', margin: '0 0 16px', fontStyle: 'italic' }}>
              Apri Substack da desktop. Questi numeri vivono solo qui, una volta al ciclo.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['subscriber_totali', 'Subscriber totali', 'number'],
                ['delta_subscriber',  'Nuovi subscriber questo ciclo', 'number'],
                ['open_rate_medio',   'Open rate medio (%)', 'number'],
              ].map(([k, label, type]) => (
                <div key={k} className="mb-form-field">
                  <label className="mb-form-label">{label}</label>
                  <input
                    type={type}
                    className="mb-input"
                    value={form[k]}
                    onChange={e => set(k)(e.target.value)}
                    placeholder="0"
                  />
                </div>
              ))}
              <div className="mb-form-field">
                <label className="mb-form-label">Note qualitative</label>
                <textarea
                  className="mb-textarea"
                  rows={3}
                  placeholder="Cosa noti, al di là dei numeri?"
                  value={form.note_qualitative}
                  onChange={e => set('note_qualitative')(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {step === 7 && (
          <>
            <div className="mb-step-header">
              <span className="mb-step-num">7</span>
              <span className="mb-step-title">Pezzi da non riscrivere uguale (opzionale)</span>
            </div>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)', margin: '0 0 16px', lineHeight: 1.6 }}>
              Quali pezzi pubblicati in questo ciclo non rifarebbero nello stesso modo?
            </p>
            {pub_arr
              .filter(p => {
                if (!lastCheck) return true;
                return p.date >= lastCheck.data;
              })
              .map(p => {
                const selected = form.pezzi_da_non_riscrivere_uguale.find(x => x.pubblicazione_id === String(p.id));
                return (
                  <div key={p.id} style={{ marginBottom: 10 }}>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={e => {
                          if (e.target.checked) {
                            set('pezzi_da_non_riscrivere_uguale')([
                              ...form.pezzi_da_non_riscrivere_uguale,
                              { pubblicazione_id: String(p.id), perche: '' },
                            ]);
                          } else {
                            set('pezzi_da_non_riscrivere_uguale')(
                              form.pezzi_da_non_riscrivere_uguale.filter(x => x.pubblicazione_id !== String(p.id))
                            );
                          }
                        }}
                      />
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink)' }}>
                        {p.titolo}
                      </span>
                    </label>
                    {selected && (
                      <input
                        className="mb-input"
                        style={{ marginTop: 6, marginLeft: 24 }}
                        placeholder="Perché?"
                        value={selected.perche}
                        onChange={e => {
                          set('pezzi_da_non_riscrivere_uguale')(
                            form.pezzi_da_non_riscrivere_uguale.map(x =>
                              x.pubblicazione_id === String(p.id) ? { ...x, perche: e.target.value } : x
                            )
                          );
                        }}
                      />
                    )}
                  </div>
                );
              })}
          </>
        )}

        {step === 8 && (
          <>
            <div className="mb-step-header">
              <span className="mb-step-num">8</span>
              <span className="mb-step-title">Una riga nel journal — obbligatoria</span>
            </div>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)', margin: '0 0 16px', lineHeight: 1.6, fontStyle: 'italic' }}>
              Hai appena visto i numeri. Come ti senti? Un'osservazione onesta, anche breve.
            </p>
            <textarea
              className="mb-textarea"
              placeholder="Come mi sento adesso?"
              rows={5}
              value={form.journal_entry}
              onChange={e => set('journal_entry')(e.target.value)}
            />
          </>
        )}

        <div className="mb-step-nav">
          <button
            className="mb-btn mb-btn-ghost mb-btn-small"
            onClick={() => { if (step === 1) setStep(0); else setStep(s => s - 1); }}
          >
            {step === 1 ? 'Annulla' : '← Indietro'}
          </button>

          {step < TOTAL_STEPS ? (
            <button
              className="mb-btn mb-btn-small"
              disabled={step === 5 && !antiProceed}
              onClick={() => setStep(s => s + 1)}
            >
              Avanti →
            </button>
          ) : (
            <button
              className="mb-btn mb-btn-small"
              disabled={!form.journal_entry.trim()}
              onClick={finish}
            >
              Completa check
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
