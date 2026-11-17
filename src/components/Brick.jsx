import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { C, Stat, Panel, ZoneBar, tipStyle, shortDate, fmtPace, Empty } from './ui';
import { groupBricks, transitionMinutes } from '../metrics/brick';

function average(items, pick) {
  const vals = items.map(pick).filter((v) => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

export default function Brick({ sessions }) {
  const bricks = groupBricks(sessions);
  if (!bricks.length) return <Empty t="Keine Brick-Einheiten (Rad+Lauf aus einer Koppel-Datei) in diesem Bestand." />;

  const totalDurationMin = bricks.reduce((sum, g) => sum + g.reduce((a, s) => a + s.durationMin, 0), 0);
  const totalDistanceKm = bricks.reduce((sum, g) => sum + g.reduce((a, s) => a + (s.distanceKm || 0), 0), 0);
  const totalTss = bricks.reduce((sum, g) => sum + g.reduce((a, s) => a + (s.TSS || 0), 0), 0);

  const brickSourceFiles = new Set(bricks.flat().map((s) => s.sourceFile));
  const brickBikes = bricks.map((g) => g.find((s) => s.sport === 'cycling')).filter(Boolean);
  const brickRuns = bricks.map((g) => g.find((s) => s.sport === 'running')).filter(Boolean);
  const pureCycling = sessions.filter((s) => s.sport === 'cycling' && s.hasPower !== false && !brickSourceFiles.has(s.sourceFile));
  const pureRunning = sessions.filter((s) => s.sport === 'running' && !brickSourceFiles.has(s.sourceFile));

  const brickAvgPower = average(
    brickBikes.filter((s) => s.hasPower !== false),
    (s) => s.avgPower
  );
  const pureAvgPower = average(pureCycling, (s) => s.avgPower);
  const powerDiff = brickAvgPower != null && pureAvgPower != null ? brickAvgPower - pureAvgPower : null;

  const brickAvgPace = average(brickRuns, (s) => s.paceMinKm);
  const pureAvgPace = average(pureRunning, (s) => s.paceMinKm);
  const paceDiff = brickAvgPace != null && pureAvgPace != null ? brickAvgPace - pureAvgPace : null;

  const transitions = bricks.map((g) => ({ date: g[0].date, min: transitionMinutes(g) })).filter((t) => t.min != null);
  const fastest = transitions.reduce((best, t) => (best == null || t.min < best.min ? t : best), null);
  const transitionChartData = transitions.map((t) => ({ d: shortDate(t.date), min: t.min }));

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <Stat
          label="Brick-Einheiten"
          value={bricks.length}
          accent={C.sand}
          info="Anzahl erkannter Koppel-Einheiten (Rad direkt gefolgt von Lauf aus einer Datei)."
        />
        <Stat
          label="Gesamtdauer"
          value={(totalDurationMin / 60).toFixed(1)}
          unit="h"
          info="Summierte Dauer aller Brick-Einheiten – Rad- und Laufanteil zusammen."
        />
        <Stat
          label="Gesamt-Distanz"
          value={totalDistanceKm.toFixed(1)}
          unit="km"
          info="Summierte Distanz aller Brick-Einheiten – Rad- und Laufanteil zusammen."
        />
        <Stat
          label="Gesamt-TSS (Radanteil)"
          value={Math.round(totalTss)}
          hint="nur Rad-Segmente mit Leistungsdaten"
          accent={C.tealDeep}
          info="Summierter TSS-Wert der Rad-Segmente aller Brick-Einheiten (nur wo Leistungsdaten vorliegen)."
        />
        {fastest && (
          <Stat
            label="Schnellste Wechselzeit"
            value={fmtPace(fastest.min)}
            unit="min"
            hint={shortDate(fastest.date)}
            accent={C.sand}
            info="Kürzeste Zeit zwischen Rad-Ende und Lauf-Start unter allen Brick-Einheiten."
          />
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        {brickAvgPace != null && (
          <Stat
            label="Ø Pace Brick-Läufe"
            value={fmtPace(brickAvgPace)}
            unit="/km"
            hint={
              paceDiff != null
                ? `${fmtPace(pureAvgPace)}/km bei reinen Läufen (${paceDiff <= 0 ? '−' : '+'}${fmtPace(Math.abs(paceDiff))} /km)`
                : 'keine reinen Läufe zum Vergleich'
            }
            accent={C.run}
            info="Durchschnittspace der Laufanteile aus Brick-Einheiten, verglichen mit reinen Läufen."
          />
        )}
        {brickAvgPower != null && (
          <Stat
            label="Ø Leistung Brick-Rad"
            value={Math.round(brickAvgPower)}
            unit="W"
            hint={
              powerDiff != null
                ? `${Math.round(pureAvgPower)} W bei reinen Rad-Einheiten (${powerDiff >= 0 ? '+' : '−'}${Math.round(Math.abs(powerDiff))} W)`
                : 'keine reinen Rad-Einheiten zum Vergleich'
            }
            accent={C.cyc}
            info="Durchschnittliche Leistung der Radanteile aus Brick-Einheiten, verglichen mit reinen Rad-Einheiten."
          />
        )}
      </div>

      {bricks.map((group, i) => {
        const bike = group.find((s) => s.sport === 'cycling');
        const run = group.find((s) => s.sport === 'running');
        const transitionMin = transitionMinutes(group);

        return (
          <Panel
            key={i}
            title={`${shortDate(group[0].date)} · Brick (Rad → Lauf)`}
            note={transitionMin != null ? `Wechselzeit ≈ ${Math.round(transitionMin)} min` : undefined}
          >
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {bike && (
                <div style={{ flex: 1, minWidth: 220, borderLeft: `4px solid ${C.cyc}`, paddingLeft: 12 }}>
                  <div style={{ fontWeight: 700, color: C.ink, marginBottom: 6 }}>Rad</div>
                  <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.8 }}>
                    {bike.durationMin} min · {bike.distanceKm} km
                    {bike.hasPower !== false && (
                      <>
                        <br />
                        NP {bike.np} W · IF {bike.IF ?? '–'} · TSS {bike.TSS ?? '–'}
                      </>
                    )}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <ZoneBar seconds={(bike.hasPower !== false ? bike.pwZoneSeconds : bike.hrZoneSeconds) || [0, 0, 0, 0, 0]} />
                  </div>
                </div>
              )}
              {run && (
                <div style={{ flex: 1, minWidth: 220, borderLeft: `4px solid ${C.run}`, paddingLeft: 12 }}>
                  <div style={{ fontWeight: 700, color: C.ink, marginBottom: 6 }}>Lauf</div>
                  <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.8 }}>
                    {run.durationMin} min · {run.distanceKm} km · Pace {fmtPace(run.paceMinKm)}/km
                    <br />
                    TRIMP {run.trimp ?? '–'}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <ZoneBar seconds={run.hrZoneSeconds || [0, 0, 0, 0, 0]} />
                  </div>
                </div>
              )}
            </div>
          </Panel>
        );
      })}

      {transitionChartData.length > 0 && (
        <Panel title="Wechselzeiten" note="Zeit zwischen Rad-Ende und Lauf-Start je Brick-Einheit.">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={transitionChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: C.sub }} />
              <YAxis tick={{ fontSize: 11, fill: C.sub }} tickFormatter={(v) => `${Math.round(v)} min`} />
              <Tooltip contentStyle={tipStyle} formatter={(v) => [`${fmtPace(v)} min`, 'Wechselzeit']} />
              <Line type="monotone" dataKey="min" name="Wechselzeit" stroke={C.sand} strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      )}
    </div>
  );
}
