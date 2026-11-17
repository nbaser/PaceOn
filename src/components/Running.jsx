import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, ReferenceLine } from 'recharts';
import { C, Stat, Panel, ZoneBar, ZoneLegend, tipStyle, shortDate, fmtPace, Empty } from './ui';

export default function Running({ sessions }) {
  const run = sessions.filter((s) => s.sport === 'running');
  if (!run.length) return <Empty t="Keine Lauf-Einheiten in diesem Bestand." />;
  const effData = run.map((s) => ({ d: shortDate(s.date), EF: s.ef, decoupling: s.decoupling, pace: s.paceMinKm }));
  const bestDist = run.reduce((best, s) => (s.distanceKm != null && s.distanceKm > (best?.distanceKm ?? -Infinity) ? s : best), null);

  const cutoff30 = new Date();
  cutoff30.setDate(cutoff30.getDate() - 30);
  const recentRuns = run
    .filter((s) => s.paceMinKm != null && s.date && new Date(s.date) >= cutoff30)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  let paceTrend = null;
  if (recentRuns.length >= 2) {
    const mid = Math.ceil(recentRuns.length / 2);
    const avg = (arr) => arr.reduce((a, s) => a + s.paceMinKm, 0) / arr.length;
    paceTrend = avg(recentRuns.slice(mid)) - avg(recentRuns.slice(0, mid));
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <Stat
          label="Schnellste Ø-Pace"
          value={fmtPace(Math.min(...run.map((s) => s.paceMinKm).filter((p) => p != null)))}
          unit="/km"
          accent={C.run}
          info="Die schnellste Durchschnittspace unter allen Lauf-Einheiten."
        />
        <Stat
          label="Gesamt-Distanz"
          value={run.reduce((a, s) => a + s.distanceKm, 0).toFixed(1)}
          unit="km"
          hint={`${run.length} Läufe`}
          info="Summe aller gelaufenen Kilometer im Bestand."
        />
        <Stat
          label="Ø Kadenz"
          value={Math.round(run.reduce((a, s) => a + (s.cadenceSpm || 0), 0) / run.length)}
          unit="spm"
          info="Mittlere Schrittfrequenz über alle Läufe (korrigiert, da Zepp-Geräte die Kadenz halbiert liefern)."
        />
        <Stat
          label="Ø Effizienz (EF)"
          value={
            run.some((s) => s.ef != null)
              ? (run.reduce((a, s) => a + (s.ef || 0), 0) / run.filter((s) => s.ef != null).length).toFixed(2)
              : '–'
          }
          hint="höher = besser"
          accent={C.sand}
          info="Efficiency Factor (Pace/HF) – höhere Werte zeigen eine bessere aerobe Effizienz."
        />
        {bestDist && (
          <Stat
            label="Längste Distanz"
            value={bestDist.distanceKm}
            unit="km"
            hint={shortDate(bestDist.date)}
            accent={C.run}
            info="Die weiteste in einer einzelnen Einheit gelaufene Distanz."
          />
        )}
      </div>

      <Panel
        title="Intensitäts-Warnung"
        note="Beim Grundlagenaufbau sollten die meisten Läufe überwiegend in Z1–Z2 liegen. Viel Zeit in Z4–Z5 ist klassisches 'zu hart gelaufen' und bremst den aeroben Aufbau, weil die lockeren Reize fehlen."
      >
        <ZoneLegend />
        {run.map((s, i) => {
          const tot = s.hrZoneSeconds.reduce((a, b) => a + b, 0) || 1;
          const hard = ((s.hrZoneSeconds[3] + s.hrZoneSeconds[4]) / tot) * 100;
          return (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: C.sub, marginBottom: 4 }}>
                <span>
                  {s.startTime?.slice(0, 16).replace('T', ' ')} · {s.distanceKm} km · Pace {fmtPace(s.paceMinKm)}/km
                </span>
                <span style={{ color: hard > 40 ? C.coral : C.sub, fontWeight: 600 }}>{Math.round(hard)}% in Z4–Z5</span>
              </div>
              <ZoneBar seconds={s.hrZoneSeconds} showLegend={false} />
            </div>
          );
        })}
      </Panel>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <Panel
            title="Pace-Entwicklung"
            note="Ø-Pace je Lauf. Aussagekräftig wird der Trend erst im Verhältnis zur Herzfrequenz (rechts)."
            right={
              paceTrend != null && (
                <span
                  title="Vergleich der Ø-Pace aus der ersten und zweiten Hälfte der letzten 30 Tage."
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: Math.abs(paceTrend) < 0.02 ? C.sub : paceTrend < 0 ? C.teal : C.coral,
                  }}
                >
                  {Math.abs(paceTrend) < 0.02 ? '→' : paceTrend < 0 ? '▼' : '▲'} {fmtPace(Math.abs(paceTrend))} /km · 30 Tage
                </span>
              )
            }
          >
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={effData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: C.sub }} />
                <YAxis reversed domain={['dataMin - 0.3', 'dataMax + 0.3']} tick={{ fontSize: 11, fill: C.sub }} tickFormatter={fmtPace} />
                <Tooltip contentStyle={tipStyle} formatter={(v) => `${fmtPace(v)} /km`} />
                <Line type="monotone" dataKey="pace" name="Pace" stroke={C.run} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <div style={{ flex: 1, minWidth: 300 }}>
          <Panel title="Aerobe Effizienz" note="EF (Pace/HF) steigt und Entkopplung sinkt, wenn dein aerobes Fundament wächst. Negative Entkopplung = sehr gleichmäßig gelaufen.">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={effData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: C.sub }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11, fill: C.sub }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: C.sub }} />
                <Tooltip contentStyle={tipStyle} />
                <ReferenceLine yAxisId="r" y={0} stroke={C.sub} strokeDasharray="3 3" />
                <Bar yAxisId="r" dataKey="decoupling" name="Entkopplung %" fill={C.tealLite} radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Line yAxisId="l" dataKey="EF" name="Efficiency Factor" stroke={C.tealDeep} strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </div>
    </div>
  );
}
