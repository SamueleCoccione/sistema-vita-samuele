import { useMemo } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

function getMondayStr(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function avg(arr) {
  if (!arr.length) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function computeInsights(activities, journal, sleep, weight) {

  // Build last 8 weeks (most recent first)
  const weekData = [];
  let monday = getMondayStr();
  for (let i = 0; i < 8; i++) {
    const sunday = addDays(monday, 6);
    const rucking = activities.filter(a => a.date >= monday && a.date <= sunday).length;

    const moodEntries = journal.filter(j => j.date >= monday && j.date <= sunday && j.mood != null);
    const avgMood     = moodEntries.length ? avg(moodEntries.map(j => j.mood)) : null;

    const sleepEntries = sleep.filter(s => s.date >= monday && s.date <= sunday);
    const avgH  = sleepEntries.length ? avg(sleepEntries.map(s => s.hours))                       : null;
    const qualArr = sleepEntries.filter(s => s.quality != null).map(s => s.quality);
    const avgQ  = qualArr.length ? avg(qualArr) : null;

    const weightEntry = weight.filter(w => w.date >= monday && w.date <= sunday).at(-1);

    weekData.push({
      monday,
      rucking,
      avgMood,
      avgHours:   avgH,
      avgQuality: avgQ,
      weight:     weightEntry?.weight ?? null,
    });

    monday = addDays(monday, -7);
  }

  // Detect patterns
  const patterns = [];

  // Rucking vs mood
  const highRuck = weekData.filter(w => w.rucking >= 6 && w.avgMood != null);
  const lowRuck  = weekData.filter(w => w.rucking < 4  && w.avgMood != null);
  if (highRuck.length >= 2 && lowRuck.length >= 2) {
    const hi = avg(highRuck.map(w => w.avgMood));
    const lo = avg(lowRuck.map(w => w.avgMood));
    patterns.push({
      text: `Nelle settimane con 6+ rucking, lo stato d'animo medio è stato ${hi.toFixed(1)}. Nelle settimane con meno di 4 sessioni è stato ${lo.toFixed(1)}.`,
    });
  }

  // Sleep vs mood
  const goodSleep = weekData.filter(w => w.avgHours != null && w.avgHours >= 7 && w.avgMood != null);
  const badSleep  = weekData.filter(w => w.avgHours != null && w.avgHours < 6  && w.avgMood != null);
  if (goodSleep.length >= 2 && badSleep.length >= 2) {
    const hi = avg(goodSleep.map(w => w.avgMood));
    const lo = avg(badSleep.map(w => w.avgMood));
    patterns.push({
      text: `Con 7+ ore di sonno medio settimanale, umore ${hi.toFixed(1)}/10. Con meno di 6 ore, umore ${lo.toFixed(1)}/10.`,
    });
  }

  // Not enough data
  if (!patterns.length) {
    const hasMood    = weekData.some(w => w.avgMood != null);
    const hasSleep   = weekData.some(w => w.avgHours != null);
    const hasRucking = weekData.some(w => w.rucking > 0);
    if (!hasMood) {
      patterns.push({ text: 'Aggiungi lo stato d\'animo nel Journal per sbloccare le correlazioni con rucking e sonno.' });
    } else if (!hasSleep && !hasRucking) {
      patterns.push({ text: 'Registra sonno e attività Strava per almeno 2 settimane per vedere i pattern.' });
    } else {
      patterns.push({ text: 'Servono almeno 2 settimane di dati per ogni categoria per mostrare correlazioni significative.' });
    }
  }

  return { weekData: weekData.slice(0, 4), allWeekData: weekData, patterns };
}

function fmtWeek(monday) {
  return new Date(monday + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short',
  });
}

export default function WeeklyInsights({ preview = false }) {
  const [activities] = useFirebaseState('sv_strava_activities', []);
  const [journal]    = useFirebaseState('sv_daily_journal', []);
  const [sleep]      = useFirebaseState('sv_sleep', []);
  const [weight]     = useFirebaseState('sv_weight', []);

  const { weekData, patterns } = useMemo(
    () => computeInsights(activities, journal, sleep, weight),
    [activities, journal, sleep, weight]
  );

  const current = weekData[0];
  const hasAnyData = weekData.some(w =>
    w.rucking > 0 || w.avgMood != null || w.avgHours != null
  );

  if (preview) {
    if (!hasAnyData) return null;
    return (
      <div className="ins-preview">
        <div className="cm-label" style={{ marginBottom: 8 }}>Settimana corrente</div>
        <div className="ins-preview-stats">
          {current.rucking > 0 && <span>{current.rucking} rucking</span>}
          {current.avgMood  != null && <span>umore {current.avgMood.toFixed(1)}/10</span>}
          {current.avgHours != null && <span>{current.avgHours.toFixed(1)}h sonno</span>}
          {current.weight   != null && <span>{current.weight}kg</span>}
        </div>
        {patterns[0] && !patterns[0].text.startsWith('Aggiungi') && !patterns[0].text.startsWith('Registra') && !patterns[0].text.startsWith('Servono') && (
          <div className="ins-pattern ins-pattern-sm" style={{ marginTop: 10 }}>
            {patterns[0].text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Weekly cards — last 4 weeks */}
      <div className="ins-cards">
        {weekData.map((w, i) => (
          <div key={w.monday} className="ins-card">
            <div className="ins-card-week">
              {i === 0 ? 'Questa settimana' : `Sett. del ${fmtWeek(w.monday)}`}
            </div>
            <div className="ins-card-stats">
              <div className="ins-card-stat">
                <span className="cm-label">Rucking</span>
                <span className="ins-card-val">{w.rucking}</span>
              </div>
              {w.avgMood != null && (
                <div className="ins-card-stat">
                  <span className="cm-label">Umore</span>
                  <span className="ins-card-val">{w.avgMood.toFixed(1)}</span>
                </div>
              )}
              {w.avgHours != null && (
                <div className="ins-card-stat">
                  <span className="cm-label">Sonno</span>
                  <span className="ins-card-val">{w.avgHours.toFixed(1)}h</span>
                </div>
              )}
              {w.avgQuality != null && (
                <div className="ins-card-stat">
                  <span className="cm-label">Qualità</span>
                  <span className="ins-card-val">{w.avgQuality.toFixed(1)}</span>
                </div>
              )}
              {w.weight != null && (
                <div className="ins-card-stat">
                  <span className="cm-label">Peso</span>
                  <span className="ins-card-val">{w.weight}kg</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Patterns */}
      <div className="cm-label" style={{ marginBottom: 14 }}>Pattern rilevati</div>
      {patterns.map((p, i) => (
        <div key={i} className="ins-pattern">{p.text}</div>
      ))}
    </div>
  );
}
