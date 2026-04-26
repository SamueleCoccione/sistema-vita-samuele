import { useState, useRef, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Groq from 'groq-sdk';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const CRM_KEY    = 'ml_crm';
const OUT_KEY    = 'ml_crm_outreach';
const APIKEY_KEY = 'sv_groq_key';
const MODEL      = 'llama-3.3-70b-versatile';

const STATI = [
  { id: 'identificato', label: 'Identificato',      color: '#8a8680' },
  { id: 'contattato',   label: 'Contattato',         color: '#4a7ab5' },
  { id: 'risposto',     label: 'Risposto',            color: '#9a6ab5' },
  { id: 'call',         label: 'Call / Meeting',      color: '#c8a830' },
  { id: 'proposta',     label: 'Proposta inviata',    color: '#c87030' },
  { id: 'acquisito',    label: 'Acquisito',           color: '#3a8a2a' },
  { id: 'perso',        label: 'Perso',               color: '#b94040' },
  { id: 'pausa',        label: 'In pausa',            color: '#9a9680' },
];

const FONTI  = [
  { id: 'linkedin',  label: 'LinkedIn'  },
  { id: 'referral',  label: 'Referral'  },
  { id: 'evento',    label: 'Evento'    },
  { id: 'instagram', label: 'Instagram' },
  { id: 'altro',     label: 'Altro'     },
];

const TIPI_LAVORO = ['editing', 'shooting', 'coordinamento', 'consulenza', 'altro'];
const SETTORI     = ['Fashion', 'Food & Bev', 'Beauty', 'Tech', 'Sport', 'Luxury', 'Hospitality', 'Altro'];

const TEMPLATES = [
  {
    id: 'cold',
    label: 'Primo contatto — freddo',
    text: `Ciao {nome},

Ho visto il lavoro di {azienda} e mi ha colpito la cura nei contenuti.

Lavoro come {servizio} freelance e ho aiutato brand simili a produrre contenuti che convertono.

Sarei curioso di capire se c'è qualcosa in cui potrei esserti utile.

Hai 15 minuti questa settimana per una call veloce?

A presto,
Samuele`,
  },
  {
    id: 'followup',
    label: 'Follow-up dopo silenzio',
    text: `Ciao {nome},

Ti scrivo di nuovo — credo che il mio lavoro potrebbe tornare utile a {azienda} nel momento giusto.

Se adesso non è il periodo adatto, dimmelo pure e non ti disturbo più.

Se c'è ancora interesse, sono disponibile per una chiamata veloce.

A presto,
Samuele`,
  },
  {
    id: 'postcall',
    label: 'Dopo call — invio proposta',
    text: `Ciao {nome},

Grazie per la chiamata di ieri — è stata una bella conversazione.

Come anticipato, ti invio la proposta per {servizio} basata su quello che mi hai raccontato su {azienda}.

Fammi sapere se hai domande o vuoi aggiustare qualcosa.

A presto,
Samuele`,
  },
  {
    id: 'referral',
    label: 'Referral — citare chi ha presentato',
    text: `Ciao {nome},

Mi ha parlato di te {chi_presentato} — mi ha detto che {azienda} sta lavorando su nuovi contenuti.

Lavoro come {servizio} freelance e penso di poter essere utile.

Ti va di sentirci per una call veloce?

A presto,
Samuele`,
  },
];

function today()           { return new Date().toISOString().split('T')[0]; }
function daysBetween(a, b) { return Math.floor((new Date(b) - new Date(a)) / 86400000); }
function statoInfo(id)     { return STATI.find(s => s.id === id) || STATI[0]; }
const fmt = n => n ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) : null;

const EMPTY_FORM = {
  nome: '', azienda: '', settore: '', email: '', linkedin: '',
  telefono: '', come_conosciuto: '', chi_presentato: '',
  fonte: 'linkedin', stato: 'identificato',
  importo_stimato: '', tipo_lavoro: 'editing', ricorrente: false,
  ultimo_contatto: today(), note: '',
};

