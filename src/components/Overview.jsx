import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, ComposedChart, PieChart, Pie,
} from 'recharts';
import { C, Stat, Panel, Legend, MiniSport, tipStyle, shortDate, Empty } from './ui';
import { groupBricks } from '../metrics/brick';

const DEFAULT_RANGE_DAYS = 10;
const MIN_RANGE_DAYS = 7;
const MAX_RANGE_DAYS = 180;

export default function Overview({ sessions, pmc }) {
  const [rangeDays, setRangeDays] = useState(DEFAULT_RANGE_DAYS);

  if (!sessions.length) {
    return <Empty t="Noch keine Einheiten importiert. Lade FIT-Dateien über den Upload-Bereich hoch." />;
  }

  const last = pmc[pmc.length - 1] || { ctl: 0, atl: 0, tsb: 0 };
  const totTss = sessions.reduce((a, s) => a + (s.loadValue || 0), 0);
  const totHrs = sessions.reduce((a, s) => a + s.durationMin, 0) / 60;
  const brickGroups = groupBricks(sessions);
  const brickSourceFiles = new Set(brickGroups.flat().map((s) => s.sourceFile));
  const cyc = sessions.filter((s) => s.sport === 'cycling' && !brickSourceFiles.has(s.sourceFile));
  const run = sessions.filter((s) => s.sport === 'running' && !brickSourceFiles.has(s.sourceFile));
  const brick = {
    n: brickGroups.length,
    tss: brickGroups.reduce((a, g) => a + g.reduce((b, s) => b + (s.loadValue || 0), 0), 0),
    hrs: brickGroups.reduce((a, g) => a + g.reduce((b, s) => b + s.durationMin, 0), 0) / 60,
    km: brickGroups.reduce((a, g) => a + g.reduce((b, s) => b + (s.distanceKm || 0), 0), 0),
  };

  const yearCutoff = new Date();
  yearCutoff.setDate(yearCutoff.getDate() - 365);
  const withinLastYear = (dateStr) => !!dateStr && new Date(dateStr) >= yearCutoff;

  const distribution = [
    { name: 'Rennrad', value: cyc.filter((s) => withinLastYear(s.date)).length, color: C.cyc },
    { name: 'Laufen', value: run.filter((s) => withinLastYear(s.date)).length, color: C.run },
    { name: 'Brick', value: brickGroups.filter((g) => withinLastYear(g[0]?.date)).length, color: C.sand },
  ].filter((d) => d.value > 0);

  const tsbState =
    last.tsb < -30 ? ['Stark ermüdet', C.coral]
    : last.tsb < -10 ? ['Produktive Belastung', C.teal]
    : last.tsb < 5 ? ['Frisch', C.tealDeep]
    : ['Sehr frisch / Formspitze', C.sand];

  const maxRangeDays = Math.max(MIN_RANGE_DAYS, Math.min(MAX_RANGE_DAYS, pmc.length));
  const clampedRangeDays = Math.min(rangeDays, maxRangeDays);
  const loadByDay = pmc.slice(-clampedRangeDays).map((d) => ({ ...d, d: shortDate(d.date) }));

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <Stat
          label="Fitness (CTL)"
          value={last.ctl}
          hint="42-Tage-Belastung – dein Formaufbau"
          accent={C.tealDeep}
          info="Chronic Training Load – gleitender 42-Tage-Schnitt deiner Trainingsbelastung. Steigt stetig, wenn du dein aerobes Fundament ausbaust."
        />
        <Stat
          label="Ermüdung (ATL)"
          value={last.atl}
          hint="7-Tage-Belastung – akute Last"
          accent={C.sand}
          info="Acute Training Load – gleitender 7-Tage-Schnitt deiner Belastung. Zeigt die kurzfristige, akute Ermüdung."
        />
        <Stat
          label="Form (TSB)"
          value={last.tsb}
          hint={tsbState[0]}
          accent={tsbState[1]}
          info="Training Stress Balance = CTL − ATL. Negative Werte bedeuten produktive Belastung, stark negative Werte ein Übertrainings-Risiko."
        />
        <Stat
          label="Gesamt-Load"
          value={Math.round(totTss)}
          unit="TSS"
          hint={`${sessions.length} Einheiten · ${totHrs.toFixed(1)} h`}
          info="Summe aus TSS (Rad) und TRIMP (Lauf) über alle importierten Einheiten."
        />
      </div>

      <Panel
        title="Fitness · Ermüdung · Form"
        note="Der Kern der Belastungssteuerung. CTL (Fitness) soll beim Grundlagenaufbau stetig steigen, ohne dass ATL (Ermüdung) dauerhaft davonrennt. TSB unter 0 heißt: du trainierst produktiv – zu tief und zu lang ist aber ein Übertrainings-Warnsignal."
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
            <span style={{ fontSize: 12, color: C.sub, whiteSpace: 'nowrap' }}>
              Zeitraum: {clampedRangeDays} Tage
            </span>
            <input
              type="range"
              min={MIN_RANGE_DAYS}
              max={maxRangeDays}
              value={clampedRangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
              style={{ width: 140, accentColor: C.tealDeep }}
            />
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={loadByDay} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey="d" tick={{ fontSize: 11, fill: C.sub }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: C.sub }} />
            <Tooltip contentStyle={tipStyle} />
            <ReferenceLine y={0} stroke={C.sub} strokeDasharray="3 3" />
            <Bar dataKey="load" name="Tages-Load" fill={C.tealLite} radius={[3, 3, 0, 0]} maxBarSize={16} />
            <Line dataKey="ctl" name="Fitness (CTL)" stroke={C.tealDeep} strokeWidth={2.5} dot={false} />
            <Line dataKey="atl" name="Ermüdung (ATL)" stroke={C.sand} strokeWidth={2} dot={false} />
            <Line dataKey="tsb" name="Form (TSB)" stroke={C.coral} strokeWidth={2} strokeDasharray="5 3" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6, fontSize: 11.5, color: C.sub }}>
          <Legend c={C.tealDeep} t="Fitness (CTL)" />
          <Legend c={C.sand} t="Ermüdung (ATL)" />
          <Legend c={C.coral} t="Form (TSB)" />
          <Legend c={C.tealLite} t="Tages-Load" />
        </div>
      </Panel>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <Panel title="Sportart-Verteilung" note="Anzahl Einheiten der letzten 365 Tage, aufgeteilt auf Rad, Lauf und Brick.">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>
                  {distribution.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tipStyle} formatter={(v, n) => [`${v} Einheiten`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', margin: '-4px 0 14px', fontSize: 11.5, color: C.sub }}>
              {distribution.map((d, i) => (
                <Legend key={i} c={d.color} t={d.name} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <MiniSport
                label="Rennrad"
                n={cyc.length}
                tss={cyc.reduce((a, s) => a + (s.loadValue || 0), 0)}
                hrs={cyc.reduce((a, s) => a + s.durationMin, 0) / 60}
                km={cyc.reduce((a, s) => a + s.distanceKm, 0)}
                color={C.cyc}
                info="Alle reinen Rad-Einheiten, ohne Brick-Anteile."
              />
              <MiniSport
                label="Laufen"
                n={run.length}
                tss={run.reduce((a, s) => a + (s.loadValue || 0), 0)}
                hrs={run.reduce((a, s) => a + s.durationMin, 0) / 60}
                km={run.reduce((a, s) => a + s.distanceKm, 0)}
                color={C.run}
                info="Alle reinen Lauf-Einheiten, ohne Brick-Anteile."
              />
              {brick.n > 0 && (
                <MiniSport
                  label="Brick"
                  n={brick.n}
                  tss={brick.tss}
                  hrs={brick.hrs}
                  km={brick.km}
                  color={C.sand}
                  info="Koppel-Einheiten aus Rad + Lauf (aus derselben Datei), Rad- und Laufanteil zusammen gezählt."
                />
              )}
            </div>
          </Panel>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <Panel title="Load pro Einheit" note="Trainingsbelastung (TSS bzw. TRIMP) je Session.">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart
                data={sessions.map((s) => ({
                  d: shortDate(s.date) + (s.sport === 'cycling' ? ' 🚲' : ' 🏃'),
                  tss: s.loadValue || 0,
                  sport: s.sport,
                }))}
                margin={{ top: 4, right: 8, left: -22, bottom: 0 }}
              >
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: C.sub }} />
                <YAxis tick={{ fontSize: 11, fill: C.sub }} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="tss" name="Load" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {sessions.map((s, i) => (
                    <Cell key={i} fill={s.sport === 'cycling' ? C.cyc : C.run} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </div>
    </div>
  );
}
