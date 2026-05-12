import PubblicazioniModule from './modules/PubblicazioniModule';
import CalendarioModule    from './modules/CalendarioModule';
import BozzeModule         from './modules/BozzeModule';
import JournalModule       from './modules/JournalModule';
import VoceModule          from './modules/VoceModule';
import CicloModule         from './modules/CicloModule';
import GrainMesh           from '../../components/primitives/GrainMesh';
import './BentoGrid.css';

const DownloadIcon = () => (
  <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 1.5v7M3.5 6l3 3 3-3M1.5 11h10"/>
  </svg>
);

export default function BentoGrid({ onExport }) {
  return (
    <section className="mb-bento-section">
      <div className="mb-bento-topbar">
        <span className="mb-bento-topbar-spacer" />
        <button className="mb-bento-export-btn" onClick={onExport}>
          <DownloadIcon />
          Esporta dati tab
        </button>
      </div>

      <div className="mb-bento-layer">
        <GrainMesh variant="muted" />
        <div className="mb-bento-grid">
          <PubblicazioniModule />
          <CalendarioModule    />
          <BozzeModule         />
          <JournalModule       />
          <VoceModule          />
          <CicloModule         />
        </div>
      </div>
    </section>
  );
}
