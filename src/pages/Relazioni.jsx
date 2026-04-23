import './Relazioni.css';
import PageHero        from '../components/PageHero';
import CuraPersonale   from '../components/relazioni/CuraPersonale';
import CuraCasa        from '../components/relazioni/CuraCasa';
import Compagna        from '../components/relazioni/Compagna';
import FamigliaAffetti from '../components/relazioni/FamigliaAffetti';
import TribuNetworking from '../components/relazioni/TribuNetworking';
import EnergiaSociale  from '../components/relazioni/EnergiaSociale';

const SECTIONS = [
  { id: 'cura-personale', title: 'Cura Personale',     Component: CuraPersonale   },
  { id: 'cura-casa',      title: 'Cura della Casa',    Component: CuraCasa        },
  { id: 'compagna',       title: 'Compagna',           Component: Compagna        },
  { id: 'famiglia',       title: 'Famiglia & Affetti', Component: FamigliaAffetti },
  { id: 'tribu',          title: 'Tribù & Networking', Component: TribuNetworking },
  { id: 'energia',        title: 'Energia Sociale',    Component: EnergiaSociale  },
];

function downloadTabData() {
  const safe = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const data = {
    exported_at: new Date().toISOString(),
    tab: 'Relazioni',
    sections: {
      cura_personale:  safe('rel_cura_personale'),
      cura_casa:       safe('rel_cura_casa'),
      compagna_daily:  safe('rel_compagna_daily'),
      compagna_note:   safe('rel_compagna_note'),
      famiglia:        safe('rel_famiglia'),
      tribu_persone:   safe('rel_tribu_persone'),
      tribu_eventi:    safe('rel_tribu_eventi'),
      energia_sociale: safe('rel_energia'),
    },
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), {
    href: url,
    download: `relazioni-${new Date().toISOString().split('T')[0]}.json`,
  }).click();
  URL.revokeObjectURL(url);
}

export default function Relazioni() {
  return (
    <div className="cm-page">
      <PageHero title="Relazioni" />

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
