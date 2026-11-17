import { useCallback, useRef, useState } from 'react';
import { C } from './ui';
import { extractSessionsFromFile } from '../parsing/fitParser';
import { addSessionsIfNew } from '../store/db';

export default function Upload({ onImported }) {
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState(null); // { addedCount, skippedCount, errors: [] }
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith('.fit'));
      if (!files.length) {
        setStatus({ addedCount: 0, skippedCount: 0, errors: ['Keine .fit-Dateien ausgewählt.'] });
        return;
      }
      setBusy(true);
      let addedCount = 0;
      let skippedCount = 0;
      const errors = [];
      for (const file of files) {
        try {
          const sessions = await extractSessionsFromFile(file);
          if (!sessions.length) {
            errors.push(`${file.name}: keine auswertbare Session gefunden.`);
            continue;
          }
          const { added, skipped } = await addSessionsIfNew(sessions);
          addedCount += added.length;
          skippedCount += skipped.length;
        } catch (err) {
          errors.push(`${file.name}: ${err.message || 'Parsing fehlgeschlagen'}`);
        }
      }
      setBusy(false);
      setStatus({ addedCount, skippedCount, errors });
      if (addedCount > 0) onImported();
    },
    [onImported]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? C.teal : C.line}`,
          borderRadius: 14,
          padding: '26px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(169,205,187,0.08)' : C.panel,
          color: C.sub,
          transition: 'all .15s',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
          {busy ? 'Verarbeite FIT-Dateien …' : 'FIT-Dateien hierher ziehen oder klicken'}
        </div>
        <div style={{ fontSize: 12.5 }}>Mehrere Dateien möglich. Alles bleibt lokal im Browser.</div>
        <input
          ref={inputRef}
          type="file"
          accept=".fit"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
        />
      </div>
      {status && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: status.errors.length ? C.coral : C.sub }}>
          {status.addedCount > 0 && <span>{status.addedCount} Session(en) importiert. </span>}
          {status.skippedCount > 0 && <span>{status.skippedCount} bereits vorhanden (übersprungen). </span>}
          {status.errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}
    </div>
  );
}
