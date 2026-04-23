import { useState, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const KEY      = 'ml_entrate';
const GOAL_KEY = 'ml_entrate_goal';
const GOAL_START = 1500;
const CATEGORIE  = ['freelance', 'contratto', 'investimento', 'altro'];

const eur    = n => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(n) || 0);
const mKey   = d => String(d).slice(0, 7);
const mLabel = k => { const [y, m] = k.split('-'); return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }); };
const todayISO = () => new Date().toISOString().split('T')[0];
const thisMonth = () => todayISO().slice(0, 7);

function load()     { try { return JSON.parse(localStorage.getItem(KEY)      || '[]'); } catch { return []; } }
function loadGoal() { try { return JSON.parse(localStorage.getItem(GOAL_KEY) || 'null') || { val: GOAL_START, history: [] }; } catch { return { val: GOAL_START, history: [] }; } }

function monthTotals(entries) {
  const map = {};
  entries.forEach(e => { const k = mKey(e.date); map[k] = (map[k] || 0) + (Number(e.importo_lordo) || 0); });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ month: mLabel(k), key: k, total: v }));
}

const EMPTY_FORM = { date: todayISO(), cliente: '', progetto: '', importo_lordo: '', categoria: 'freelance' };

export default function EntrateMensili() {
  const [entries, setEntries] = useState(load);
  const [goal,    setGoal]    = useState(loadGoal);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const csvRef = useRef();

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveEntry = () => {
    if (!form.importo_lordo || !form.date) return;
    const entry = { id: Date.now(), ...form, importo_lordo: parseFloat(form.importo_lordo) };
    const next  = [entry, ...entries];
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));

    // Check adaptive goal for current month
    const cm  = thisMonth();
    const tot = next.filter(e => mKey(e.date) === cm).reduce((s, e) => s + e.importo_lordo, 0);
    if (tot >= goal.val && !goal.history.find(h => h.month === cm)) {
      const newVal  = Math.round(goal.val * 1.10);
      const newGoal = { val: newVal, history: [...goal.history, { month: cm, target: goal.val, reached: tot }] };
      setGoal(newGoal);
      localStorage.setItem(GOAL_KEY, JSON.stringify(newGoal));
    }

    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  };

  const remove = id => {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const importCSV = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = ev.target.result.trim().split('\n');
      const imported = lines.slice(1).flatMap(line => {
        const cols = line.split(/[,;]/).map(c => c.trim().replace(/^"|"$/g, ''));
        const date = cols[0]; const amt = parseFloat((cols[2] || cols[1] || '0').replace(',', '.'));
        if (!date || isNaN(amt) || amt <= 0) return [];
        return [{ id: Date.now() + Math.random(), date, cliente: cols[1] || '', progetto: '', importo_lordo: amt, categoria: 'altro' }];
      });
      const next = [...imported, ...entries];
      setEntries(next);
      localStorage.setItem(KEY, JSON.stringify(next));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const chart     = monthTotals(entries).slice(-12);
  const cm        = thisMonth();
  const cmTotal   = entries.filter(e => mKey(e.date) === cm).reduce((s, e) => s + e.importo_lordo, 0);
  const progress  = Math.min(100, goal.val > 0 ? (cmTotal / goal.val) * 100 : 0);
  const allTime   = entries.reduce((s, e) => s + e.importo_lordo, 0);

  return (
    <div>
      <div className="ml-stat-strip">
        <div><div className="ml-stat-label">Mese corrente</div><div className="ml-stat-mid">{eur(cmTotal)}</div></div>
        <div><div className="ml-stat-label">Obiettivo mese</div><div className="ml-stat-mid ml-lime">{eur(goal.val)}</div></div>
        <div><div className="ml-stat-label">Totale storico</div><div className="ml-stat-mid">{eur(allTime)}</div></div>
      </div>

      {/* Adaptive goal progress */}
      <div className="ml-goal-wrap">
        <div className="ml-goal-bar-bg">
          <div className="ml-goal-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="ml-goal-note">
          {progress >= 100
            ? `✓ Obiettivo raggiunto — prossimo target: ${eur(Math.round(goal.val * 1.10))}`
            : `${eur(goal.val - cmTotal)} al traguardo · ${progress.toFixed(0)}%`}
        </div>
      </div>

      {/* Trend chart */}
      {chart.length > 1 && (
        <div className="ml-chart-wrap">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text)', borderRadius: 0 }}
                formatter={v => [eur(v), 'Entrate']}
              />
              <ReferenceLine y={goal.val} stroke="var(--accent)" strokeDasharray="4 3" strokeWidth={1.5} />
              <Line type="monotone" dataKey="total" stroke="var(--text)" strokeWidth={1.5} dot={{ r: 3, fill: 'var(--text)' }} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Controls */}
      <div className="ml-tbl-header">
        <button className="cm-btn" onClick={() => setShowForm(s => !s)}>{showForm ? 'Annulla' : '+ Aggiungi'}</button>
        <div>
          <input ref={csvRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={importCSV} />
          <button className="cm-btn cm-btn-ghost" onClick={() => csvRef.current.click()}>Import CSV</button>
        </div>
      </div>

      {showForm && (
        <div className="ml-form-panel">
          <div className="ml-form-grid">
            <div className="cm-form-group">
              <label className="cm-label">Data</label>
              <input type="date" className="cm-input" value={form.date} onChange={e => setF('date', e.target.value)} />
            </div>
            <div className="cm-form-group">
              <label className="cm-label">Cliente</label>
              <input type="text" className="cm-input" value={form.cliente} onChange={e => setF('cliente', e.target.value)} placeholder="Nome cliente" />
            </div>
            <div className="cm-form-group">
              <label className="cm-label">Progetto</label>
              <input type="text" className="cm-input" value={form.progetto} onChange={e => setF('progetto', e.target.value)} placeholder="Descrizione" />
            </div>
            <div className="cm-form-group">
              <label className="cm-label">Importo lordo €</label>
              <input type="number" className="cm-input" value={form.importo_lordo} onChange={e => setF('importo_lordo', e.target.value)} min="0" step="0.01" />
            </div>
            <div className="cm-form-group">
              <label className="cm-label">Categoria</label>
              <select className="cm-input" value={form.categoria} onChange={e => setF('categoria', e.target.value)}>
                {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button className="cm-btn" onClick={saveEntry}>Salva entrata</button>
        </div>
      )}

      {/* CSV format hint */}
      <div className="ml-csv-hint">CSV atteso: data, descrizione, importo (separatore , o ;)</div>

      {entries.length === 0 ? (
        <div className="cm-empty">Nessuna entrata — aggiungi la prima o importa un CSV</div>
      ) : (
        <table className="ml-table">
          <thead>
            <tr><th>Data</th><th>Cliente</th><th>Progetto</th><th>Categoria</th><th>Importo</th><th /></tr>
          </thead>
          <tbody>
            {entries.slice(0, 40).map(e => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td><strong>{e.cliente || '—'}</strong></td>
                <td className="ml-td-muted">{e.progetto || '—'}</td>
                <td><span className="ml-badge">{e.categoria}</span></td>
                <td><strong>{eur(e.importo_lordo)}</strong></td>
                <td><button className="cm-icon-btn" onClick={() => remove(e.id)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
