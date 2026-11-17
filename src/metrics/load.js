// Performance Management Chart: Tages-Load, CTL/ATL/TSB.

/** Summiert loadValue (TSS bzw. TRIMP) pro Kalendertag über alle Sessions. */
export function computeDailyLoad(derivedSessions) {
  const map = new Map();
  derivedSessions.forEach((s) => {
    const load = s.loadValue || 0;
    map.set(s.date, (map.get(s.date) || 0) + load);
  });
  return map;
}

/**
 * CTL_heute = CTL_gestern + (Load_heute - CTL_gestern) / 42
 * ATL_heute = ATL_gestern + (Load_heute - ATL_gestern) / 7
 * TSB_heute = CTL_heute - ATL_heute
 * Iteriert Tag für Tag vom ersten bis zum letzten Trainingstag.
 */
export function computePMC(dailyLoadMap) {
  const dates = [...dailyLoadMap.keys()].sort();
  if (!dates.length) return [];
  const start = new Date(`${dates[0]}T00:00:00Z`);
  const end = new Date(`${dates[dates.length - 1]}T00:00:00Z`);
  const days = [];
  let ctl = 0;
  let atl = 0;
  for (let d = start; d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const load = dailyLoadMap.get(iso) || 0;
    ctl = ctl + (load - ctl) / 42;
    atl = atl + (load - atl) / 7;
    const tsb = ctl - atl;
    days.push({
      date: iso,
      load: Math.round(load),
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10,
    });
  }
  return days;
}
