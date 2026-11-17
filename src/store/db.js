// Lokale Persistenz via Dexie (IndexedDB-Wrapper). Kein Backend, keine Cloud -
// alle Trainingsdaten bleiben im Browser des Nutzers.

import Dexie from 'dexie';

export const db = new Dexie('trainingsanalyse');

db.version(1).stores({
  // startTime ist eindeutig -> Basis für die Duplikat-Erkennung.
  sessions: '++id, &startTime, sport, date',
});

/**
 * Fügt Sessions ein, überspringt aber Duplikate (gleiche Startzeit bereits
 * in der DB vorhanden). Liefert { added, skipped } für die UI-Rückmeldung.
 */
export async function addSessionsIfNew(sessions) {
  const added = [];
  const skipped = [];
  for (const session of sessions) {
    const existing = await db.sessions.where('startTime').equals(session.startTime).first();
    if (existing) {
      skipped.push(session);
      continue;
    }
    const id = await db.sessions.add(session);
    added.push({ ...session, id });
  }
  return { added, skipped };
}

export async function getAllSessions() {
  return db.sessions.orderBy('startTime').toArray();
}

export async function deleteSession(id) {
  return db.sessions.delete(id);
}

export async function clearAllSessions() {
  return db.sessions.clear();
}

export async function exportAllSessions() {
  return db.sessions.toArray();
}

/** Importiert einen zuvor exportierten JSON-Datensatz (überschreibt vorhandene Daten). */
export async function importSessions(sessions) {
  await db.sessions.clear();
  await db.sessions.bulkAdd(sessions.map(({ id: _id, ...rest }) => rest));
}
