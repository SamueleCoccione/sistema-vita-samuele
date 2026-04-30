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
import { useFirebaseState } from '../hooks/useFirebaseState';

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

function triggerDownload(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

export default function CorpoMente() {
  const [weeklyGoals]      = useFirebaseState('sv_weekly_goals',       []);
  const [weeklyGoalsWeek]  = useFirebaseState('sv_weekly_goals_week',  '');
  const [bodyMeasures]     = useFirebaseState('sv_body_measures',      []);
  const [progressiPhotos]  = useFirebaseState('sv_progressi_photos',   []);
  const [weight]           = useFirebaseState('sv_weight',             []);
  const [stravaActivities] = useFirebaseState('sv_strava_activities',  []);
  const [nutritionProfile] = useFirebaseState('sv_nutrition_profile',  {});
  const [nutrition]        = useFirebaseState('sv_nutrition',          []);
  const [books]            = useFirebaseState('sv_books_v2',           []);
  const [bookGoal]         = useFirebaseState('sv_book_goal',          1);
  const [films]            = useFirebaseState('sv_films_v1',           []);
  const [filmGoal]         = useFirebaseState('sv_film_goal',          8);
  const [journal]          = useFirebaseState('sv_daily_journal',      []);
  const [awareness]        = useFirebaseState('sv_weekly_awareness',   []);
  const [chatCm]           = useFirebaseState('sv_chat_cm',            []);
  const [objStatus]        = useFirebaseState('sv_obj_status',         {});

  const downloadTabData = () => {
    const cleanBooks = books.map(({ cover, ...b }) => ({
      ...b, cover: cover ? '[immagine omessa]' : null,
    }));
    const cleanPhotos = progressiPhotos.map(({ front, side, ...p }) => ({
      ...p, hasFront: !!front, hasSide: !!side,
    }));
    const filmFields = f => ({
      titolo:              f.title       || '',
      regista:             f.director    || '',
      anno:                f.year        || '',
      genere:              f.genre       || '',
      piattaforma:         f.platform    || '',
      data_visione:        f.watchedDate || '',
      rating:              f.rating      ?? null,
      mood:                f.mood        || '',
      note:                f.notes       || '',
      cosa_mi_ha_lasciato: f.impression  || '',
      citazione:           f.quote       || '',
    });
    const filmVisti    = films.filter(f => f.status === 'watched' || f.status === 'abandoned').map(filmFields);
    const filmDaVedere = films.filter(f => f.status === 'to-watch').map(f => ({
      titolo:   f.title         || '',
      regista:  f.director      || '',
      anno:     f.year          || '',
      genere:   f.genre         || '',
      priorita: f.priority      ?? 2,
      nota:     f.watchlistNote || '',
    }));

    triggerDownload({
      exported_at: new Date().toISOString(),
      tab: 'Corpo & Mente',
      sections: {
        stato_obiettivo:         objStatus,
        obiettivi_settimanali:   weeklyGoals,
        settimana_corrente:      weeklyGoalsWeek,
        misure_corpo:            bodyMeasures,
        foto_progressi_sessioni: cleanPhotos,
        storico_peso:            weight,
        attivita_strava:         stravaActivities,
        nutrizione_profilo:      nutritionProfile,
        nutrizione_voci:         nutrition,
        libri:                   cleanBooks,
        obiettivo_libri_anno:    bookGoal,
        film_visti:              filmVisti,
        film_da_vedere:          filmDaVedere,
        obiettivo_film_anno:     filmGoal,
        journal:                 journal,
        consapevolezza:          awareness,
        chat_claude:             chatCm,
      },
    }, `corpo-mente-${new Date().toISOString().split('T')[0]}.json`);
  };

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
