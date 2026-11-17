import { useState } from 'react';
import { C, Panel } from './ui';

const fieldStyle = {
  background: C.bg,
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  color: C.ink,
  padding: '8px 10px',
  fontSize: 14,
  width: 100,
};

const labelStyle = { fontSize: 12.5, color: C.sub, marginBottom: 4, display: 'block', fontWeight: 600 };

export default function Settings({ athlete, onChange, onClose }) {
  const [ftp, setFtp] = useState(athlete.ftp);
  const [maxHr, setMaxHr] = useState(athlete.maxHr);
  const [restHr, setRestHr] = useState(athlete.restHr);

  const save = () => {
    onChange({
      ...athlete,
      ftp: Number(ftp) || athlete.ftp,
      maxHr: Number(maxHr) || athlete.maxHr,
      restHr: Number(restHr) || athlete.restHr,
    });
    onClose();
  };

  return (
    <Panel
      title="Athleten-Einstellungen"
      note="FTP und HF-Werte fließen in alle Kennzahlen ein (IF, TSS, TRIMP, Zonen). Änderungen wirken sofort, ohne dass Dateien erneut importiert werden müssen."
      right={
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.sub, cursor: 'pointer', fontSize: 13 }}>
          Schließen
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>FTP (Watt)</label>
          <input style={fieldStyle} type="number" value={ftp} onChange={(e) => setFtp(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Max-HF (bpm)</label>
          <input style={fieldStyle} type="number" value={maxHr} onChange={(e) => setMaxHr(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Ruhe-HF (bpm)</label>
          <input style={fieldStyle} type="number" value={restHr} onChange={(e) => setRestHr(e.target.value)} />
        </div>
      </div>
      <button
        onClick={save}
        style={{
          background: C.tealDeep,
          border: 'none',
          borderRadius: 9,
          color: '#2c3a34',
          fontWeight: 700,
          padding: '9px 18px',
          cursor: 'pointer',
          fontSize: 13.5,
        }}
      >
        Speichern
      </button>
    </Panel>
  );
}
