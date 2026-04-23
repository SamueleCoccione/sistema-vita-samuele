import './CorpoMente.css';
import PageHero from '../components/PageHero';
import WeeklyGoals from '../components/corpo-mente/WeeklyGoals';
import ProgressiCorpo from '../components/corpo-mente/ProgressiCorpo';
import WeightTracker from '../components/corpo-mente/WeightTracker';
import StravaTracker from '../components/corpo-mente/StravaTracker';
import BookTracker from '../components/corpo-mente/BookTracker';
import ClaudeChat from '../components/corpo-mente/ClaudeChat';

const SECTIONS = [
  { id: 'goals',     title: 'Obiettivi settimana', Component: WeeklyGoals    },
  { id: 'progressi', title: 'Progressi Corpo',     Component: ProgressiCorpo },
  { id: 'weight',    title: 'Peso',                Component: WeightTracker  },
  { id: 'strava',    title: 'Rucking — Strava',    Component: StravaTracker  },
  { id: 'books',     title: 'Book Tracker',        Component: BookTracker    },
];

export default function CorpoMente() {
  return (
    <div className="cm-page">
      <PageHero title="Corpo & Mente" />

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
        <ClaudeChat />
      </div>
    </div>
  );
}
