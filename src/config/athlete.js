// Athleten-Konfiguration: FTP, MaxHF, RestHF, HF-Zonen. Editierbar im UI
// (Settings-Bereich), persistiert in localStorage (kein Backend nötig).

const STORAGE_KEY = 'trainingsanalyse:athlete';

export const DEFAULT_ATHLETE = {
  ftp: 190, // Watt — GESCHÄTZT, siehe FTP-Realitätscheck im Rad-Tab
  maxHr: 185, // gemessener Höchstwert im Training
  restHr: 60, // für TRIMP-Berechnung
  hrZones: [0, 129, 148, 163, 176], // untere Grenzen, deckt sich mit Zepp-App
};

export function loadAthlete() {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_ATHLETE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ATHLETE };
    return { ...DEFAULT_ATHLETE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_ATHLETE };
  }
}

export function saveAthlete(athlete) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(athlete));
}
