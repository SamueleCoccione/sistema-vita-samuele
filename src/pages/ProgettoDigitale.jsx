import './ProgettoDigitale.css';
import './CorpoMente.css';
import GrainMesh   from '../components/primitives/GrainMesh';
import HeroSection from '../tabs/MillennialBug/HeroSection';
import BentoGrid   from '../tabs/MillennialBug/BentoGrid';
import { useFirebaseState } from '../hooks/useFirebaseState';

function triggerDownload(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

export default function ProgettoDigitale() {
  const [objStatus]     = useFirebaseState('pd_obj_status',          {});
  const [pubblicazioni] = useFirebaseState('pd_pubblicazioni',        []);
  const [bozze]         = useFirebaseState('pd_bozze',                []);
  const [calendario]    = useFirebaseState('pd_calendario',            []);
  const [journalProj]   = useFirebaseState('pd_journal_progetto',     []);
  const [checks]        = useFirebaseState('pd_check_ciclo',           []);
  const [apprendim]     = useFirebaseState('pd_apprendimenti_voce',    []);
  const [radici]        = useFirebaseState('pd_radici_settimanali',    []);
  const [nordStella]    = useFirebaseState('pd_nord_stella',           {});
  const [metriche]      = useFirebaseState('pd_metriche_risultato',    []);

  const downloadTabData = () => {
    triggerDownload({
      exported_at: new Date().toISOString(),
      tab: 'Millennial Bug',
      sections: {
        stato_obiettivo:       objStatus,
        nord_stella:           nordStella,
        pubblicazioni,
        bozze_e_idee:          bozze,
        calendario_editoriale: calendario,
        journal_progetto:      journalProj,
        check_di_ciclo:        checks,
        metriche_risultato:    metriche,
        apprendimenti_voce:    apprendim,
        radici_settimanali:    radici,
      },
    }, `millennial-bug-${new Date().toISOString().split('T')[0]}.json`);
  };

  return (
    <div className="cm-page cm-page--mesh mb-page">
      <GrainMesh showAccent />
      <HeroSection />
      <div className="cm-bento-scrim" aria-hidden="true" />
      <BentoGrid onExport={downloadTabData} />
    </div>
  );
}
