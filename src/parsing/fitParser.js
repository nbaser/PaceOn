// FIT-Datei -> normalisierte Session-Objekte, komplett im Browser (ArrayBuffer).
// fit-file-parser v5 folgt strikt dem Garmin-SDK-Profil (Breaking Release
// gegenüber v4) - siehe normalize.js für das Feld-Mapping.

import FitParser from 'fit-file-parser';
import { normalizeSession, isSkippableSport } from './normalize';

function parseFitBuffer(arrayBuffer) {
  return new Promise((resolve, reject) => {
    const parser = new FitParser({
      force: true,
      speedUnit: 'm/s',
      lengthUnit: 'm',
      mode: 'both',
    });
    parser.parse(arrayBuffer, (error, data) => {
      if (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      resolve(data);
    });
  });
}

/**
 * Liest eine .fit-Datei und liefert alle enthaltenen Sessions (Rad/Lauf),
 * normalisiert. 'transition'-Sessions (Koppeleinheiten) werden übersprungen.
 */
export async function extractSessionsFromFile(file) {
  const buffer = await file.arrayBuffer();
  const raw = await parseFitBuffer(buffer);
  const sessions = (raw.sessions || [])
    .filter((s) => !isSkippableSport(s.sport))
    .map((s) => normalizeSession(s, file.name));
  return sessions;
}
