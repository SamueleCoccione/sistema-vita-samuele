import './CorpoMente.css';
import PageHero        from '../components/PageHero';
import ObjectiveStatus from '../components/ObjectiveStatus';
import { useFirebaseState } from '../hooks/useFirebaseState';

function triggerDownload(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

export default function ProgettoDigitale() {
  const [objStatus] = useFirebaseState('pd_obj_status', {});

  const downloadTabData = () => {
    triggerDownload({
      exported_at: new Date().toISOString(),
      tab: 'Progetto Digitale',
      sections: {
        stato_obiettivo: objStatus,
      },
    }, `progetto-digitale-${new Date().toISOString().split('T')[0]}.json`);
  };

  return (
    <div className="cm-page">
      <PageHero title="Progetto Digitale" />

      <div className="cm-section">
        <div className="cm-section-head">
          <span className="cm-section-title">Stato Obiettivo</span>
        </div>
        <div className="cm-section-body">
          <ObjectiveStatus
            tabKey="pd_obj_status"
            placeholder="Dove sei col tuo progetto creativo?"
          />
        </div>
      </div>

      <div className="cm-download-bar">
        <button className="cm-btn cm-btn-ghost" onClick={downloadTabData}>↓ Esporta dati tab</button>
        <span className="cm-download-hint">JSON completo · per analisi con Claude Advisor</span>
      </div>
    </div>
  );
}
