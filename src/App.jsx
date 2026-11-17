import { useEffect, useMemo, useState } from 'react';
import { C } from './components/ui';
import Upload from './components/Upload';
import Settings from './components/Settings';
import Overview from './components/Overview';
import Cycling from './components/Cycling';
import Running from './components/Running';
import Brick from './components/Brick';
import { getAllSessions } from './store/db';
import { loadAthlete, saveAthlete } from './config/athlete';
import { deriveSessions } from './metrics/deriveSession';
import { computeDailyLoad, computePMC } from './metrics/load';

const TABS = [
  ['overview', 'Übersicht'],
  ['cycling', 'Rennrad'],
  ['running', 'Laufen'],
  ['brick', 'Brick'],
];

export default function App() {
  const [tab, setTab] = useState('overview');
  const [rawSessions, setRawSessions] = useState([]);
  const [athlete, setAthlete] = useState(loadAthlete());
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const all = await getAllSessions();
    setRawSessions(all);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const sessions = useMemo(() => deriveSessions(rawSessions, athlete), [rawSessions, athlete]);
  const pmc = useMemo(() => computePMC(computeDailyLoad(sessions)), [sessions]);

  const updateAthlete = (next) => {
    setAthlete(next);
    saveAthlete(next);
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: C.ink }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 22px 60px' }}>
        <header style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: C.teal, fontWeight: 700, letterSpacing: 0.3 }}>Trainingsanalyse</div>
            <h1 style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>Athlete Dashboard</h1>
            <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
              {sessions.length
                ? `${sessions.length} Einheiten · ${sessions[0].date} bis ${sessions[sessions.length - 1].date} · alle Daten lokal im Browser`
                : 'Noch keine Daten – FIT-Dateien unten hochladen'}
            </div>
          </div>
          <button
            onClick={() => setShowSettings((v) => !v)}
            style={{
              background: 'transparent',
              border: `1px solid ${C.line}`,
              borderRadius: 9,
              color: C.ink,
              padding: '9px 16px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ⚙ Einstellungen
          </button>
        </header>

        <Upload onImported={reload} />
        {showSettings && <Settings athlete={athlete} onChange={updateAthlete} onClose={() => setShowSettings(false)} />}

        {loading ? (
          <div style={{ color: C.sub, padding: 40, textAlign: 'center' }}>Lade …</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 22, background: '#634e59', padding: 5, borderRadius: 12, width: '100%' }}>
              {TABS.map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  style={{
                    flex: 1,
                    border: 'none',
                    cursor: 'pointer',
                    padding: '9px 20px',
                    borderRadius: 9,
                    fontSize: 14,
                    fontWeight: 700,
                    background: tab === k ? C.panel : 'transparent',
                    color: tab === k ? C.ink : C.sub,
                    boxShadow: tab === k ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
                    transition: 'all .15s',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {tab === 'overview' && <Overview sessions={sessions} pmc={pmc} />}
            {tab === 'cycling' && <Cycling sessions={sessions} ftp={athlete.ftp} />}
            {tab === 'running' && <Running sessions={sessions} />}
            {tab === 'brick' && <Brick sessions={sessions} />}
          </>
        )}

        <footer style={{ marginTop: 30, fontSize: 11.5, color: C.sub, textAlign: 'center', lineHeight: 1.6 }}>
          FTP {athlete.ftp} W · Max-HF {athlete.maxHr} · Zonen wie Zepp-App
          <br />
          Kennzahlen nach TrainingPeaks/Coggan-Standard, berechnet aus deinen FIT-Zeitreihen. Rein lokal, kein Server.
        </footer>
      </div>
    </div>
  );
}
