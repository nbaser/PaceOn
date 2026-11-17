// Efficiency Factor & aerobe Entkopplung (Decoupling).

import { mean } from './utils';

/** EF Rad = NP / Ø-HF */
export function efCycling(np, avgHr) {
  if (!avgHr || !np) return null;
  return Math.round((np / avgHr) * 100) / 100;
}

/** EF Lauf = (Ø-Geschwindigkeit_m/s × 60) / Ø-HF */
export function efRunning(avgSpeedMs, avgHr) {
  if (!avgHr || !avgSpeedMs) return null;
  return Math.round(((avgSpeedMs * 60) / avgHr) * 100) / 100;
}

function halfEfficiency(records, metricKey) {
  const valid = records.filter((r) => r.heartRate > 0 && r[metricKey] != null);
  if (!valid.length) return null;
  const avgMetric = mean(valid.map((r) => r[metricKey]));
  const avgHr = mean(valid.map((r) => r.heartRate));
  return avgHr ? avgMetric / avgHr : null;
}

/**
 * Aerobe Entkopplung: Einheit in zwei Hälften teilen, je Hälfte (Metrik/HF)
 * bilden, dann Decoupling% = (Eff_1 - Eff_2) / Eff_2 × 100.
 * metricKey: 'power' (Rad) oder 'speedMs' (Lauf).
 */
export function decoupling(records, metricKey) {
  if (!records || records.length < 20) return null; // zu kurz für sinnvolle Halbierung
  const mid = Math.floor(records.length / 2);
  const e1 = halfEfficiency(records.slice(0, mid), metricKey);
  const e2 = halfEfficiency(records.slice(mid), metricKey);
  if (e1 == null || e2 == null || e2 === 0) return null;
  return Math.round(((e1 - e2) / e2) * 1000) / 10;
}
