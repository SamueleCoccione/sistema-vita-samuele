import './Liberta.css';
import RemoteHeader    from '../components/liberta/RemoteHeader';
import ObjectiveStatus from '../components/ObjectiveStatus';
import DoveHoLavorato from '../components/liberta/DoveHoLavorato';
import SkillRemote from '../components/liberta/SkillRemote';
import PipelineRemote from '../components/liberta/PipelineRemote';
import EsperimentiRemote from '../components/liberta/EsperimentiRemote';
import SistemaXP from '../components/liberta/SistemaXP';
import IlMioPerche from '../components/liberta/IlMioPerche';
import LibertaChat from '../components/liberta/LibertaChat';

const SECTIONS = [
  { id: 'dove',       title: 'Dove ho lavorato',        component: DoveHoLavorato },
  { id: 'skill',      title: 'Skill Remote',             component: SkillRemote },
  { id: 'pipeline',   title: 'Pipeline Remoto',          component: PipelineRemote },
  { id: 'esperimenti',title: 'Esperimenti',              component: EsperimentiRemote },
  { id: 'xp',         title: 'Sistema XP',               component: SistemaXP },
  { id: 'perche',     title: 'Il mio perché',            component: IlMioPerche },
  { id: 'chat',       title: 'Strategia Remoto — Chat',  component: LibertaChat },
];

export default function Liberta() {
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
    </div>
  );
}
