import { useState, useRef, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Groq from 'groq-sdk';
import { useFirebaseState } from '../../hooks/useFirebaseState';
import BentoCard     from '../primitives/BentoCard';
import DomainEyebrow from '../primitives/DomainEyebrow';
import MiniStatRow   from '../primitives/MiniStatRow';
import ChipTag       from '../primitives/ChipTag';
import EmptyState    from '../primitives/EmptyState';
import DetailDrawer  from '../primitives/DetailDrawer';

const CRM_KEY    = 'ml_crm';
const OUT_KEY    = 'ml_crm_outreach';
const APIKEY_KEY = 'sv_groq_key';
const MODEL      = 'llama-3.3-70b-versatile';
const ACCENT     = '#C4873D';

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

const FONTI = [
  { id: 'linkedin',  label: 'LinkedIn'  },
  { id: 'referral',  label: 'Referral'  },
  { id: 'evento',    label: 'Evento'    },
  { id: 'instagram', label: 'Instagram' },
  { id: 'altro',     label: 'Altro'     },
];

const TIPI_LAVORO = ['editing', 'shooting', 'coordinamento', 'consulenza', 'altro'];
const SETTORI     = ['Fashion', 'Food & Bev', 'Beauty', 'Tech', 'Sport', 'Luxury', 'Hospitality', 'Altro'];

const TEMPLATES = [
  { id: 'cold', label: 'Primo contatto — freddo', text: `Ciao {nome},\n\nHo visto il lavoro di {azienda} e mi ha colpito la cura nei contenuti.\n\nLavoro come {servizio} freelance e ho aiutato brand simili a produrre contenuti che convertono.\n\nSarei curioso di capire se c'è qualcosa in cui potrei esserti utile.\n\nHai 15 minuti questa settimana per una call veloce?\n\nA presto,\nSamuele` },
  { id: 'followup', label: 'Follow-up dopo silenzio', text: `Ciao {nome},\n\nTi scrivo di nuovo — credo che il mio lavoro potrebbe tornare utile a {azienda} nel momento giusto.\n\nSe adesso non è il periodo adatto, dimmelo pure e non ti disturbo più.\n\nSe c'è ancora interesse, sono disponibile per una chiamata veloce.\n\nA presto,\nSamuele` },
  { id: 'postcall', label: 'Dopo call — invio proposta', text: `Ciao {nome},\n\nGrazie per la chiamata di ieri — è stata una bella conversazione.\n\nCome anticipato, ti invio la proposta per {servizio} basata su quello che mi hai raccontato su {azienda}.\n\nFammi sapere se hai domande o vuoi aggiustare qualcosa.\n\nA presto,\nSamuele` },
  { id: 'referral', label: 'Referral — citare chi ha presentato', text: `Ciao {nome},\n\nMi ha parlato di te {chi_presentato} — mi ha detto che {azienda} sta lavorando su nuovi contenuti.\n\nLavoro come {servizio} freelance e penso di poter essere utile.\n\nTi va di sentirci per una call veloce?\n\nA presto,\nSamuele` },
];

function today()           { return new Date().toISOString().split('T')[0]; }
function daysBetween(a, b) { return Math.floor((new Date(b) - new Date(a)) / 86400000); }
function statoInfo(id)     { return STATI.find(s => s.id === id) || STATI[0]; }
const fmt = n => n ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) : null;

const STATO_CHIP_TONE = {
  acquisito: 'success', risposto: 'teal', call: 'warning',
  proposta: 'warning', perso: 'magenta', pausa: 'neutral',
  identificato: 'neutral', contattato: 'neutral',
};

const EMPTY_FORM = {
  nome: '', azienda: '', settore: '', email: '', linkedin: '',
  telefono: '', come_conosciuto: '', chi_presentato: '',
  fonte: 'linkedin', stato: 'identificato',
  importo_stimato: '', tipo_lavoro: 'editing', ricorrente: false,
  ultimo_contatto: today(), note: '',
};

const PeopleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

