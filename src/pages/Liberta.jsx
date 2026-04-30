import './Liberta.css';
import RemoteHeader      from '../components/liberta/RemoteHeader';
import ObjectiveStatus   from '../components/ObjectiveStatus';
import DoveHoLavorato    from '../components/liberta/DoveHoLavorato';
import SkillRemote       from '../components/liberta/SkillRemote';
import PipelineRemote    from '../components/liberta/PipelineRemote';
import EsperimentiRemote from '../components/liberta/EsperimentiRemote';
import SistemaXP         from '../components/liberta/SistemaXP';
import IlMioPerche       from '../components/liberta/IlMioPerche';
import LibertaChat       from '../components/liberta/LibertaChat';
import { useFirebaseState } from '../hooks/useFirebaseState';

const SECTIONS = [
  { id: 'dove',        title: 'Dove ho lavorato',       component: DoveHoLavorato    },
  { id: 'skill',       title: 'Skill Remote',           component: SkillRemote       },
  { id: 'pipeline',    title: 'Pipeline Remoto',        component: PipelineRemote    },
  { id: 'esperimenti', title: 'Esperimenti',            component: EsperimentiRemote },
  { id: 'xp',          title: 'Sistema XP',             component: SistemaXP         },
  { id: 'perche',      title: 'Il mio perché',          component: IlMioPerche       },
  { id: 'chat',        title: 'Strategia Remoto — Chat',component: LibertaChat       },
];

function triggerDownload(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

export default function Liberta() {
  const [locations]       = useFirebaseState('lib_locations',       []);
  const [workdays]        = useFirebaseState('lib_workdays',        []);
  const [remoteGoal]      = useFirebaseState('lib_remote_goal',     0);
  const [skills]          = useFirebaseState('lib_skills',          []);
  const [skillGoal]       = useFirebaseState('lib_skill_goal',      '');
  const [studyLog]        = useFirebaseState('lib_study_log',       []);
  const [platforms]       = useFirebaseState('lib_platforms',       []);
  const [remoteClients]   = useFirebaseState('lib_remote_clients',  []);
  const [expRemote]       = useFirebaseState('lib_exp_remote',      []);
  const [xpLog]           = useFirebaseState('lib_xp_log',          []);
  const [perche]          = useFirebaseState('lib_perche',          '');
  const [chatLib]         = useFirebaseState('sv_chat_lib',         []);
  const [objStatus]       = useFirebaseState('lib_obj_status',      {});

  const downloadTabData = () => {
    triggerDownload({
      exported_at: new Date().toISOString(),
      tab: 'Libertà',
      sections: {
        stato_obiettivo:  objStatus,
        luoghi_lavorati:  locations,
        workdays:         workdays,
        obiettivo_remote: remoteGoal,
        skills:           skills,
        obiettivo_skill:  skillGoal,
        studio_log:       studyLog,
        piattaforme:      platforms,
        clienti_remote:   remoteClients,
        esperimenti:      expRemote,
        xp_log:           xpLog,
        il_mio_perche:    perche,
        chat_claude:      chatLib,
      },
    }, `liberta-${new Date().toISOString().split('T')[0]}.json`);
  };

  return (
    <div className="lb-page">
      <RemoteHeader />

      <div className="lb-sections">
        <section className="cm-section lb-section">
          <div className="cm-section-head">
            <div className="cm-section-title">Stato Obiettivo</div>
          </div>
          <div className="cm-section-body">
            <ObjectiveStatus
              tabKey="lib_obj_status"
              placeholder="Quanto ti senti libero oggi?"
            />
          </div>
        </section>

        {SECTIONS.map(({ id, title, component: Comp }) => (
          <section key={id} className="cm-section lb-section">
            <div className="cm-section-head">
              <div className="cm-section-title">{title}</div>
            </div>
            <div className="cm-section-body">
              <Comp />
            </div>
          </section>
        ))}
      </div>

      <div className="cm-download-bar">
        <button className="cm-btn cm-btn-ghost" onClick={downloadTabData}>↓ Esporta dati tab</button>
        <span className="cm-download-hint">JSON completo · per analisi con Claude Advisor</span>
      </div>
    </div>
  );
}
