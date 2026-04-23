import './Dashboard.css';
import PageHero from '../components/PageHero';
import DailyCheckin from '../components/dashboard/DailyCheckin';

export default function Dashboard() {
  return (
    <div>
      <PageHero title="Dashboard" />
      <div className="db-page">
        <div className="db-section">
          <span className="db-section-title">Corpo &amp; Mente — Oggi</span>
          <DailyCheckin />
        </div>
      </div>
    </div>
  );
}
