import DailyJournal from '../../../components/corpo-mente/DailyJournal';
import './drawers.css';

export default function JournalDrawer() {
  return (
    <div className="dr-content">
      <section className="dr-section">
        <DailyJournal />
      </section>
    </div>
  );
}
