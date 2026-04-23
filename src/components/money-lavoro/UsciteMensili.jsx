import { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const KEY        = 'ml_uscite';
const BUDGET_KEY = 'ml_budget';

const CATEGORIE = ['affitto', 'bollette', 'cibo', 'investimenti', 'altro'];
const DEFAULT_BUDGET = { affitto: 900, bollette: 200, cibo: 400, investimenti: 500, altro: 300 };

const eur       = n => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(n) || 0);
const mKey      = d => String(d).slice(0, 7);
const todayISO  = () => new Date().toISOString().split('T')[0];
const thisMonth = () => todayISO().slice(0, 7);

function load()       { try { return JSON.parse(localStorage.getItem(KEY)        || '[]'); }  catch { return []; } }
function loadBudget() { try { return { ...DEFAULT_BUDGET, ...JSON.parse(localStorage.getItem(BUDGET_KEY) || '{}') }; } catch { return { ...DEFAULT_BUDGET }; } }

const EMPTY_FORM = { date: todayISO(), descrizione: '', importo: '', categoria: 'cibo' };

export default function UsciteMensili() {
  const [entries,  setEntries]  = useState(load);
  const [budget,   setBudget]   = useState(loadBudget);
  const [showForm, setShowForm] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [form,     setForm]     = useState({ ...EMPTY_FORM });
  const [budgetDraft, setBudgetDraft] = useState(loadBudget);
  const csvRef = useRef();

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveEntry = () => {
    if (!form.importo || !form.date) return;
    const entry = { id: Date.now(), ...form, importo: parseFloat(form.importo) };
    const next  = [entry, ...entries];
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  };

  const remove = id => {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const saveBudget = () => {
    setBudget({ ...budgetDraft });
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgetDraft));
    setShowBudget(false);
  };

  const importCSV = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = ev.target.result.trim().split('\n');
      const imported = lines.slice(1).flatMap(line => {
        const cols = line.split(/[,;]/).map(c => c.trim().replace(/^"|"$/g, ''));
        const date = cols[0]; const amt = Math.abs(parseFloat((cols[2] || cols[1] || '0').replace(',', '.')));
        if (!date || isNaN(amt) || amt <= 0) return [];
        return [{ id: Date.now() + Math.random(), date, descrizione: cols[1] || '', importo: amt, categoria: 'altro' }];
      });
      const next = [...imported, ...entries];
      setEntries(next);
      localStorage.setItem(KEY, JSON.stringify(next));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const cm = thisMonth();
  const cmEntries = entries.filter(e => mKey(e.date) === cm);
  const totale    = cmEntries.reduce((s, e) => s + e.importo, 0);
  const budgTot   = Object.values(budget).reduce((s, v) => s + Number(v), 0);

  const catData = CATEGORIE.map(cat => ({
    name: cat,
    speso:  cmEntries.filter(e => e.categoria === cat).reduce((s, e) => s + e.importo, 0),
    budget: Number(budget[cat]) || 0,
  }));

  return (
    <div>
      <div className="ml-stat-strip">
        <div><div className="ml-stat-label">Uscite mese</div><div className="ml-stat-mid">{eur(totale)}</div></div>
        <div><div className="ml-stat-label">Budget totale</div><div className="ml-stat-mid">{eur(budgTot)}</div></div>
        <div>
          <div className="ml-stat-label">Margine</div>
          <div className={`ml-stat-mid${totale > budgTot ? ' ml-over' : ''}`}>{eur(budgTot - totale)}</div>
        </div>
      </div>

      {/* Category cards */}
      <div className="ml-cat-grid">
        {catData.map(c => {
          const over = c.speso > c.budget && c.budget > 0;
          const pct  = c.budget > 0 ? Math.min(100, (c.speso / c.budget) * 100) : 0;
          return (
            <div key={c.name} className={`ml-cat-card${over ? ' ml-cat-over' : ''}`}>
              <div className="ml-cat-name">{c.name}</div>
              <div className="ml-cat-row">
                <span className="ml-cat-val">{eur(c.speso)}</span>
                <span className="ml-cat-bud">/ {eur(c.budget)}</span>
              </div>
              <div className="ml-cat-bar-bg">
                <div className="ml-cat-bar-fill" style={{ width: `${pct}%`, background: over ? '#b94040' : 'var(--accent)' }} />
              </div>
              {over && <div className="ml-cat-alert">+{eur(c.speso - c.budget)}</div>}
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      {catData.some(c => c.speso > 0) && (
        <div className="ml-chart-wrap">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={catData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12, borderRadius: 0 }}
                formatter={v => [eur(v), 'Speso']}
              />
              <Bar dataKey="speso" radius={0}>
                {catData.map((c, i) => (
                  <Cell key={i} fill={c.speso > c.budget && c.budget > 0 ? '#b94040' : 'var(--text)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Controls */}
      <div className="ml-tbl-header">
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="cm-btn" onClick={() => setShowForm(s => !s)}>{showForm ? 'Annulla' : '+ Aggiungi'}</button>
          <button className="cm-btn cm-btn-ghost" onClick={() => { setBudgetDraft({ ...budget }); setShowBudget(s => !s); }}>
            {showBudget ? 'Chiudi budget' : 'Budget'}
          </button>
        </div>
        <div>
          <input ref={csvRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={importCSV} />
          <button className="cm-btn cm-btn-ghost" onClick={() => csvRef.current.click()}>Import CSV</button>
        </div>
      </div>

      {showBudget && (
        <div className="ml-form-panel">
          <div className="ml-form-grid">
            {CATEGORIE.map(cat => (
              <div key={cat} className="cm-form-group">
                <label className="cm-label">{cat} €</label>
                <input type="number" className="cm-input" value={budgetDraft[cat] || 0}
                  onChange={e => setBudgetDraft(b => ({ ...b, [cat]: parseFloat(e.target.value) || 0 }))} min="0" />
              </div>
            ))}
          </div>
          <button className="cm-btn" onClick={saveBudget}>Salva budget</button>
        </div>
      )}

      {showForm && (
        <div className="ml-form-panel">
          <div className="ml-form-grid">
            <div className="cm-form-group">
              <label className="cm-label">Data</label>
              <input type="date" className="cm-input" value={form.date} onChange={e => setF('date', e.target.value)} />
            </div>
            <div className="cm-form-group">
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
          </div>
          <button className="cm-btn" onClick={saveEntry}>Salva uscita</button>
        </div>
      )}

      <div className="ml-csv-hint">CSV atteso: data, descrizione, importo (separatore , o ;)</div>

      {entries.length === 0 ? (
        <div className="cm-empty">Nessuna uscita — aggiungi o importa CSV</div>
      ) : (
        <table className="ml-table">
          <thead>
            <tr><th>Data</th><th>Descrizione</th><th>Categoria</th><th>Importo</th><th /></tr>
          </thead>
          <tbody>
            {entries.slice(0, 40).map(e => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td><strong>{e.descrizione || '—'}</strong></td>
                <td><span className="ml-badge">{e.categoria}</span></td>
                <td>{eur(e.importo)}</td>
                <td><button className="cm-icon-btn" onClick={() => remove(e.id)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
