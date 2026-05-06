import './CorpoMente.css';
import HeroSection from '../tabs/CorpoMente/HeroSection';
import BentoGrid   from '../tabs/CorpoMente/BentoGrid';
import GrainMesh   from '../components/primitives/GrainMesh';
import { EditModeProvider } from '../contexts/EditModeContext';
import { useFirebaseState } from '../hooks/useFirebaseState';

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
      },
    }, `corpo-mente-${new Date().toISOString().split('T')[0]}.json`);
  };

  return (
    <EditModeProvider>
      <div className="cm-page cm-page--mesh">
        <GrainMesh showAccent />
        <HeroSection />
        <div className="cm-bento-scrim" aria-hidden="true" />
        <div className="cm-bento-layer">
          <GrainMesh variant="muted" />
          <BentoGrid onExport={downloadTabData} />
        </div>
      </div>
    </EditModeProvider>
  );
}
