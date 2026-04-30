import './Relazioni.css';
import PageHero        from '../components/PageHero';
import ObjectiveStatus from '../components/ObjectiveStatus';
import CuraPersonale   from '../components/relazioni/CuraPersonale';
import CuraCasa        from '../components/relazioni/CuraCasa';
import Compagna        from '../components/relazioni/Compagna';
import FamigliaAffetti from '../components/relazioni/FamigliaAffetti';
import TribuNetworking from '../components/relazioni/TribuNetworking';
import EnergiaSociale  from '../components/relazioni/EnergiaSociale';
import { useFirebaseState } from '../hooks/useFirebaseState';

const SECTIONS = [
  { id: 'cura-personale', title: 'Cura Personale',     Component: CuraPersonale   },
  { id: 'cura-casa',      title: 'Cura della Casa',    Component: CuraCasa        },
  { id: 'compagna',       title: 'Compagna',           Component: Compagna        },
  { id: 'famiglia',       title: 'Famiglia & Affetti', Component: FamigliaAffetti },
  { id: 'tribu',          title: 'Tribù & Networking', Component: TribuNetworking },
  { id: 'energia',        title: 'Energia Sociale',    Component: EnergiaSociale  },
];

function triggerDownload(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

export default function Relazioni() {
  const [curaPersonale]  = useFirebaseState('rel_cura_personale',  []);
  const [curaCasa]       = useFirebaseState('rel_cura_casa',       []);
  const [compagnaDaily]  = useFirebaseState('rel_compagna_daily',  []);
  const [compagnaNotes]  = useFirebaseState('rel_compagna_note',   []);
  const [famiglia]       = useFirebaseState('rel_famiglia',        []);
  const [tribuPersone]   = useFirebaseState('rel_tribu_persone',   []);
  const [tribuEventi]    = useFirebaseState('rel_tribu_eventi',    []);
  const [energia]        = useFirebaseState('rel_energia',         {});
  const [objStatus]      = useFirebaseState('rel_obj_status',      {});

  const downloadTabData = () => {
    triggerDownload({
      exported_at: new Date().toISOString(),
      tab: 'Relazioni',
      sections: {
        stato_obiettivo:  objStatus,
        cura_personale:   curaPersonale,
        cura_casa:        curaCasa,
        compagna_daily:   compagnaDaily,
        compagna_note:    compagnaNotes,
        famiglia:         famiglia,
        tribu_persone:    tribuPersone,
        tribu_eventi:     tribuEventi,
        energia_sociale:  energia,
      },
    }, `relazioni-${new Date().toISOString().split('T')[0]}.json`);
  };

  return (
    <div className="cm-page">
      <PageHero title="Relazioni" />

      <div className="cm-section">
        <div className="cm-section-head">
          <span className="cm-section-title">Stato Obiettivo</span>
        </div>
        <div className="cm-section-body">
          <ObjectiveStatus
            tabKey="rel_obj_status"
            placeholder="Come stai nelle relazioni che contano?"
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

      <div className="cm-download-bar">
        <button className="cm-btn cm-btn-ghost" onClick={downloadTabData}>↓ Esporta dati tab</button>
        <span className="cm-download-hint">JSON completo · per analisi con Claude Advisor</span>
      </div>
    </div>
  );
}
