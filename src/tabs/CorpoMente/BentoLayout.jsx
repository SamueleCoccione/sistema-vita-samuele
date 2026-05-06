import WeightModule          from './modules/WeightModule';
import StravaStreakModule    from './modules/StravaStreakModule';
import NutritionTodayModule  from './modules/NutritionTodayModule';
import WeeklyGoalsModule     from './modules/WeeklyGoalsModule';
import SleepModule           from './modules/SleepModule';
import BooksModule           from './modules/BooksModule';
import FilmsModule           from './modules/FilmsModule';
import JournalModule         from './modules/JournalModule';
import PhotosModule          from './modules/PhotosModule';
import BodyMeasuresModule    from './modules/BodyMeasuresModule';
import WeeklyAwarenessModule from './modules/WeeklyAwarenessModule';
import './BentoLayout.css';

/* Placeholder statico — verrà sostituito da BentoGrid con dnd-kit */
const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 1.5v7M3.5 6l3 3 3-3M1.5 11h10"/>
  </svg>
);

export default function BentoLayout({ onExport }) {
  return (
    <section className="bento-section">
      <div className="bento-static-grid">
        <div data-size="L"><WeightModule /></div>
        <div data-size="S"><StravaStreakModule /></div>
        <div data-size="S"><NutritionTodayModule /></div>
        <div data-size="S"><WeeklyGoalsModule /></div>
        <div data-size="S"><SleepModule /></div>
        <div data-size="M"><BooksModule /></div>
        <div data-size="M"><FilmsModule /></div>
        <div data-size="M"><JournalModule /></div>
        <div data-size="M"><PhotosModule /></div>
        <div data-size="M"><BodyMeasuresModule /></div>
        <div data-size="M"><WeeklyAwarenessModule /></div>
      </div>
      <div className="bento-export-row">
        <button className="bento-export-btn" onClick={onExport}>
          <DownloadIcon />
          Esporta dati tab
        </button>
        <p className="bento-export-hint">JSON · foto escluse · per analisi con Claude</p>
      </div>
    </section>
  );
}
