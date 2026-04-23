import './MoneyLavoro.css';
import PageHero from '../components/PageHero';
import Patrimonio        from '../components/money-lavoro/Patrimonio';
import Transazioni       from '../components/money-lavoro/Transazioni';
import CRMClienti        from '../components/money-lavoro/CRMClienti';
import EsperimentiAttivi from '../components/money-lavoro/EsperimentiAttivi';
import BenessereLayout   from '../components/money-lavoro/BenessereLayout';
import MoneyChat         from '../components/money-lavoro/MoneyChat';

const SECTIONS = [
  { id: 'patrimonio',  title: 'Patrimonio',          Component: Patrimonio        },
  { id: 'transazioni', title: 'Entrate & Uscite',    Component: Transazioni       },
  { id: 'crm',         title: 'Ricerca Clienti & Outreach', Component: CRMClienti  },
  { id: 'esperimenti', title: 'Esperimenti attivi',  Component: EsperimentiAttivi },
  { id: 'benessere',   title: 'Benessere lavorativo', Component: BenessereLayout  },
];

function downloadTabData() {
  const safe = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const data = {
    exported_at: new Date().toISOString(),
    tab: 'Money & Lavoro',
    sections: {
      patrimonio:        safe('ml_patrimonio'),
      transazioni:       safe('ml_transazioni'),
      obiettivo_entrate: safe('ml_entrate_goal'),
      crm_clienti:       safe('ml_crm'),
      crm_outreach:      safe('ml_crm_outreach'),
      esperimenti:       safe('ml_esperimenti'),
      benessere:         safe('ml_benessere'),
    },
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), {
    href: url,
    download: `money-lavoro-${new Date().toISOString().split('T')[0]}.json`,
  }).click();
  URL.revokeObjectURL(url);
}

export default function MoneyLavoro() {
  return (
    <div className="cm-page">
      <PageHero title="Money & Lavoro" />

      {SECTIONS.map(({ id, title, Component }) => (
        <div key={id} className="cm-section">
          <div className="cm-section-head">
            <span className="cm-section-title">{title}</span>
          </div>
          <div className="cm-section-body">
            <Component />
          </div>
        </div>
      ))}

      <div className="cm-section">
        <MoneyChat />
      </div>

      <div className="cm-download-bar">
        <button className="cm-btn cm-btn-ghost" onClick={downloadTabData}>
          ↓ Esporta dati tab
        </button>
        <span className="cm-download-hint">JSON completo · per analisi con Claude Advisor</span>
      </div>
    </div>
  );
}
