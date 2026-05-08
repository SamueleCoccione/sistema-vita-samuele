import './MoneyLavoro.css';
import GrainMesh        from '../components/primitives/GrainMesh';
import MoneyHeroSection from '../components/money-lavoro/MoneyHeroSection';
import MoneyBentoGrid   from '../tabs/MoneyLavoro/MoneyBentoGrid';
import { EditModeProvider } from '../contexts/EditModeContext';
import { useFirebaseState } from '../hooks/useFirebaseState';

function triggerDownload(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

export default function MoneyLavoro() {
  const [patrimonio]  = useFirebaseState('ml_patrimonio',    {});
  const [transazioni] = useFirebaseState('ml_transazioni',   []);
  const [entrateGoal] = useFirebaseState('ml_entrate_goal',  0);
  const [entrate]     = useFirebaseState('ml_entrate',       []);
  const [uscite]      = useFirebaseState('ml_uscite',        []);
  const [budget]      = useFirebaseState('ml_budget',        {});
  const [crm]         = useFirebaseState('ml_crm',           []);
  const [crmOutreach] = useFirebaseState('ml_crm_outreach',  []);
  const [pipeline]    = useFirebaseState('ml_pipeline',      []);
  const [outreach]    = useFirebaseState('ml_outreach',      []);
  const [esperimenti] = useFirebaseState('ml_esperimenti',   []);
  const [benessere]   = useFirebaseState('ml_benessere',     {});
  const [objStatus]   = useFirebaseState('ml_obj_status',    {});

  const downloadTabData = () => {
    triggerDownload({
      exported_at: new Date().toISOString(),
      tab: 'Money & Lavoro',
      sections: {
        stato_obiettivo:   objStatus,
        patrimonio,
        transazioni,
        obiettivo_entrate: entrateGoal,
        entrate,
        uscite,
        budget,
        crm_clienti:       crm,
        crm_outreach:      crmOutreach,
        pipeline,
        outreach,
        esperimenti,
        benessere,
      },
    }, `money-lavoro-${new Date().toISOString().split('T')[0]}.json`);
  };

  return (
    <EditModeProvider>
      <div className="cm-page ml-page cm-page--mesh ml-page--mesh">
        <GrainMesh showAccent />
        <MoneyHeroSection />
        <div className="cm-bento-scrim" aria-hidden="true" />
        <div className="cm-bento-layer ml-bento-layer">
          <GrainMesh variant="muted" />
          <MoneyBentoGrid onExport={downloadTabData} />
        </div>
      </div>
    </EditModeProvider>
  );
}
