// Rad-Metriken: Normalized Power, IF, TSS, VI, Power-Kurve, Power-Zonen.
// Formeln laut PROJEKT-SPEC.md Abschnitt 5, am validierten Prototyp getestet.

import { mean } from './utils';

/** Gleitender Mittelwert über `window` Samples (1 Sample ≈ 1 Sekunde bei Zepp-Aufzeichnungen). */
export function rollingAverage(values, window) {
  const result = new Array(values.length);
  let sum = 0;
  const queue = [];
  for (let i = 0; i < values.length; i++) {
    queue.push(values[i]);
    sum += values[i];
    if (queue.length > window) sum -= queue.shift();
    result[i] = sum / queue.length;
  }
  return result;
}

/** Normalized Power: 30s-Rolling-Average -> ^4 -> Mittelwert -> 4. Wurzel. */
export function normalizedPower(powerSeries) {
  if (!powerSeries || !powerSeries.length) return 0;
  const rolling = rollingAverage(powerSeries, 30);
  const meanFourth = mean(rolling.map((v) => v ** 4));
  return meanFourth ** 0.25;
}

/** Intensity Factor = NP / FTP */
export function intensityFactor(np, ftp) {
  if (!ftp) return null;
  return Math.round((np / ftp) * 100) / 100;
}

/** Training Stress Score (Rad) = (Dauer_sek × NP × IF) / (FTP × 3600) × 100 */
export function tss(durationSec, np, ftp) {
  if (!ftp || !durationSec) return null;
  const ifVal = np / ftp;
  return Math.round(((durationSec * np * ifVal) / (ftp * 3600)) * 100);
}

/** Variability Index = NP / Ø-Watt */
export function variabilityIndex(np, avgPower) {
  if (!avgPower) return null;
  return Math.round((np / avgPower) * 100) / 100;
}

export const POWER_CURVE_WINDOWS = [5, 60, 300, 600, 1200];

/** Beste Durchschnittsleistung je Zeitfenster (gleitendes Maximum, per Prefix-Summen). */
export function powerCurve(powerSeries, windows = POWER_CURVE_WINDOWS) {
  const n = powerSeries.length;
  const result = {};
  if (!n) {
    windows.forEach((w) => (result[w] = null));
    return result;
  }
  const prefix = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + powerSeries[i];
  windows.forEach((w) => {
    if (n < w) {
      result[w] = null;
      return;
    }
    let best = 0;
    for (let i = 0; i + w <= n; i++) {
      const avg = (prefix[i + w] - prefix[i]) / w;
      if (avg > best) best = avg;
    }
    result[w] = Math.round(best);
  });
  return result;
}

/** Power-Zonen (Coggan-Modell) als untere Grenzen, aus der FTP abgeleitet. */
export function powerZonesForFtp(ftp) {
  return [0, Math.round(ftp * 0.55), Math.round(ftp * 0.75), Math.round(ftp * 0.9), Math.round(ftp * 1.05)];
}

/** Zeit (in Samples ≈ Sekunden) je Zone, anhand unterer Zonengrenzen. */
export function timeInZones(series, zoneLowerBounds) {
  const counts = new Array(zoneLowerBounds.length).fill(0);
  series.forEach((value) => {
    if (value == null) return;
    let zoneIdx = 0;
    for (let i = zoneLowerBounds.length - 1; i >= 0; i--) {
      if (value >= zoneLowerBounds[i]) {
        zoneIdx = i;
        break;
      }
    }
    counts[zoneIdx] += 1;
  });
  return counts;
}
