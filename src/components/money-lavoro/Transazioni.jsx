import { useState, useRef, useMemo } from 'react';

const KEY        = 'ml_transazioni';
const GOAL_KEY   = 'ml_entrate_goal';
const GOAL_START = 1500;

const CATEGORIE = [
  'House_Expenses', 'Bills', 'Food', 'Extra_Food', 'Extra_Drink',
  'Trips', 'Knowledge', 'Wealth', 'Freelance', 'Comunit', 'Investimenti',
];

const CONTI = ['BBVA', 'Unicredit', 'CC'];

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

function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
function loadGoal() { try { return JSON.parse(localStorage.getItem(GOAL_KEY) || 'null') || { val: GOAL_START, history: [] }; } catch { return { val: GOAL_START, history: [] }; } }

const EMPTY = {
  date: todayStr(), descrizione: '', importo: '', tipo: 'uscita',
  paid: false, categoria: 'Food', conto: 'BBVA', note: '',
};

export default function Transazioni() {
  const [entries,  setEntries]  = useState(load);
  const [goal,     setGoal]     = useState(loadGoal);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState({ ...EMPTY });

  const [filterMonth, setFilterMonth] = useState(thisM());
  const [filterCat,   setFilterCat]   = useState('tutte');
  const [filterConto, setFilterConto] = useState('tutti');
  const [filterTipo,  setFilterTipo]  = useState('tutti');

  const csvRef = useRef();
  const setF   = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const persist = next => {
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const save = () => {
    if (!form.descrizione || !form.importo) return;
    const entry = { id: editId || Date.now(), ...form, importo: Math.abs(parseFloat(form.importo)) || 0 };
    const next  = editId ? entries.map(e => e.id === editId ? entry : e) : [entry, ...entries];
    persist(next);

    // Adaptive goal: bump +10% when month target is reached
    if (form.tipo === 'entrata') {
      const cm  = form.date.slice(0, 7);
      const tot = next.filter(e => e.tipo === 'entrata' && e.date.slice(0, 7) === cm).reduce((s, e) => s + e.importo, 0);
      if (cm === thisM() && tot >= goal.val && !goal.history.find(h => h.month === cm)) {
        const ng = { val: Math.round(goal.val * 1.10), history: [...goal.history, { month: cm, target: goal.val, reached: tot }] };
        setGoal(ng);
        localStorage.setItem(GOAL_KEY, JSON.stringify(ng));
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

        if (!date && idx === 0) return; // skip header
        if (!date) return;

        const amt = parseFloat(rawAmt.replace(',', '.').replace(/[^\d.\-]/g, ''));
        if (isNaN(amt)) return;

        imported.push({
          id:          Date.now() + Math.random(),
          date,
          descrizione: desc,
          importo:     Math.abs(amt),
          tipo:        amt >= 0 ? 'entrata' : 'uscita',
          paid:        true,
          categoria:   'Food',
          conto:       'BBVA',
          note:        '',
        });
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
        (filterConto === 'tutti' || e.conto === filterConto) &&
        (filterTipo  === 'tutti' || e.tipo  === filterTipo)
      )
      .sort((a, b) => b.date.localeCompare(a.date)),
    [entries, filterMonth, filterCat, filterConto, filterTipo]
  );

  const totEntrate = filtered.filter(e => e.tipo === 'entrata').reduce((s, e) => s + e.importo, 0);
  const totUscite  = filtered.filter(e => e.tipo === 'uscita').reduce((s, e) => s + e.importo, 0);
  const delta      = totEntrate - totUscite;

  const cmEntrate = entries.filter(e => e.tipo === 'entrata' && e.date.slice(0, 7) === thisM()).reduce((s, e) => s + e.importo, 0);
  const goalPct   = Math.min(100, goal.val > 0 ? (cmEntrate / goal.val) * 100 : 0);

  return (
    <div>
      {/* Adaptive goal strip */}
      <div className="ml-stat-strip">
        <div>
          <div className="ml-stat-label">Entrate mese in corso</div>
          <div className="ml-stat-mid ml-pos-txt">{eur(cmEntrate)}</div>
        </div>
        <div>
          <div className="ml-stat-label">Obiettivo mensile</div>
          <div className="ml-stat-mid ml-lime">{eur(goal.val)}</div>
        </div>
      </div>
      <div className="ml-goal-wrap">
        <div className="ml-goal-bar-bg"><div className="ml-goal-bar-fill" style={{ width: `${goalPct}%` }} /></div>
        <div className="ml-goal-note">
          {goalPct >= 100
            ? `✓ Obiettivo raggiunto — prossimo target: ${eur(Math.round(goal.val * 1.10))}`
            : `${eur(goal.val - cmEntrate)} al traguardo · ${goalPct.toFixed(0)}%`}
        </div>
      </div>

      {/* Filters */}
      <div className="ml-filters">
        <div className="ml-month-nav">
          <button className="ml-month-btn" onClick={() => setFilterMonth(m => addMonths(m, -1))}>‹</button>
          <span className="ml-month-label">{monthLabel(filterMonth)}</span>
          <button className="ml-month-btn" onClick={() => setFilterMonth(m => addMonths(m, +1))}>›</button>
        </div>
        <select className="cm-input ml-filter-sel" value={filterCat}   onChange={e => setFilterCat(e.target.value)}>
          <option value="tutte">Tutte le categorie</option>
          {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="cm-input ml-filter-sel" value={filterConto} onChange={e => setFilterConto(e.target.value)}>
          <option value="tutti">Tutti i conti</option>
          {CONTI.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="cm-input ml-filter-sel" value={filterTipo}  onChange={e => setFilterTipo(e.target.value)}>
          <option value="tutti">Entrate + Uscite</option>
          <option value="entrata">Solo Entrate</option>
          <option value="uscita">Solo Uscite</option>
        </select>
      </div>

      {/* Action bar */}
      <div className="ml-tbl-header">
        <button className="cm-btn" onClick={() => { setShowForm(v => !v); setEditId(null); setForm({ ...EMPTY }); }}>
          {showForm && !editId ? 'Annulla' : '+ Aggiungi'}
        </button>
        <div>
          <input ref={csvRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={importCSV} />
          <button className="cm-btn cm-btn-ghost" onClick={() => csvRef.current.click()}>Import CSV</button>
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="ml-form-panel">
          <div className="ml-tipo-toggle">
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
                <input type="checkbox" className="ml-paid-check" checked={form.paid} onChange={e => setF('paid', e.target.checked)} />
                <span className={`ml-paid${form.paid ? ' paid' : ''}`}>{form.paid ? '✓' : '○'}</span>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{form.paid ? 'Sì' : 'No'}</span>
              </label>
            </div>
          </div>
          <button className="cm-btn" onClick={save}>{editId ? 'Aggiorna' : 'Salva'}</button>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="cm-empty">Nessuna transazione per {monthLabel(filterMonth)}</div>
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
                    <td><span className="ml-badge">{e.categoria}</span></td>
                    <td className="ml-td-date">{e.date.slice(5)}</td>
                    <td><span className={`ml-conto ml-conto-${e.conto.toLowerCase()}`}>{e.conto}</span></td>
                    <td className="ml-td-note">{e.note || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                    <td><button className="cm-icon-btn" onClick={ev => remove(e.id, ev)}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals footer */}
          <div className="ml-totals">
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
                {delta >= 0 ? '+' : '−'}{eur(delta)}
              </span>
            </div>
          </div>
        </>
      )}

      <div className="ml-csv-hint" style={{ marginTop: 10 }}>
        CSV: data (YYYY-MM-DD o DD/MM/YYYY), descrizione, importo — negativo = uscita · sep. , o ;
      </div>
    </div>
  );
}