export default function CRMClienti() {
  const [clients, setClients] = useFirebaseState(CRM_KEY, []);
  const [outData, setOutData] = useFirebaseState(OUT_KEY, {});
  const [view,    setView]    = useState('pipeline');
  const [form,    setForm]    = useState(null);
  const [editId,  setEditId]  = useState(null);

  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const [emailGen, setEmailGen]           = useState({ open: false, nome: '', azienda: '', servizio: '', chi_presentato: '', templateId: 'cold' });
  const [generatedEmail, setGenEmail]     = useState('');
  const [genBusy, setGenBusy]             = useState(false);
  const csvRef = useRef(null);

  // ─── persist
  const save = next => setClients(next);

  // ─── outreach
  const todayStr    = today();
  const todayCount  = outData[todayStr] || 0;

  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().split('T')[0];
      if (outData[key] && outData[key] > 0) { count++; d.setDate(d.getDate() - 1); }
      else if (i === 0) { d.setDate(d.getDate() - 1); } // skip today if zero
      else break;
    }
    return count;
  }, [outData]);

  const lastOutreach = useMemo(() =>
    Object.keys(outData).filter(k => outData[k] > 0).sort().reverse()[0] || null,
  [outData]);

  const silentDays = lastOutreach ? daysBetween(lastOutreach, todayStr) : null;

  const addOutreach = () =>
    setOutData({ ...outData, [todayStr]: (outData[todayStr] || 0) + 1 });

  const resetTodayOutreach = () =>
    setOutData({ ...outData, [todayStr]: 0 });

  // ─── CRUD
  const upsert = () => {
    if (!form || !form.nome.trim()) return;
    const next = editId
      ? clients.map(c => c.id === editId ? { ...form, id: editId } : c)
      : [...clients, { ...form, id: Date.now() }];
    save(next);
    setForm(null); setEditId(null);
  };

  const remove = id => { save(clients.filter(c => c.id !== id)); setForm(null); setEditId(null); };

  const openNew  = ()  => { setForm({ ...EMPTY_FORM }); setEditId(null); };
  const openEdit = c   => { setForm({ ...c }); setEditId(c.id); };
  const setF     = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const changeStato = (id, stato) =>
    save(clients.map(c => c.id === id ? { ...c, stato, ultimo_contatto: stato !== c.stato ? today() : c.ultimo_contatto } : c));

  const markContactedToday = id =>
    save(clients.map(c => c.id === id ? { ...c, ultimo_contatto: today() } : c));

  // ─── drag & drop
  const onDragStart = (e, id)     => { e.dataTransfer.setData('cid', String(id)); setDragging(id); };
  const onDragEnd   = ()          => { setDragging(null); setDragOver(null); };
  const onDragEnter = (e, stato)  => { e.preventDefault(); setDragOver(stato); };
  const onDragOver  = e           => e.preventDefault();
  const onDrop      = (e, stato)  => {
    const id = Number(e.dataTransfer.getData('cid'));
    changeStato(id, stato);
    setDragging(null); setDragOver(null);
  };

  // ─── CSV import (LinkedIn)
  const importCSV = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = ev.target.result.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return;
      const sep     = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
      const headers = lines[0].split(sep).map(h => h.trim().replace(/"/g, '').toLowerCase());
      const idx     = names => names.map(n => headers.findIndex(h => h.includes(n))).find(i => i >= 0) ?? -1;
      const fstI = idx(['first name', 'nome']);
      const lstI = idx(['last name', 'cognome']);
      const emlI = idx(['email address', 'email']);
      const coI  = idx(['company', 'azienda']);
      const posI = idx(['position', 'title', 'ruolo']);

      const added = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.trim().replace(/"/g, ''));
        const nome = [fstI >= 0 ? cols[fstI] : '', lstI >= 0 ? cols[lstI] : ''].filter(Boolean).join(' ');
        if (!nome) continue;
        added.push({ ...EMPTY_FORM, id: Date.now() + i, nome, azienda: coI >= 0 ? cols[coI] : '', settore: posI >= 0 ? cols[posI] : '', email: emlI >= 0 ? cols[emlI] : '', fonte: 'linkedin' });
      }
      save([...clients, ...added]);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [groqKey] = useFirebaseState(APIKEY_KEY, '');

  // ─── email generator
  const generateEmail = async () => {
    const apiKey = groqKey;
    const tpl    = TEMPLATES.find(t => t.id === emailGen.templateId);
    if (!tpl) return;
    const subst = tpl.text
      .replace(/{nome}/g,          emailGen.nome          || '[nome]')
      .replace(/{azienda}/g,       emailGen.azienda       || '[azienda]')
      .replace(/{servizio}/g,      emailGen.servizio      || '[servizio]')
      .replace(/{chi_presentato}/g, emailGen.chi_presentato || '[chi ti ha presentato]');

    if (apiKey && emailGen.nome && emailGen.azienda) {
      setGenBusy(true);
      let out = '';
      setGenEmail('...');
      try {
        const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
        const stream = await groq.chat.completions.create({
          model:     MODEL,
          max_tokens: 400,
          messages: [
            { role: 'system', content: 'Sei Samuele, videomaker e content creator freelance italiano. Scrivi email di outreach brevi, dirette, autentiche. Niente corporate speak. Max 120 parole.' },
            { role: 'user',   content: `Riscrivi questa email rendendola più specifica e personale per ${emailGen.nome} di ${emailGen.azienda}${emailGen.servizio ? `, servizio: ${emailGen.servizio}` : ''}. Mantieni tono e struttura, aggiungi un dettaglio reale:\n\n${subst}` },
          ],
          stream: true,
        });
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) { out += delta; setGenEmail(out); }
        }
      } catch { setGenEmail(subst); }
      finally { setGenBusy(false); }
    } else {
      setGenEmail(subst);
    }
  };

  // ─── stats
  const fonteStats = useMemo(() => FONTI.map(f => ({
    label:    f.label,
    contatti: clients.filter(c => c.fonte === f.id).length,
    acquisiti: clients.filter(c => c.fonte === f.id && c.stato === 'acquisito').length,
  })), [clients]);

  // ─── follow-up alerts
  const followUpAlerts = useMemo(() =>
    clients.filter(c =>
      !['acquisito', 'perso', 'pausa'].includes(c.stato) &&
      c.ultimo_contatto &&
      daysBetween(c.ultimo_contatto, today()) >= 5
    ).sort((a, b) => a.ultimo_contatto.localeCompare(b.ultimo_contatto)),
  [clients]);

  // ─── card accent color
  const cardAccent = stato => {
    if (stato === 'acquisito') return 'var(--accent)';
    if (stato === 'perso')     return '#b94040';
    if (stato === 'pausa')     return '#9a9680';
    return 'var(--border2)';
  };

  return (
    <div>
      {/* ── Outreach bar */}
      <div className="crm-out-bar">
        <div className="crm-out-left">
          <div className="crm-out-count">
            <span className={`crm-out-num${todayCount >= 2 ? ' crm-out-done' : ''}`}>{todayCount}</span>
            <span className="crm-out-denom"> / 2 outreach oggi</span>
          </div>
          {streak > 0 && (
            <div className="crm-streak">{streak} {streak === 1 ? 'giorno' : 'giorni'} di streak</div>
          )}
          {silentDays !== null && silentDays >= 3 && (
            <div className="crm-alert-tag">⚠ {silentDays}g senza outreach</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{clients.length} contatti totali</span>
          {todayCount > 0 && (
            <button className="cm-btn cm-btn-ghost" onClick={resetTodayOutreach} title="Azzera counter di oggi">↺ Reset</button>
          )}
          <button className="cm-btn" onClick={addOutreach}>+ Outreach fatto</button>
        </div>
      </div>

      {/* ── Follow-up alerts */}
      {followUpAlerts.length > 0 && (
        <div className="crm-alerts-list">
          {followUpAlerts.map(c => (
            <div key={c.id} className="crm-fu-alert">
              <span>⏰ <strong>{c.nome}</strong>{c.azienda ? ` · ${c.azienda}` : ''} — {daysBetween(c.ultimo_contatto, today())}g senza follow-up</span>
              <button className="cm-btn cm-btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => markContactedToday(c.id)}>Segna oggi</button>
            </div>
          ))}
        </div>
      )}

      {/* ── View switcher + actions */}
      <div className="crm-toolbar">
        <div className="crm-view-tabs">
          {[['pipeline','Pipeline'],['contatti','Contatti'],['statistiche','Statistiche']].map(([v, l]) => (
            <button key={v} className={`crm-view-tab${view === v ? ' active' : ''}`} onClick={() => setView(v)}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="cm-btn" onClick={openNew}>+ Contatto</button>
          <button className="cm-btn cm-btn-ghost" onClick={() => csvRef.current?.click()}>Import CSV</button>
          <input ref={csvRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={importCSV} />
        </div>
      </div>

      {/* ══ PIPELINE VIEW (kanban) ══ */}
      {view === 'pipeline' && (
        <div className="crm-kanban">
          {STATI.map(s => {
            const col    = clients.filter(c => c.stato === s.id);
            const isOver = dragOver === s.id;
            return (
              <div
                key={s.id}
                className={`crm-col${isOver ? ' crm-col-over' : ''}`}
                onDragEnter={e => onDragEnter(e, s.id)}
                onDragOver={onDragOver}
                onDrop={e => onDrop(e, s.id)}
              >
                <div className="crm-col-head" style={{ borderLeftColor: s.color }}>
                  <span style={{ color: s.color }}>{s.label}</span>
                  {col.length > 0 && <span className="crm-col-count">{col.length}</span>}
                </div>

                {col.map(c => {
                  const daysAgo = c.ultimo_contatto ? daysBetween(c.ultimo_contatto, today()) : 0;
                  const stale   = daysAgo >= 5 && !['acquisito','perso','pausa'].includes(c.stato);
                  return (
                    <div
                      key={c.id}
                      className={`crm-card${dragging === c.id ? ' crm-card-drag' : ''}`}
                      style={{ borderLeftColor: cardAccent(c.stato) }}
                      draggable
                      onDragStart={e => onDragStart(e, c.id)}
                      onDragEnd={onDragEnd}
                      onClick={() => openEdit(c)}
                    >
                      <div className="crm-card-name">{c.nome}</div>
                      {c.azienda && <div className="crm-card-co">{c.azienda}</div>}
                      <div className="crm-card-meta">
                        {c.importo_stimato && <span className="crm-card-amt">{fmt(c.importo_stimato)}</span>}
                        <span className="crm-card-fonte">{FONTI.find(f => f.id === c.fonte)?.label}</span>
                      </div>
                      {stale && <div className="crm-card-stale">⏰ {daysAgo}g</div>}
                    </div>
                  );
                })}

                {col.length === 0 && (
                  <div className="crm-col-empty">trascina qui</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ CONTATTI VIEW (grid) ══ */}
      {view === 'contatti' && (
        <div className="crm-contacts-grid">
          {clients.length === 0 && (
            <div className="cm-empty" style={{ gridColumn: '1/-1' }}>
              Nessun contatto — aggiungi il primo o importa da CSV LinkedIn
            </div>
          )}
          {clients.map(c => {
            const s       = statoInfo(c.stato);
            const daysAgo = c.ultimo_contatto ? daysBetween(c.ultimo_contatto, today()) : null;
            const stale   = daysAgo !== null && daysAgo >= 5 && !['acquisito','perso','pausa'].includes(c.stato);
            return (
              <div key={c.id} className="crm-contact-card" onClick={() => openEdit(c)}>
                <div className="crm-contact-head">
                  <div>
                    <div className="crm-contact-name">{c.nome}</div>
                    {c.azienda && <div className="crm-contact-co">{c.azienda}{c.settore ? ` · ${c.settore}` : ''}</div>}
                  </div>
                  <div className="crm-stato-pill" style={{ background: s.color + '22', color: s.color, border: `1px solid ${s.color}55` }}>
                    {s.label}
                  </div>
                </div>
                <div className="crm-contact-links">
                  {c.email    && <span className="crm-clink">✉ {c.email}</span>}
                  {c.linkedin && <span className="crm-clink">in {c.linkedin}</span>}
                  {c.telefono && <span className="crm-clink">☎ {c.telefono}</span>}
                </div>
                {c.importo_stimato && (
                  <div className="crm-contact-deal">{fmt(c.importo_stimato)} · {c.tipo_lavoro}{c.ricorrente ? ' · ricorrente' : ''}</div>
                )}
                {daysAgo !== null && (
                  <div className="crm-contact-last" style={{ color: stale ? '#b94040' : 'var(--text3)' }}>
                    Ultimo contatto: {daysAgo === 0 ? 'oggi' : `${daysAgo}g fa`}
                  </div>
                )}
                {c.note && <div className="crm-contact-note">{c.note}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ STATISTICHE VIEW ══ */}
      {view === 'statistiche' && (
        <div className="crm-stats-wrap">
          <div className="crm-kpi-row">
            {STATI.map(s => (
              <div key={s.id} className="crm-kpi">
                <div className="crm-kpi-num" style={{ color: s.color }}>{clients.filter(c => c.stato === s.id).length}</div>
                <div className="crm-kpi-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="cm-label" style={{ marginBottom: 12, marginTop: 28 }}>Fonte acquisizione</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={fonteStats} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text2)' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12, borderRadius: 0 }} />
              <Bar dataKey="contatti"  name="Contatti"  radius={[2,2,0,0]}>
                {fonteStats.map((_, i) => <Cell key={i} fill="var(--text2)" />)}
              </Bar>
              <Bar dataKey="acquisiti" name="Acquisiti" radius={[2,2,0,0]}>
                {fonteStats.map((_, i) => <Cell key={i} fill="var(--accent)" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="cm-label" style={{ marginBottom: 12, marginTop: 28 }}>Conversion funnel</div>
          {STATI.map(s => {
            const cnt = clients.filter(c => c.stato === s.id).length;
            const pct = clients.length > 0 ? (cnt / clients.length) * 100 : 0;
            return (
              <div key={s.id} className="crm-funnel-row">
                <span className="crm-funnel-lbl" style={{ color: s.color }}>{s.label}</span>
                <div className="crm-funnel-track">
                  <div className="crm-funnel-fill" style={{ width: `${pct}%`, background: s.color + '44', borderRight: cnt > 0 ? `2px solid ${s.color}` : 'none' }} />
                </div>
                <span className="crm-funnel-cnt">{cnt}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Generatore email outreach */}
      <div className="crm-email-panel">
        <div className="crm-email-toggle" onClick={() => setEmailGen(g => ({ ...g, open: !g.open }))}>
          <span className="cm-label">Generatore email outreach</span>
          <span style={{ fontSize: 11, color: 'var(--text2)' }}>{emailGen.open ? '▲' : '▼'}</span>
        </div>

        {emailGen.open && (
          <div className="crm-email-body">
            <div className="crm-email-grid">
              <div className="crm-ef">
                <label className="cm-label">Template</label>
                <select className="cm-input" value={emailGen.templateId}
                  onChange={e => { setEmailGen(g => ({...g, templateId: e.target.value})); setGenEmail(''); }}>
                  {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="crm-ef">
                <label className="cm-label">Nome cliente</label>
                <input className="cm-input" value={emailGen.nome} onChange={e => setEmailGen(g => ({...g, nome: e.target.value}))} placeholder="Marco Rossi" />
              </div>
              <div className="crm-ef">
                <label className="cm-label">Azienda</label>
                <input className="cm-input" value={emailGen.azienda} onChange={e => setEmailGen(g => ({...g, azienda: e.target.value}))} placeholder="Brand XYZ" />
              </div>
              <div className="crm-ef">
                <label className="cm-label">Servizio offerto</label>
                <input className="cm-input" value={emailGen.servizio} onChange={e => setEmailGen(g => ({...g, servizio: e.target.value}))} placeholder="video editing per social" />
              </div>
              {emailGen.templateId === 'referral' && (
                <div className="crm-ef">
                  <label className="cm-label">Chi ha presentato</label>
                  <input className="cm-input" value={emailGen.chi_presentato} onChange={e => setEmailGen(g => ({...g, chi_presentato: e.target.value}))} placeholder="Luca Ferrari" />
                </div>
              )}
            </div>

            <button className="cm-btn" onClick={generateEmail} disabled={genBusy}>
              {genBusy ? '...' : groqKey ? 'Genera con Claude' : 'Usa template'}
            </button>

            {generatedEmail && (
              <div className="crm-email-result">
                <pre className="crm-email-pre">{generatedEmail}</pre>
                <button className="cm-btn cm-btn-ghost" style={{ alignSelf: 'flex-start' }}
                  onClick={() => navigator.clipboard.writeText(generatedEmail)}>
                  Copia
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Form modal */}
      {form && (
        <div className="crm-overlay" onClick={() => { setForm(null); setEditId(null); }}>
          <div className="crm-modal" onClick={e => e.stopPropagation()}>
            <div className="crm-modal-head">
              <span className="cm-label">{editId ? 'Modifica contatto' : 'Nuovo contatto'}</span>
              {editId && (
                <button className="cm-btn cm-btn-ghost" style={{ color: '#b94040' }} onClick={() => remove(editId)}>
                  Elimina
                </button>
              )}
            </div>

            <div className="crm-form-grid">
              {[
                ['nome',            'Nome *',             'text',   'Marco Rossi'],
                ['azienda',         'Azienda',            'text',   'Brand XYZ'],
                ['email',           'Email',              'email',  ''],
                ['linkedin',        'LinkedIn URL',       'text',   ''],
                ['telefono',        'Telefono',           'tel',    ''],
                ['chi_presentato',  'Chi ha presentato',  'text',   ''],
                ['come_conosciuto', 'Come conosciuto',    'text',   ''],
              ].map(([k, l, t, ph]) => (
                <div key={k} className="crm-ff">
                  <label className="cm-label">{l}</label>
                  <input className="cm-input" type={t} value={form[k]} placeholder={ph} onChange={e => setF(k, e.target.value)} />
                </div>
              ))}

              <div className="crm-ff">
                <label className="cm-label">Settore</label>
                <select className="cm-input" value={form.settore} onChange={e => setF('settore', e.target.value)}>
                  <option value="">—</option>
                  {SETTORI.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="crm-ff">
                <label className="cm-label">Fonte</label>
                <select className="cm-input" value={form.fonte} onChange={e => setF('fonte', e.target.value)}>
                  {FONTI.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
              <div className="crm-ff">
                <label className="cm-label">Stato pipeline</label>
                <select className="cm-input" value={form.stato} onChange={e => setF('stato', e.target.value)}>
                  {STATI.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div className="crm-ff">
                <label className="cm-label">Tipo lavoro</label>
                <select className="cm-input" value={form.tipo_lavoro} onChange={e => setF('tipo_lavoro', e.target.value)}>
                  {TIPI_LAVORO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="crm-ff">
                <label className="cm-label">Importo stimato €</label>
                <input className="cm-input" type="number" value={form.importo_stimato} onChange={e => setF('importo_stimato', e.target.value)} placeholder="1500" min="0" />
              </div>
              <div className="crm-ff">
                <label className="cm-label">Ultimo contatto</label>
                <input className="cm-input" type="date" value={form.ultimo_contatto} onChange={e => setF('ultimo_contatto', e.target.value)} />
              </div>
            </div>

            <label className="crm-check-label">
              <input type="checkbox" checked={form.ricorrente} onChange={e => setF('ricorrente', e.target.checked)} />
              Lavoro ricorrente
            </label>

            <div style={{ marginTop: 12 }}>
              <label className="cm-label">Note</label>
              <textarea
                className="cm-input"
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13, marginTop: 4, display: 'block', width: '100%', boxSizing: 'border-box' }}
                value={form.note}
                onChange={e => setF('note', e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="cm-btn" onClick={upsert} disabled={!form.nome.trim()}>
                {editId ? 'Salva modifiche' : 'Aggiungi'}
              </button>
              <button className="cm-btn cm-btn-ghost" onClick={() => { setForm(null); setEditId(null); }}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
