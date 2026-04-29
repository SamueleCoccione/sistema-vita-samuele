import './CorpoMente.css';
import PageHero        from '../components/PageHero';
import ObjectiveStatus from '../components/ObjectiveStatus';

export default function ProgettoDigitale() {
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
    </div>
  );
}
