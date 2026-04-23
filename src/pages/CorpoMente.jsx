import './CorpoMente.css';
import PageHero from '../components/PageHero';
import WeeklyGoals from '../components/corpo-mente/WeeklyGoals';
import ProgressiCorpo from '../components/corpo-mente/ProgressiCorpo';
import WeightTracker from '../components/corpo-mente/WeightTracker';
import StravaTracker from '../components/corpo-mente/StravaTracker';
import BookTracker from '../components/corpo-mente/BookTracker';
import ClaudeChat from '../components/corpo-mente/ClaudeChat';
import DailyJournal from '../components/corpo-mente/DailyJournal';

const SECTIONS = [
  { id: 'goals',     title: 'Obiettivi settimana', Component: WeeklyGoals    },
  { id: 'progressi', title: 'Progressi Corpo',     Component: ProgressiCorpo },
  { id: 'weight',    title: 'Peso',                Component: WeightTracker  },
  { id: 'strava',    title: 'Rucking — Strava',    Component: StravaTracker  },
  { id: 'books',     title: 'Book Tracker',        Component: BookTracker    },
  { id: 'journal',   title: 'Daily Journal',       Component: DailyJournal   },
];

function downloadTabData() {
  const safe = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };

  const books = (safe('sv_books_v2') || []).map(({ cover, ...b }) => ({
    ...b, cover: cover ? '[immagine omessa]' : null,
  }));
  const photos = (safe('sv_progressi_photos') || []).map(({ front, side, ...p }) => ({
    ...p, hasFront: !!front, hasSide: !!side,
  }));

  const data = {
    exported_at: new Date().toISOString(),
    tab: 'Corpo & Mente',
    sections: {
      obiettivi_settimanali: safe('sv_weekly_goals'),
      settimana_corrente: safe('sv_weekly_goals_week'),
      misure_corpo: safe('sv_body_measures'),
      foto_progressi_sessioni: photos,
      storico_peso: safe('sv_weight'),
      libri: books,
      obiettivo_libri_anno: safe('sv_book_goal'),
      journal: safe('sv_daily_journal'),
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `corpo-mente-${new Date().toISOString().split('T')[0]}.json`,
  });
  a.click();
  URL.revokeObjectURL(url);
}

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

      <div className="cm-download-bar">
        <button className="cm-btn cm-btn-ghost" onClick={downloadTabData}>
          ↓ Esporta dati tab
        </button>
        <span className="cm-download-hint">JSON · foto escluse · per analisi con Claude</span>
      </div>
    </div>
  );
}
