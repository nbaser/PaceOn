// HF-basierte Metriken: TRIMP (Banister) und Zonen-Aufbereitung.

/**
 * TRIMP (Banister), männliche Formel laut Spec:
 * hrr = (avgHR - restHR) / (maxHR - restHR)
 * TRIMP = Dauer_min × hrr × 0.64 × e^(1.92 × hrr)
 */
export function trimp(durationMin, avgHr, restHr, maxHr) {
  if (!avgHr || !maxHr || maxHr <= restHr) return 0;
  const hrr = (avgHr - restHr) / (maxHr - restHr);
  return durationMin * hrr * 0.64 * Math.exp(1.92 * hrr);
}

/**
 * Das Gerät liefert time_in_hr_zone bereits fertig (Sekunden pro Zone).
 * Zepp-Dateien liefern teils ein 6. Element (ungenutzte Zone) - auf 5 Zonen kappen.
 */
export function hrZoneSecondsFromDevice(timeInHrZoneRaw) {
  return (timeInHrZoneRaw || []).slice(0, 5).map((v) => v || 0);
}
