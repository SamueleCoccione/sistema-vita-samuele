import './CorpoMente.css';
import PageHero from '../components/PageHero';
import ObjectiveStatus from '../components/ObjectiveStatus';
import WeeklyInsights from '../components/corpo-mente/WeeklyInsights';
import WeeklyGoals from '../components/corpo-mente/WeeklyGoals';
import ProgressiCorpo from '../components/corpo-mente/ProgressiCorpo';
import WeightTracker from '../components/corpo-mente/WeightTracker';
import NutritionTracker from '../components/corpo-mente/NutritionTracker';
import StravaTracker from '../components/corpo-mente/StravaTracker';
import BookTracker from '../components/corpo-mente/BookTracker';
import FilmTracker from '../components/corpo-mente/FilmTracker';
import ClaudeChat from '../components/corpo-mente/ClaudeChat';
import DailyJournal from '../components/corpo-mente/DailyJournal';
import WeeklyAwareness from '../components/corpo-mente/WeeklyAwareness';

const SECTIONS = [
  { id: 'goals',     title: 'Obiettivi settimana',        Component: WeeklyGoals    },
  { id: 'progressi', title: 'Progressi Corpo',            Component: ProgressiCorpo },
  { id: 'weight',    title: 'Peso',                       Component: WeightTracker  },
  { id: 'nutrition', title: 'Nutrizione',                 Component: NutritionTracker},
  { id: 'strava',    title: 'Rucking — Strava',           Component: StravaTracker  },
  { id: 'books',     title: 'Book Tracker',               Component: BookTracker    },
  { id: 'films',     title: 'Film Tracker',               Component: FilmTracker    },
  { id: 'journal',   title: 'Daily Journal',              Component: DailyJournal   },
  { id: 'awareness', title: 'Consapevolezza settimanale', Component: WeeklyAwareness},
];

function downloadTabData() {
  const safe = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };

  const books = (safe('sv_books_v2') || []).map(({ cover, ...b }) => ({
    ...b, cover: cover ? '[immagine omessa]' : null,
  }));
  const films = (safe('sv_films_v1') || []).map(({ poster, posterColor, ...f }) => ({
    ...f, poster: poster ? '[immagine omessa]' : null,
  }));
  const photos = (safe('sv_progressi_photos') || []).map(({ front, side, ...p }) => ({
    ...p, hasFront: !!front, hasSide: !!side,
  }));

  const data = {
    exported_at: new Date().toISOString(),
    tab: 'Corpo & Mente',
    sections: {
      obiettivi_settimanali:   safe('sv_weekly_goals'),
      settimana_corrente:      safe('sv_weekly_goals_week'),
      misure_corpo:            safe('sv_body_measures'),
      foto_progressi_sessioni: photos,
      storico_peso:            safe('sv_weight'),
      attivita_strava:         safe('sv_strava_activities'),
      nutrizione_profilo:      safe('sv_nutrition_profile'),
      nutrizione_voci:         safe('sv_nutrition'),
      libri:                   books,
      obiettivo_libri_anno:    safe('sv_book_goal'),
      film:                    films,
      journal:                 safe('sv_daily_journal'),
      consapevolezza:          safe('sv_weekly_awareness'),
      chat_claude:             safe('sv_chat_cm'),
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

      {/* ── Stato obiettivo ── */}
      <div className="cm-section">
        <div className="cm-section-head">
          <span className="cm-section-title">Stato Obiettivo</span>
        </div>
        <div className="cm-section-body">
          <ObjectiveStatus
            tabKey="sv_obj_status"
            placeholder="Come stai nel corpo e nella mente oggi?"
          />
        </div>
      </div>

      {/* ── Insight settimana — box espandibile in cima ── */}
      <WeeklyInsights />

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
