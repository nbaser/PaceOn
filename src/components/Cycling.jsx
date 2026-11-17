import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, ReferenceLine } from 'recharts';
import { C, Stat, Panel, ZoneBar, ZoneLegend, tipStyle, shortDate, Empty } from './ui';

export default function Cycling({ sessions, ftp }) {
  const cyc = sessions.filter((s) => s.sport === 'cycling' && s.hasPower !== false);
  if (!cyc.length) return <Empty t="Keine Rad-Einheiten mit Leistungsdaten in diesem Bestand." />;

  const pcData = [5, 60, 300, 600, 1200].map((w) => {
    const row = { w: w < 60 ? `${w}s` : `${w / 60}min` };
    cyc.forEach((s) => (row[s.startTime] = s.powerCurve?.[w]));
    return row;
  });
  const effData = cyc.map((s) => ({ d: shortDate(s.date), EF: s.ef, decoupling: s.decoupling }));
  const npData = cyc.map((s) => ({ d: shortDate(s.date), np: s.np }));
  const best20 = Math.max(...cyc.map((s) => s.powerCurve?.[1200] || 0));
  const bestKj = cyc.reduce((best, s) => (s.workKj != null && s.workKj > (best?.workKj ?? -Infinity) ? s : best), null);
  const bestDist = cyc.reduce((best, s) => (s.distanceKm != null && s.distanceKm > (best?.distanceKm ?? -Infinity) ? s : best), null);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <Stat
          label="FTP (Basis)"
          value={ftp}
          unit="W"
          hint="geschätzt – siehe Realitätscheck"
          accent={C.tealDeep}
          info="Deine aktuell hinterlegte Functional Threshold Power. Basis für IF, TSS und die Power-Zonen. In den Einstellungen anpassbar."
        />
        <Stat
          label="Ø NP letzte Einheit"
          value={cyc[cyc.length - 1].np}
          unit="W"
          accent={C.teal}
          info="Normalized Power der zuletzt importierten Rad-Einheit – die um Leistungsspitzen bereinigte Durchschnittsleistung."
        />
        <Stat
          label="Beste 20-min-Leistung"
          value={best20 || '–'}
          unit="W"
          hint="≈ FTP-Indikator"
          info="Höchste Durchschnittsleistung über ein 20-Minuten-Fenster aus allen Rad-Einheiten – gängiger Schätzwert für die FTP."
        />
        <Stat
          label="Ø Entkopplung"
          value={
            cyc.some((s) => s.decoupling != null)
              ? (cyc.reduce((a, s) => a + (s.decoupling || 0), 0) / cyc.filter((s) => s.decoupling != null).length).toFixed(1)
              : '–'
          }
          unit="%"
          hint="niedriger = besser"
          accent={C.sand}
          info="Mittlere aerobe Entkopplung (Leistungs-/HF-Drift) über alle Rad-Einheiten. Niedrige Werte zeigen ein stabiles aerobes Fundament."
        />
        {bestKj && (
          <Stat
            label="Höchste Arbeit"
            value={bestKj.workKj}
            unit="kJ"
            hint={shortDate(bestKj.date)}
            accent={C.tealDeep}
            info="Die größte in einer einzelnen Rad-Einheit geleistete Arbeit in Kilojoule."
          />
        )}
        {bestDist && (
          <Stat
            label="Längste Distanz"
            value={bestDist.distanceKm}
            unit="km"
            hint={shortDate(bestDist.date)}
            accent={C.teal}
            info="Die weiteste in einer einzelnen Einheit gefahrene Distanz."
          />
        )}
      </div>

      {best20 > 0 && (
        <Panel
          title="FTP-Realitätscheck"
          note={`Deine 20-Minuten-Bestleistung liegt bei ${best20} W. Die Faustformel FTP ≈ 95 % davon ergäbe rund ${Math.round(
            best20 * 0.95
          )} W. Dein IF liegt bei ${cyc.map((s) => s.IF ?? '–').join(' / ')} – Werte nahe 0,9 über 1,5–2,5 h sind für reine Grundlagenfahrten ungewöhnlich hoch. Das deutet darauf hin, dass deine echte FTP über der aktuell eingestellten liegt. Passe die FTP bei Bedarf in den Einstellungen an.`}
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={npData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: C.sub }} />
              <YAxis tick={{ fontSize: 11, fill: C.sub }} />
              <Tooltip contentStyle={tipStyle} formatter={(v) => [`${v} W`, 'NP']} />
              <ReferenceLine y={ftp} stroke={C.sand} strokeDasharray="5 3" label={{ value: `FTP ${ftp} W`, position: 'insideTopRight', fill: C.sand, fontSize: 11 }} />
              <Line type="monotone" dataKey="np" name="NP" stroke={C.tealDeep} strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      )}

      <Panel
        title="Power-Zonen-Verteilung"
        note="Grundlagenfahrten sollten überwiegend in Z1–Z2 liegen. Viel Z3 ('grauer Bereich') ist der klassische Base-Training-Fehler."
      >
        <ZoneLegend />
        {cyc.map((s, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 4 }}>
              {s.startTime?.slice(0, 16).replace('T', ' ')} · {s.distanceKm} km
            </div>
            <ZoneBar seconds={s.pwZoneSeconds || [0, 0, 0, 0, 0]} showLegend={false} />
          </div>
        ))}
      </Panel>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <Panel title="Power-Kurve" note="Beste Durchschnittsleistung je Zeitfenster. Wächst die Kurve über die Wochen, steigt deine Leistungsfähigkeit.">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={pcData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="w" tick={{ fontSize: 11, fill: C.sub }} />
                <YAxis tick={{ fontSize: 11, fill: C.sub }} />
                <Tooltip contentStyle={tipStyle} />
                {cyc.map((s, i) => (
                  <Line key={i} dataKey={s.startTime} name={shortDate(s.date)} stroke={i % 2 === 0 ? C.tealLite : C.tealDeep} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <div style={{ flex: 1, minWidth: 300 }}>
          <Panel title="Aerobe Effizienz" note="Efficiency Factor (NP/HF) steigt und Entkopplung sinkt, wenn dein aerobes Fundament wächst – die zwei wichtigsten Grundlagen-Trends.">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={effData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: C.sub }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11, fill: C.sub }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: C.sub }} />
                <Tooltip contentStyle={tipStyle} />
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
