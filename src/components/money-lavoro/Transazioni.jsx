import { useState, useRef, useMemo } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';
import BentoCard     from '../primitives/BentoCard';
import DomainEyebrow from '../primitives/DomainEyebrow';
import MiniStatRow   from '../primitives/MiniStatRow';
import ChipTag       from '../primitives/ChipTag';
import EmptyState    from '../primitives/EmptyState';
import DetailDrawer  from '../primitives/DetailDrawer';

const KEY        = 'ml_transazioni';
const GOAL_KEY   = 'ml_entrate_goal';
const GOAL_START = 1500;
const ACCENT     = '#C4873D';

const CATEGORIE = [
  'House_Expenses', 'Bills', 'Food', 'Extra_Food', 'Extra_Drink',
  'Trips', 'Knowledge', 'Wealth', 'Freelance', 'Comunit', 'Investimenti',
];

const CONTI = ['BBVA', 'Unicredit', 'CC'];

const CAT_TONE = {
  Freelance: 'success', Wealth: 'teal', Investimenti: 'teal',
  Knowledge: 'teal', Trips: 'warning', Extra_Drink: 'warning',
  Extra_Food: 'neutral', Food: 'neutral', Bills: 'neutral',
  House_Expenses: 'neutral', Comunit: 'neutral',
};

const eur      = n => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(Math.abs(Number(n) || 0));
const todayStr = () => new Date().toISOString().split('T')[0];
const thisM    = () => todayStr().slice(0, 7);

function addMonths(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
}