export default function CRMClienti() {
  const [clients, setClients] = useFirebaseState(CRM_KEY, []);
  const [outData, setOutData] = useFirebaseState(OUT_KEY, {});
  const [groqKey]             = useFirebaseState(APIKEY_KEY, '');
  const [open, setOpen] = useState(false);

  const [view,    setView]    = useState('pipeline');
  const [form,    setForm]    = useState(null);
  const [editId,  setEditId]  = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [emailGen, setEmailGen] = useState({ open: false, nome: '', azienda: '', servizio: '', chi_presentato: '', templateId: 'cold' });
  const [generatedEmail, setGenEmail] = useState('');
  const [genBusy, setGenBusy] = useState(false);
  const csvRef = useRef(null);

  const save = next => setClients(next);

  // ── outreach
  const todayStr   = today();
  const todayCount = outData[todayStr] || 0;

  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().split('T')[0];
      if (outData[key] && outData[key] > 0) { count++; d.setDate(d.getDate() - 1); }
      else if (i === 0) { d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  }, [outData]);

  const lastOutreach = useMemo(() =>
    Object.keys(outData).filter(k => outData[k] > 0).sort().reverse()[0] || null,
  [outData]);

  const silentDays = lastOutreach ? daysBetween(lastOutreach, todayStr) : null;
  const addOutreach     = () => setOutData({ ...outData, [todayStr]: (outData[todayStr] || 0) + 1 });
  const resetTodayOutreach = () => setOutData({ ...outData, [todayStr]: 0 });

  // ── CRUD
  const upsert = () => {
    if (!form || !form.nome.trim()) return;
    const next = editId
      ? clients.map(c => c.id === editId ? { ...form, id: editId } : c)
      : [...clients, { ...form, id: Date.now() }];
    save(next);
    setForm(null); setEditId(null);
  };

  const remove      = id => { save(clients.filter(c => c.id !== id)); setForm(null); setEditId(null); };
  const openNew     = ()  => { setForm({ ...EMPTY_FORM }); setEditId(null); };
  const openEdit    = c   => { setForm({ ...c }); setEditId(c.id); };
  const setF        = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const changeStato = (id, stato) =>
    save(clients.map(c => c.id === id ? { ...c, stato, ultimo_contatto: stato !== c.stato ? today() : c.ultimo_contatto } : c));

  const markContactedToday = id =>
    save(clients.map(c => c.id === id ? { ...c, ultimo_contatto: today() } : c));

  // ── drag & drop
  const onDragStart = (e, id)    => { e.dataTransfer.setData('cid', String(id)); setDragging(id); };
  const onDragEnd   = ()         => { setDragging(null); setDragOver(null); };
  const onDragEnter = (e, stato) => { e.preventDefault(); setDragOver(stato); };
  const onDragOver  = e          => e.preventDefault();
  const onDrop      = (e, stato) => {
    const id = Number(e.dataTransfer.getData('cid'));
    changeStato(id, stato);
    setDragging(null); setDragOver(null);
  };

  // ── CSV import
  const importCSV = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines   = ev.target.result.split(/\r?\n/).filter(Boolean);
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

  // ── email generator
  const generateEmail = async () => {
    const tpl   = TEMPLATES.find(t => t.id === emailGen.templateId);
    if (!tpl) return;
    const subst = tpl.text
      .replace(/{nome}/g,           emailGen.nome           || '[nome]')
      .replace(/{azienda}/g,        emailGen.azienda        || '[azienda]')
      .replace(/{servizio}/g,       emailGen.servizio       || '[servizio]')
      .replace(/{chi_presentato}/g, emailGen.chi_presentato || '[chi ti ha presentato]');

    if (groqKey && emailGen.nome && emailGen.azienda) {
      setGenBusy(true);
      let out = '';
      setGenEmail('...');
      try {
        const groq   = new Groq({ apiKey: groqKey, dangerouslyAllowBrowser: true });
        const stream = await groq.chat.completions.create({
          model: MODEL, max_tokens: 400,
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
      finally   { setGenBusy(false); }
    } else {
      setGenEmail(subst);
    }
  };

  // ── stats
  const fonteStats = useMemo(() => FONTI.map(f => ({
    label:     f.label,
    contatti:  clients.filter(c => c.fonte === f.id).length,
    acquisiti: clients.filter(c => c.fonte === f.id && c.stato === 'acquisito').length,
  })), [clients]);

  const followUpAlerts = useMemo(() =>
    clients.filter(c =>
      !['acquisito', 'perso', 'pausa'].includes(c.stato) &&
      c.ultimo_contatto &&
      daysBetween(c.ultimo_contatto, today()) >= 5
    ).sort((a, b) => a.ultimo_contatto.localeCompare(b.ultimo_contatto)),
  [clients]);

  const acquisiti  = clients.filter(c => c.stato === 'acquisito').length;
  const inProposta = clients.filter(c => c.stato === 'proposta').length;

  // ── card summary
  const eyebrow = (
    <DomainEyebrow domain="money" label="CRM & Outreach" icon={<PeopleIcon />} />
  );
  const action = (
    <button className="mod-open-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
      Apri CRM
    </button>
  );

  const headerStats = [
    { label: 'Contatti',    value: clients.length  },
    { label: 'Acquisiti',   value: acquisiti        },
    { label: 'In proposta', value: inProposta       },
    { label: 'Outreach og.', value: `${todayCount}/2` },
  ];

  const outreachTone = todayCount >= 2 ? 'success' : todayCount >= 1 ? 'warning' : 'neutral';

  return (
    <>
      <BentoCard eyebrow={eyebrow} action={action} className="mod-card" onClick={() => setOpen(true)}>
        <div className="mod-body">
          {clients.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <span style={{ fontSize: 28 }}>🤝</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                Aggiungi il primo contatto
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, color: 'var(--color-ink)' }}>
                    {clients.length}
                  </span>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-ink-muted)' }}>contatti</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <ChipTag tone={outreachTone}>{todayCount}/2 outreach oggi</ChipTag>
                  {followUpAlerts.length > 0 && (
                    <ChipTag tone="magenta">{followUpAlerts.length} follow-up</ChipTag>
                  )}
                </div>
              </div>
              <MiniStatRow stats={[
                { label: 'Acquisiti',   value: acquisiti  },
                { label: 'In proposta', value: inProposta },
                { label: 'Streak',      value: `${streak}g` },
              ]} />
            </div>
          )}
        </div>
      </BentoCard>

      <DetailDrawer
        isOpen={open}
        onClose={() => { setOpen(false); setForm(null); setEditId(null); }}
        eyebrow="Money & Lavoro"
        title="CRM & Outreach"
        headerStats={headerStats}
        primaryAction={{ label: '+ Contatto', onClick: openNew }}
        accentColor={ACCENT}
      >
        <div className="dr-content">

          {/* ── Outreach bar ── */}
          <section className="dr-section">
            <h3 className="dr-section-title">Outreach giornaliero</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, color: todayCount >= 2 ? 'var(--color-success)' : 'var(--color-ink)' }}>
                    {todayCount}
                  </span>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)', marginLeft: 4 }}>/2 oggi</span>
                </div>
                {streak > 0 && (
                  <ChipTag tone="teal">{streak}g streak</ChipTag>
                )}
                {silentDays !== null && silentDays >= 3 && (
                  <ChipTag tone="magenta">⚠ {silentDays}g senza outreach</ChipTag>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {todayCount > 0 && (
                  <button className="cm-btn cm-btn-ghost" onClick={resetTodayOutreach}>↺ Reset</button>
                )}
                <button className="cm-btn" onClick={addOutreach}>+ Outreach fatto</button>
              </div>
            </div>
          </section>

          {/* ── Follow-up alerts ── */}
          {followUpAlerts.length > 0 && (
            <section className="dr-section">
              <h3 className="dr-section-title">Follow-up in scadenza</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {followUpAlerts.map(c => (
                  <div key={c.id} className="crm-fu-alert">
                    <span>⏰ <strong>{c.nome}</strong>{c.azienda ? ` · ${c.azienda}` : ''} — {daysBetween(c.ultimo_contatto, today())}g senza follow-up</span>
                    <button className="cm-btn cm-btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => markContactedToday(c.id)}>Segna oggi</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── View tabs ── */}
          <section className="dr-section" style={{ paddingBottom: 0, borderBottom: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div className="crm-view-tabs">
                {[['pipeline', 'Pipeline'], ['contatti', 'Contatti'], ['statistiche', 'Statistiche']].map(([v, l]) => (
                  <button key={v} className={`crm-view-tab${view === v ? ' active' : ''}`} onClick={() => setView(v)}>{l}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="cm-btn cm-btn-ghost" style={{ fontSize: 11 }} onClick={() => csvRef.current?.click()}>Import CSV</button>
                <input ref={csvRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={importCSV} />
              </div>
            </div>
          </section>

          {/* ── Pipeline (kanban) ── */}
          {view === 'pipeline' && (
            <section className="dr-section" style={{ overflowX: 'auto' }}>
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
                        const stale   = daysAgo >= 5 && !['acquisito', 'perso', 'pausa'].includes(c.stato);
                        return (
                          <div
                            key={c.id}
                            className={`crm-card${dragging === c.id ? ' crm-card-drag' : ''}`}
                            style={{ borderLeftColor: s.color + '88' }}
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
                      {col.length === 0 && <div className="crm-col-empty">trascina qui</div>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Contatti (grid) ── */}
          {view === 'contatti' && (
            <section className="dr-section">
              {clients.length === 0 ? (
                <EmptyState
                  illustration="🤝"
                  title="Nessun contatto"
                  description="Aggiungi il primo contatto o importa da CSV LinkedIn"
                  cta="+ Contatto"
                  onCta={openNew}
                />
              ) : (
                <div className="crm-contacts-grid">
                  {clients.map(c => {
                    const s       = statoInfo(c.stato);
                    const daysAgo = c.ultimo_contatto ? daysBetween(c.ultimo_contatto, today()) : null;
                    const stale   = daysAgo !== null && daysAgo >= 5 && !['acquisito', 'perso', 'pausa'].includes(c.stato);
                    return (
                      <div key={c.id} className="crm-contact-card" onClick={() => openEdit(c)}>
                        <div className="crm-contact-head">
                          <div>
                            <div className="crm-contact-name">{c.nome}</div>
                            {c.azienda && <div className="crm-contact-co">{c.azienda}{c.settore ? ` · ${c.settore}` : ''}</div>}
                          </div>
                          <ChipTag tone={STATO_CHIP_TONE[c.stato] || 'neutral'}>{s.label}</ChipTag>
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
                          <div className="crm-contact-last" style={{ color: stale ? 'var(--color-magenta)' : 'var(--color-ink-muted)', opacity: stale ? 1 : 0.7 }}>
                            Ultimo contatto: {daysAgo === 0 ? 'oggi' : `${daysAgo}g fa`}
                          </div>
                        )}
                        {c.note && <div className="crm-contact-note">{c.note}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── Statistiche ── */}
          {view === 'statistiche' && (
            <section className="dr-section">
              <h3 className="dr-section-title">Pipeline funnel</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', marginBottom: 24 }}>
                {STATI.map(s => (
                  <div key={s.id} style={{ textAlign: 'center', minWidth: 56 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: s.color }}>
                      {clients.filter(c => c.stato === s.id).length}
                    </div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-ink-muted)', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <h3 className="dr-section-title" style={{ marginTop: 16 }}>Fonte acquisizione</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={fonteStats} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-ink-muted)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--color-ink-muted)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', fontSize: 12, borderRadius: 8, fontFamily: 'inherit' }} />
                  <Bar dataKey="contatti"  name="Contatti"  radius={[3, 3, 0, 0]}>
                    {fonteStats.map((_, i) => <Cell key={i} fill="var(--color-ink-muted)" />)}
                  </Bar>
                  <Bar dataKey="acquisiti" name="Acquisiti" radius={[3, 3, 0, 0]}>
                    {fonteStats.map((_, i) => <Cell key={i} fill="var(--color-success)" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}

          {/* ── Generatore email ── */}
          <section className="dr-section">
            <div
              className="crm-email-toggle"
              onClick={() => setEmailGen(g => ({ ...g, open: !g.open }))}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <h3 className="dr-section-title" style={{ margin: 0 }}>Generatore email outreach</h3>
              <span style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>{emailGen.open ? '▲' : '▼'}</span>
            </div>
            {emailGen.open && (
              <div className="crm-email-body" style={{ marginTop: 16 }}>
                <div className="crm-email-grid">
                  {[
                    ['templateId', 'Template',        'select',  null, TEMPLATES.map(t => ({ v: t.id, l: t.label }))],
                    ['nome',       'Nome cliente',     'input',   'Marco Rossi',      null],
                    ['azienda',    'Azienda',          'input',   'Brand XYZ',        null],
                    ['servizio',   'Servizio offerto', 'input',   'video editing...',  null],
                  ].map(([k, lbl, type, ph, opts]) => (
                    <div key={k} className="crm-ef">
                      <label className="cm-label">{lbl}</label>
                      {type === 'select' ? (
                        <select className="cm-input" value={emailGen[k]} onChange={e => { setEmailGen(g => ({ ...g, [k]: e.target.value })); setGenEmail(''); }}>
                          {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      ) : (
                        <input className="cm-input" value={emailGen[k]} placeholder={ph} onChange={e => setEmailGen(g => ({ ...g, [k]: e.target.value }))} />
                      )}
                    </div>
                  ))}
                  {emailGen.templateId === 'referral' && (
                    <div className="crm-ef">
                      <label className="cm-label">Chi ha presentato</label>
                      <input className="cm-input" value={emailGen.chi_presentato} placeholder="Luca Ferrari" onChange={e => setEmailGen(g => ({ ...g, chi_presentato: e.target.value }))} />
                    </div>
                  )}
                </div>
                <button className="cm-btn" onClick={generateEmail} disabled={genBusy} style={{ marginTop: 12 }}>
                  {genBusy ? '…' : groqKey ? 'Genera con AI' : 'Usa template'}
                </button>
                {generatedEmail && (
                  <div className="crm-email-result" style={{ marginTop: 16 }}>
                    <pre className="crm-email-pre">{generatedEmail}</pre>
                    <button className="cm-btn cm-btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={() => navigator.clipboard.writeText(generatedEmail)}>
                      Copia
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

        </div>
      </DetailDrawer>

      {/* ── Form modal contatto ── */}
      {form && (
        <div className="crm-overlay" onClick={() => { setForm(null); setEditId(null); }}>
          <div className="crm-modal" onClick={e => e.stopPropagation()}>
            <div className="crm-modal-head">
              <span className="cm-label">{editId ? 'Modifica contatto' : 'Nuovo contatto'}</span>
              {editId && (
                <button className="cm-btn cm-btn-ghost" style={{ color: 'var(--color-magenta)' }} onClick={() => remove(editId)}>Elimina</button>
              )}
            </div>
            <div className="crm-form-grid">
              {[
                ['nome',           'Nome *',            'text',  'Marco Rossi'],
                ['azienda',        'Azienda',           'text',  'Brand XYZ'],
                ['email',          'Email',             'email', ''],
                ['linkedin',       'LinkedIn URL',      'text',  ''],
                ['telefono',       'Telefono',          'tel',   ''],
                ['chi_presentato', 'Chi ha presentato', 'text',  ''],
                ['come_conosciuto','Come conosciuto',   'text',  ''],
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
              <textarea className="cm-input" rows={3} style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13, marginTop: 4, display: 'block', width: '100%', boxSizing: 'border-box' }} value={form.note} onChange={e => setF('note', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="cm-btn" onClick={upsert} disabled={!form.nome.trim()}>{editId ? 'Salva modifiche' : 'Aggiungi'}</button>
              <button className="cm-btn cm-btn-ghost" onClick={() => { setForm(null); setEditId(null); }}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
