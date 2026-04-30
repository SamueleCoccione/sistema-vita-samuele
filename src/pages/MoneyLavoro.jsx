import './MoneyLavoro.css';
import PageHero from '../components/PageHero';
import ObjectiveStatus from '../components/ObjectiveStatus';
import Patrimonio        from '../components/money-lavoro/Patrimonio';
import Transazioni       from '../components/money-lavoro/Transazioni';
import CRMClienti        from '../components/money-lavoro/CRMClienti';
import EsperimentiAttivi from '../components/money-lavoro/EsperimentiAttivi';
import BenessereLayout   from '../components/money-lavoro/BenessereLayout';
import MoneyChat         from '../components/money-lavoro/MoneyChat';
import { useFirebaseState } from '../hooks/useFirebaseState';

const SECTIONS = [
  { id: 'patrimonio',  title: 'Patrimonio',                   Component: Patrimonio        },
  { id: 'transazioni', title: 'Entrate & Uscite',             Component: Transazioni       },
  { id: 'crm',         title: 'Ricerca Clienti & Outreach',   Component: CRMClienti        },
  { id: 'esperimenti', title: 'Esperimenti attivi',           Component: EsperimentiAttivi },
  { id: 'benessere',   title: 'Benessere lavorativo',         Component: BenessereLayout   },
];

function triggerDownload(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

export default function MoneyLavoro() {
  const [patrimonio]      = useFirebaseState('ml_patrimonio',    {});
  const [transazioni]     = useFirebaseState('ml_transazioni',   []);
  const [entrateGoal]     = useFirebaseState('ml_entrate_goal',  0);
  const [entrate]         = useFirebaseState('ml_entrate',       []);
  const [uscite]          = useFirebaseState('ml_uscite',        []);
  const [budget]          = useFirebaseState('ml_budget',        {});
  const [crm]             = useFirebaseState('ml_crm',           []);
  const [crmOutreach]     = useFirebaseState('ml_crm_outreach',  []);
  const [pipeline]        = useFirebaseState('ml_pipeline',      []);
  const [outreach]        = useFirebaseState('ml_outreach',      []);
  const [esperimenti]     = useFirebaseState('ml_esperimenti',   []);
  const [benessere]       = useFirebaseState('ml_benessere',     {});
  const [chatMl]          = useFirebaseState('sv_chat_ml',       []);
  const [objStatus]       = useFirebaseState('ml_obj_status',    {});

  const downloadTabData = () => {
    triggerDownload({
      exported_at: new Date().toISOString(),
      tab: 'Money & Lavoro',
      sections: {
        stato_obiettivo:   objStatus,
        patrimonio:        patrimonio,
        transazioni:       transazioni,
        obiettivo_entrate: entrateGoal,
        entrate:           entrate,
        uscite:            uscite,
        budget:            budget,
        crm_clienti:       crm,
        crm_outreach:      crmOutreach,
        pipeline:          pipeline,
        outreach:          outreach,
        esperimenti:       esperimenti,
        benessere:         benessere,
        chat_claude:       chatMl,
      },
    }, `money-lavoro-${new Date().toISOString().split('T')[0]}.json`);
  };

  return (
    <div className="cm-page">
      <PageHero title="Money & Lavoro" />

      <div className="cm-section">
        <div className="cm-section-head">
          <span className="cm-section-title">Stato Obiettivo</span>
        </div>
        <div className="cm-section-body">
          <ObjectiveStatus
            tabKey="ml_obj_status"
            placeholder="Come ti senti sul lavoro e sui soldi oggi?"
          />
        </div>
      </div>

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
