# Trainingsanalyse

Eine rein lokale Web-App zur Analyse von Rennrad- und Lauftrainings aus
Amazfit/Zepp-FIT-Dateien. Fokus: Grundlagenaufbau (Base Training). Kein
Backend, kein Hosting, keine Cloud — alle Daten bleiben im Browser
(IndexedDB).

Siehe [files/PROJEKT-SPEC.md](files/PROJEKT-SPEC.md) für die vollständige
fachliche Spezifikation (Metrik-Definitionen, FIT-Eigenheiten etc.).

## Schnellstart

```bash
npm install
npm run dev
```

Dann im Browser `http://localhost:5173` öffnen und FIT-Dateien per Drag & Drop
hochladen (Beispieldateien liegen unter `testdata/`).

Production-Build:

```bash
npm run build      # erzeugt /dist
npm run preview    # /dist lokal ausliefern (fester Port 4173)
```

## Als App installieren (Chrome, macOS)

Die App ist eine installierbare PWA (Web App Manifest + Service Worker via
`vite-plugin-pwa`). Einmal gebaut und über `npm run preview` ausgeliefert,
lässt sie sich in Chrome als eigenständige App installieren:

1. `npm run build && npm run preview` ausführen.
2. `http://localhost:4173` in Chrome öffnen.
3. Auf das Installieren-Symbol in der Adressleiste klicken (oder Chrome-Menü
   → "Trainingsanalyse installieren").
4. Die App startet danach als eigenes Fenster und legt ein Icon im Launchpad
   an (von dort aus ins Dock ziehbar).

Der Service Worker cached alle Assets beim ersten Laden, danach funktioniert
die installierte App auch ohne laufenden `preview`-Server offline weiter.
Nach Code-Änderungen einmal neu bauen und bei laufendem Server die App neu
öffnen, damit der Service Worker (`registerType: 'autoUpdate'`) den Cache
aktualisiert.

## Funktionen (MVP)

- **FIT-Upload** — Drag & Drop, mehrere Dateien gleichzeitig
- **Parsing im Browser** — `fit-file-parser` v5, inkl. Behandlung aller
  bekannten Zepp/Amazfit-Eigenheiten (gerundete `avg_speed`, halbierte
  Lauf-Kadenz, fehlende Rad-Kadenz, fehlende `normalized_power`,
  Duathlon-`transition`-Sessions)
- **Lokale Speicherung** — Dexie/IndexedDB, Duplikat-Erkennung über die
  Session-Startzeit
- **Dashboard** mit drei Tabs: Übersicht (CTL/ATL/TSB), Rennrad, Laufen
- **Athleten-Einstellungen** — FTP, Max-HF, Ruhe-HF editierbar; alle
  Kennzahlen werden live neu berechnet, ohne dass Dateien erneut importiert
  werden müssen
- **FTP-Realitätscheck** — Hinweis-Panel im Rad-Tab, das die FTP anhand der
  besten 20-Minuten-Leistung einordnet

## Technik

- **Vite + React** — Frontend
- **fit-file-parser** — FIT-Parsing im Browser via ArrayBuffer
- **Dexie** — IndexedDB-Wrapper für lokale Persistenz
- **Recharts** — Charts

Alle Daten bleiben lokal im Browser. Kein Server, keine externen Aufrufe.

## Projektstruktur

```
src/
  parsing/
    fitParser.js       FIT-Datei -> Rohdaten (fit-file-parser v5)
    normalize.js        Feld-Mapping, Zepp-Eigenheiten, Record-Zeitreihe
  metrics/
    power.js             NP, IF, TSS, VI, Power-Kurve, Power-Zonen
    heartrate.js         TRIMP, HF-Zonen
    efficiency.js        EF, aerobe Entkopplung
    load.js               CTL/ATL/TSB (PMC)
    running.js            Pace, Kadenz-Korrektur
    deriveSession.js     verknüpft Rohdaten + Athleten-Config zu allen Kennzahlen
  store/
    db.js                 Dexie-Schema, CRUD, Duplikat-Erkennung
  config/
    athlete.js            FTP/HF-Konfiguration (localStorage)
  components/
    Overview.jsx, Cycling.jsx, Running.jsx, Upload.jsx, Settings.jsx, ui.jsx
  App.jsx
testdata/                Beispiel-FIT-Dateien zum Testen des Parsings
```

## Ausbau (nächste Schritte)

- Wochen-/Monats-Aggregation, ACWR, Monotonie/Strain
- Einzelne Einheit im Detail (HF-/Power-Verlauf über die Zeit)
- Export der Auswertung (PDF/CSV)
- Trend-Vergleich über längere Zeiträume
