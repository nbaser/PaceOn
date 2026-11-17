// Feld-Mapping der rohen fit-file-parser-v5-Ausgabe auf ein stabiles,
// UI-unabhängiges Session-Format. Kapselt alle Zepp/Amazfit-Eigenheiten
// aus PROJEKT-SPEC.md Abschnitt 6.

/** Koppeleinheiten (Duathlon) enthalten eine 'transition'-Session dazwischen. */
export function isSkippableSport(sport) {
  return sport === 'transition';
}

function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/**
 * Baut aus den (verschachtelten) Lap-Records einer Session eine flache,
 * nach Zeit sortierte Zeitreihe. `t` ist die Sekunde seit Session-Start,
 * berechnet aus dem Timestamp (nicht aus den unzuverlässigen
 * elapsed_time/timer_time-Feldern pro Record).
 */
function buildRecordSeries(session, startIso) {
  const startMs = new Date(startIso).getTime();
  const records = [];
  (session.laps || []).forEach((lap) => {
    (lap.records || []).forEach((r) => {
      if (!r.timestamp) return;
      const t = Math.round((new Date(r.timestamp).getTime() - startMs) / 1000);
      records.push({
        t,
        heartRate: r.heart_rate ?? null,
        power: r.power ?? null,
        speedMs: r.speed ?? null,
        cadence: r.cadence ?? null,
        altitude: r.altitude ?? null,
      });
    });
  });
  records.sort((a, b) => a.t - b.t);
  return records;
}

/** Normalisiert eine einzelne rohe FIT-Session in unser Session-Format. */
export function normalizeSession(rawSession, sourceFileName) {
  const startTime = toIso(rawSession.start_time);
  const endTime = toIso(rawSession.timestamp);

  return {
    sourceFile: sourceFileName,
    sport: rawSession.sport,
    subSport: rawSession.sub_sport || '',
    startTime,
    endTime,
    date: startTime ? startTime.slice(0, 10) : null,
    durationSec: rawSession.total_timer_time ?? 0,
    distanceM: rawSession.total_distance ?? 0,
    avgHr: rawSession.avg_heart_rate ?? null,
    maxHr: rawSession.max_heart_rate ?? null,
    ascent: rawSession.total_ascent ?? 0,
    calories: rawSession.total_calories ?? 0,
    teAerobic: rawSession.total_training_effect ?? null,
    teAnaerobic: rawSession.total_anaerobic_training_effect ?? null,
    // avg_power vom Gerät wird nur als Fallback genutzt; NP wird immer selbst
    // aus der Watt-Zeitreihe berechnet (Gerät liefert kein normalized_power).
    avgPowerRaw: rawSession.avg_power ?? null,
    maxPower: rawSession.max_power ?? null,
    totalWorkKj: rawSession.total_work ?? null,
    // Rad-Kadenz fehlt durchgängig bei Zepp-Dateien -> hier bewusst nicht gemappt.
    avgCadenceRaw: rawSession.sport === 'running' ? rawSession.avg_cadence ?? null : null,
    // time_in_hr_zone liefert das Gerät fertig (Sekunden pro Zone).
    hrZoneSecondsRaw: rawSession.time_in_hr_zone || [],
    records: buildRecordSeries(rawSession, startTime),
  };
}