function parseDate(s) {
  s = (s || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (!m) return null;
  const yr = m[3].length === 2 ? '20' + m[3] : m[3];
  return `${yr}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

const DEFAULT_GOAL = { val: GOAL_START, history: [] };
const EMPTY = {
  date: todayStr(), descrizione: '', importo: '', tipo: 'uscita',
  paid: false, categoria: 'Food', conto: 'BBVA', note: '',
};

const ListIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

export default function Transazioni() {
  const [entries, setEntries] = useFirebaseState(KEY, []);
  const [goal,    setGoal]    = useFirebaseState(GOAL_KEY, DEFAULT_GOAL);
  const [open, setOpen] = useState(false);

  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState({ ...EMPTY });
  const [filterMonth, setFilterMonth] = useState(thisM());
  const [filterCat,   setFilterCat]   = useState('tutte');
  const [filterConto, setFilterConto] = useState('tutti');
  const [filterTipo,  setFilterTipo]  = useState('tutti');
  const csvRef = useRef();
  const setF   = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const persist = next => setEntries(next);

  const save = () => {
    if (!form.descrizione || !form.importo) return;
    const entry = { id: editId || Date.now(), ...form, importo: Math.abs(parseFloat(form.importo)) || 0 };
    const next  = editId ? entries.map(e => e.id === editId ? entry : e) : [entry, ...entries];
    persist(next);

    if (form.tipo === 'entrata') {
      const cm  = form.date.slice(0, 7);
      const tot = next.filter(e => e.tipo === 'entrata' && e.date.slice(0, 7) === cm).reduce((s, e) => s + e.importo, 0);
      if (cm === thisM() && tot >= goal.val && !goal.history.find(h => h.month === cm)) {
        setGoal({ val: Math.round(goal.val * 1.10), history: [...goal.history, { month: cm, target: goal.val, reached: tot }] });
      }
    }

    setForm({ ...EMPTY });
    setShowForm(false);
    setEditId(null);
  };

  const togglePaid = (id, ev) => {
    ev.stopPropagation();
    persist(entries.map(e => e.id === id ? { ...e, paid: !e.paid } : e));
  };

  const remove = (id, ev) => {
    ev.stopPropagation();
    persist(entries.filter(e => e.id !== id));
  };

  const openEdit = e => {
    setForm({ date: e.date, descrizione: e.descrizione, importo: e.importo, tipo: e.tipo, paid: e.paid, categoria: e.categoria, conto: e.conto, note: e.note || '' });
    setEditId(e.id);
    setShowForm(true);
  };

  const importCSV = ev => {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text  = e.target.result.trim();
      const sep   = (text.match(/;/g) || []).length > (text.match(/,/g) || []).length ? ';' : ',';
      const lines = text.split(/\r?\n/);
      const imported = [];
      lines.forEach((line, idx) => {
        const cols = line.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
        let date = null, desc = '', rawAmt = '';
        for (let j = 0; j < cols.length; j++) {
          const d = parseDate(cols[j]);
          if (d) { date = d; desc = cols[j + 1] || ''; rawAmt = cols[j + 2] || cols[j + 1] || ''; break; }
        }
        if (!date && idx === 0) return;
        if (!date) return;
        const amt = parseFloat(rawAmt.replace(',', '.').replace(/[^\d.\-]/g, ''));
        if (isNaN(amt)) return;
        imported.push({ id: Date.now() + Math.random(), date, descrizione: desc, importo: Math.abs(amt), tipo: amt >= 0 ? 'entrata' : 'uscita', paid: true, categoria: 'Food', conto: 'BBVA', note: '' });
      });
      persist([...imported, ...entries]);
    };
    reader.readAsText(file, 'UTF-8');
    ev.target.value = '';
  };

  const filtered = useMemo(() =>
    entries
      .filter(e =>
        e.date.slice(0, 7) === filterMonth &&
        (filterCat   === 'tutte' || e.categoria === filterCat) &&
        (filterConto === 'tutti' || e.conto     === filterConto) &&
        (filterTipo  === 'tutti' || e.tipo      === filterTipo)
      )
      .sort((a, b) => b.date.localeCompare(a.date)),
    [entries, filterMonth, filterCat, filterConto, filterTipo]
  );

  const totEntrate = filtered.filter(e => e.tipo === 'entrata').reduce((s, e) => s + e.importo, 0);
  const totUscite  = filtered.filter(e => e.tipo === 'uscita').reduce((s, e) => s + e.importo, 0);
  const delta      = totEntrate - totUscite;

  const cmEntrate = entries.filter(e => e.tipo === 'entrata' && e.date.slice(0, 7) === thisM()).reduce((s, e) => s + e.importo, 0);
  const goalPct   = Math.min(100, goal.val > 0 ? (cmEntrate / goal.val) * 100 : 0);

  const goalTone  = goalPct >= 100 ? 'success' : goalPct >= 75 ? 'warning' : 'neutral';
  const goalLabel = goalPct >= 100 ? `✓ Obiettivo raggiunto` : `${goalPct.toFixed(0)}% del target`;

  const eyebrow = (
    <DomainEyebrow domain="money" label="Entrate & Uscite" icon={<ListIcon />} />
  );
  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Transazioni
    </button>
  );

  const cmUscite = entries.filter(e => e.tipo === 'uscita' && e.date.slice(0, 7) === thisM()).reduce((s, e) => s + e.importo, 0);
  const cmDelta  = cmEntrate - cmUscite;

  const headerStats = [
    { label: 'Entrate mese', value: eur(cmEntrate) },
    { label: 'Uscite mese',  value: eur(cmUscite)  },
    { label: 'Delta',        value: (cmDelta >= 0 ? '+' : '−') + eur(cmDelta) },
    { label: 'Obiettivo',    value: eur(goal.val)  },
  ];

  return (
    <>
      <BentoCard eyebrow={eyebrow} action={action} className="mod-card" onClick={() => setOpen(true)}>
        <div className="mod-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, color: 'var(--color-ink)' }}>
                  {eur(cmEntrate)}
                </span>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)' }}>entrate</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <ChipTag tone={goalTone}>{goalLabel}</ChipTag>
              </div>
            </div>
            <MiniStatRow stats={[
              { label: 'Uscite',     value: eur(cmUscite) },
              { label: 'Delta',      value: (cmDelta >= 0 ? '+' : '−') + eur(Math.abs(cmDelta)) },
              { label: 'Obiettivo',  value: eur(goal.val) },
            ]} />
          </div>
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => { setOpen(false); setShowForm(false); setEditId(null); }}
        eyebrow="Money & Lavoro"
        title="Entrate & Uscite"
        headerStats={headerStats}
        primaryAction={{ label: '+ Aggiungi', onClick: () => { setShowForm(v => !v); setEditId(null); setForm({ ...EMPTY }); } }}
        accentColor={ACCENT}
      >
        <div className="dr-content">

          {/* ── Filtri ── */}
          <section className="dr-section">
            <div className="ml-filters">
              <div className="ml-month-nav">
                <button className="ml-month-btn" onClick={() => setFilterMonth(m => addMonths(m, -1))}>‹</button>
                <span className="ml-month-label">{monthLabel(filterMonth)}</span>
                <button className="ml-month-btn" onClick={() => setFilterMonth(m => addMonths(m, +1))}>›</button>
              </div>
              <select className="cm-input ml-filter-sel" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="tutte">Tutte le categorie</option>
                {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="cm-input ml-filter-sel" value={filterConto} onChange={e => setFilterConto(e.target.value)}>
                <option value="tutti">Tutti i conti</option>
                {CONTI.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="cm-input ml-filter-sel" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
                <option value="tutti">Entrate + Uscite</option>
                <option value="entrata">Solo Entrate</option>
                <option value="uscita">Solo Uscite</option>
              </select>
            </div>
          </section>

          {/* ── Form aggiungi / modifica ── */}
          {showForm && (
            <section className="dr-section">
              <h3 className="dr-section-title">{editId ? 'Modifica transazione' : 'Nuova transazione'}</h3>
              <div className="ml-tipo-toggle" style={{ marginBottom: 12 }}>
                <button className={`ml-tipo-btn${form.tipo === 'entrata' ? ' tipo-pos' : ''}`} onClick={() => setF('tipo', 'entrata')}>+ Entrata</button>
                <button className={`ml-tipo-btn${form.tipo === 'uscita'  ? ' tipo-neg' : ''}`} onClick={() => setF('tipo', 'uscita')}>− Uscita</button>
              </div>
              <div className="ml-form-grid">
                <div className="cm-form-group">
                  <label className="cm-label">Data</label>
                  <input type="date" className="cm-input" value={form.date} onChange={e => setF('date', e.target.value)} />
                </div>
                <div className="cm-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="cm-label">Descrizione</label>
                  <input type="text" className="cm-input" value={form.descrizione} onChange={e => setF('descrizione', e.target.value)} />
                </div>
                <div className="cm-form-group">
                  <label className="cm-label">Importo €</label>
                  <input type="number" className="cm-input" value={form.importo} onChange={e => setF('importo', e.target.value)} min="0" step="0.01" />
                </div>
                <div className="cm-form-group">
                  <label className="cm-label">Categoria</label>
                  <select className="cm-input" value={form.categoria} onChange={e => setF('categoria', e.target.value)}>
                    {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="cm-form-group">
                  <label className="cm-label">Conto</label>
                  <select className="cm-input" value={form.conto} onChange={e => setF('conto', e.target.value)}>
                    {CONTI.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="cm-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="cm-label">Note</label>
                  <input type="text" className="cm-input" value={form.note} onChange={e => setF('note', e.target.value)} placeholder="Opzionale" />
                </div>
                <div className="cm-form-group">
                  <label className="cm-label">Pagato</label>
                  <label className="ml-paid-label">
                    <input type="checkbox" checked={form.paid} onChange={e => setF('paid', e.target.checked)} />
                    <span className={`ml-paid${form.paid ? ' paid' : ''}`}>{form.paid ? '✓' : '○'}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>{form.paid ? 'Sì' : 'No'}</span>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="cm-btn" onClick={save}>{editId ? 'Aggiorna' : 'Salva'}</button>
                <button className="cm-btn cm-btn-ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Annulla</button>
              </div>
            </section>
          )}

          {/* ── Lista transazioni ── */}
          <section className="dr-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="dr-section-title" style={{ margin: 0 }}>
                {monthLabel(filterMonth)} — {filtered.length} voci
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <input ref={csvRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={importCSV} />
                <button className="cm-btn cm-btn-ghost" style={{ fontSize: 11 }} onClick={() => csvRef.current.click()}>Import CSV</button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                illustration="📊"
                title={`Nessuna transazione`}
                description={`Nessuna voce per ${monthLabel(filterMonth)}`}
                cta="+ Aggiungi"
                onCta={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY }); }}
              />
            ) : (
              <>
                <div className="ml-trans-wrap">
                  <table className="ml-trans-table">
                    <thead>
                      <tr>
                        <th>Descrizione</th>
                        <th className="ml-th-r">Importo</th>
                        <th className="ml-th-c">Paid</th>
                        <th>Categoria</th>
                        <th>Data</th>
                        <th>Conto</th>
                        <th>Note</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(e => (
                        <tr
                          key={e.id}
                          className={`ml-tr ${e.tipo === 'entrata' ? 'ml-tr-e' : 'ml-tr-u'}`}
                          onClick={() => openEdit(e)}
                        >
                          <td><strong>{e.descrizione || '—'}</strong></td>
                          <td className={`ml-td-amt ${e.tipo === 'entrata' ? 'ml-pos' : 'ml-neg'}`}>
                            {e.tipo === 'entrata' ? '+' : '−'}{eur(e.importo)}
                          </td>
                          <td className="ml-td-c" onClick={ev => togglePaid(e.id, ev)}>
                            <span className={`ml-paid${e.paid ? ' paid' : ''}`}>{e.paid ? '✓' : '○'}</span>
                          </td>
                          <td>
                            <ChipTag tone={CAT_TONE[e.categoria] || 'neutral'}>{e.categoria}</ChipTag>
                          </td>
                          <td className="ml-td-date">{e.date.slice(5)}</td>
                          <td><span className={`ml-conto ml-conto-${e.conto.toLowerCase()}`}>{e.conto}</span></td>
                          <td className="ml-td-note">{e.note || <span style={{ color: 'var(--color-ink-muted)', opacity: 0.5 }}>—</span>}</td>
                          <td><button className="cm-icon-btn" onClick={ev => remove(e.id, ev)}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="ml-totals" style={{ marginTop: 16 }}>
                  <div className="ml-total-cell">
                    <span className="ml-total-lbl">TOT Uscite</span>
                    <span className="ml-total-val ml-neg">−{eur(totUscite)}</span>
                  </div>
                  <div className="ml-total-div" />
                  <div className="ml-total-cell">
                    <span className="ml-total-lbl">TOT Entrate</span>
                    <span className="ml-total-val ml-pos">+{eur(totEntrate)}</span>
                  </div>
                  <div className="ml-total-div" />
                  <div className="ml-total-cell">
                    <span className="ml-total-lbl">Delta</span>
                    <span className={`ml-total-val ml-total-delta ${delta >= 0 ? 'ml-pos' : 'ml-neg'}`}>
                      {delta >= 0 ? '+' : '−'}{eur(Math.abs(delta))}
                    </span>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* ── Goal entrate ── */}
          <section className="dr-section">
            <h3 className="dr-section-title">Obiettivo entrate mensile</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1, color: 'var(--color-ink)' }}>
                {eur(cmEntrate)}
              </span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)' }}>
                su {eur(goal.val)} obiettivo
              </span>
            </div>
            <div className="ml-goal-bar-bg">
              <div className="ml-goal-bar-fill" style={{ width: `${goalPct}%` }} />
            </div>
            <div className="ml-goal-note" style={{ marginTop: 8 }}>
              {goalPct >= 100
                ? `✓ Obiettivo raggiunto — prossimo: ${eur(Math.round(goal.val * 1.10))}`
                : `${eur(goal.val - cmEntrate)} al traguardo · ${goalPct.toFixed(0)}%`}
            </div>
          </section>

        </div>
      </DetailDrawer>
    </>
  );
}
