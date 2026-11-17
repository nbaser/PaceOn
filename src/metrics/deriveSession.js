// Verknüpft die Rohdaten einer Session mit der aktuellen Athleten-Konfiguration
// zu allen abgeleiteten Kennzahlen. Wird bei jeder FTP-/HF-Änderung neu ausgeführt
// (die Rohdaten in der DB bleiben unverändert - nur die Ableitung ist dynamisch).

import { mean, round1, round2 } from './utils';
import { normalizedPower, intensityFactor, tss, variabilityIndex, powerCurve, powerZonesForFtp, timeInZones } from './power';
import { trimp, hrZoneSecondsFromDevice } from './heartrate';
import { efCycling, efRunning, decoupling } from './efficiency';
import { paceMinPerKm, correctedCadence } from './running';

export function deriveSession(raw, athlete) {
  const durationMin = raw.durationSec / 60;
  const records = raw.records || [];

  const base = {
    id: raw.id,
    sourceFile: raw.sourceFile,
    sport: raw.sport,
    subSport: raw.subSport,
    date: raw.date,
    startTime: raw.startTime,
    endTime: raw.endTime,
    durationMin: round1(durationMin),
    distanceKm: round2(raw.distanceM / 1000),
    avgHr: raw.avgHr,
    maxHr: raw.maxHr,
    ascent: raw.ascent,
    calories: raw.calories,
    teAerobic: raw.teAerobic,
    teAnaerobic: raw.teAnaerobic,
    hrZoneSeconds: hrZoneSecondsFromDevice(raw.hrZoneSecondsRaw),
    records,
  };

  if (raw.sport === 'cycling') {
    const powerSeries = records.map((r) => r.power ?? 0);
    const hasPower = powerSeries.some((p) => p > 0);
    if (!hasPower) {
      return { ...base, hasPower: false, loadValue: 0 };
    }
    const np = Math.round(normalizedPower(powerSeries));
    const avgPower = raw.avgPowerRaw ?? Math.round(mean(powerSeries));
    const IF = intensityFactor(np, athlete.ftp);
    const TSS = tss(raw.durationSec, np, athlete.ftp);
    const VI = variabilityIndex(np, avgPower);
    const workKj = raw.totalWorkKj ?? Math.round(powerSeries.reduce((a, b) => a + b, 0) / 1000);
    const pwZones = powerZonesForFtp(athlete.ftp);
    return {
      ...base,
      hasPower: true,
      np,
      avgPower,
      IF,
      TSS,
      VI,
      workKj,
      powerCurve: powerCurve(powerSeries),
      pwZones,
      pwZoneSeconds: timeInZones(powerSeries, pwZones),
      ef: efCycling(np, raw.avgHr),
      decoupling: decoupling(records, 'power'),
      loadValue: TSS ?? 0,
    };
  }

  if (raw.sport === 'running') {
    const paceMinKm = paceMinPerKm(raw.distanceM, raw.durationSec);
    const trimpVal = Math.round(trimp(durationMin, raw.avgHr, athlete.restHr, athlete.maxHr));
    const cadenceSpm = correctedCadence(raw.avgCadenceRaw);
    const avgSpeedMs = raw.durationSec ? raw.distanceM / raw.durationSec : null;
    return {
      ...base,
      paceMinKm,
      trimp: trimpVal,
      cadenceSpm,
      ef: efRunning(avgSpeedMs, raw.avgHr),
      decoupling: decoupling(records, 'speedMs'),
      loadValue: trimpVal,
    };
  }

  return { ...base, loadValue: 0 };
}

export function deriveSessions(rawSessions, athlete) {
  return rawSessions.map((raw) => deriveSession(raw, athlete));
}
