// Lauf-spezifische Metriken: Pace, Kadenz-Korrektur.

/**
 * avg_speed im FIT-File ist auf ganze m/s gerundet (Zepp-Eigenheit) und daher
 * für die Pace ungeeignet. Stattdessen aus Distanz/Zeit berechnen.
 */
export function paceMinPerKm(distanceM, durationSec) {
  if (!distanceM || !durationSec) return null;
  const km = distanceM / 1000;
  const minutes = durationSec / 60;
  return Math.round((minutes / km) * 100) / 100;
}

/**
 * Zepp/Amazfit liefert die Lauf-Kadenz halbiert (avg_running_cadence ~77
 * statt ~154). Für Schritte/Minute verdoppeln.
 */
export function correctedCadence(avgCadenceRaw) {
  if (avgCadenceRaw == null) return null;
  return Math.round(avgCadenceRaw * 2);
}
