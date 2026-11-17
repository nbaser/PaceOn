// Gemeinsame Design-Bausteine, aus dem Prototyp (training-dashboard.jsx)
// übernommen: dunkles Mauve/cremiges Gelb, Salbeigrün (Rad/Fitness),
// Korallrosa (Lauf/Warnwerte).

import { useEffect, useRef, useState } from 'react';

export const C = {
  bg: '#765d69',
  panel: '#856b76',
  ink: '#fefad4',
  sub: '#d8c9cf',
  line: '#8f7580',
  teal: '#a9cdbb',
  tealDeep: '#8fb9a8',
  tealLite: '#6f9585',
  sand: '#e6b96a',
  coral: '#f1828d',
  run: '#f1828d',
  cyc: '#a9cdbb',
};

export const ZONE_COLORS = ['#5f7a6b', '#8fb9a8', '#c4dcd1', '#e6b96a', '#f1828d'];
export const ZONE_LABELS = ['Z1 Erholung', 'Z2 Grundlage', 'Z3 Tempo', 'Z4 Schwelle', 'Z5 VO2max'];

export const tipStyle = {
  background: C.panel,
  border: `1px solid ${C.line}`,
  borderRadius: 10,
  fontSize: 12.5,
  color: C.ink,
  padding: '8px 10px',
};

export function fmtPace(p) {
  if (p == null) return '–';
  const m = Math.floor(p);
  const s = Math.round((p - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function shortDate(d) {
  if (!d) return '–';
  return d.slice(5).replace('-', '.');
}

const INFO_POPOVER_WIDTH = 200;

/** Kleines "i"-Icon, das per Klick einen Infotext daneben einblendet. */
export function InfoIcon({ text }) {
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState('right');
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    // Anchoring the popover's right edge to the icon would push it off the
    // left side of the viewport for tiles near the page's left edge.
    setAlign(rect.right - INFO_POPOVER_WIDTH < 8 ? 'left' : 'right');
  }, [open]);

  if (!text) return null;
  return (
    <span ref={wrapRef} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Info"
        style={{
          width: 15,
          height: 15,
          borderRadius: '50%',
          border: `1px solid ${C.sub}`,
          background: 'transparent',
          color: C.sub,
          fontSize: 9.5,
          fontWeight: 700,
          lineHeight: '13px',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        i
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            [align]: 0,
            zIndex: 20,
            width: INFO_POPOVER_WIDTH,
            background: C.bg,
            border: `1px solid ${C.line}`,
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 11.5,
            color: C.ink,
            lineHeight: 1.4,
            boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}

export function Stat({ label, value, unit, hint, accent, info }) {
  return (
    <div style={{ background: C.panel, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.line}`, flex: 1, minWidth: 130, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
        <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600 }}>{label}</div>
        <InfoIcon text={info} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent || C.ink, lineHeight: 1 }}>
        {value ?? '–'}
        <span style={{ fontSize: 14, fontWeight: 600, color: C.sub, marginLeft: 3 }}>{unit}</span>
      </div>
      {hint && <div style={{ fontSize: 11.5, color: C.sub, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

export function Panel({ title, note, children, right }) {
  return (
    <div style={{ background: C.panel, borderRadius: 16, padding: 20, border: `1px solid ${C.line}`, marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: C.ink, fontWeight: 700 }}>{title}</h3>
        {right}
      </div>
      {note && <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 14, maxWidth: 620 }}>{note}</div>}
      {children}
    </div>
  );
}

export function ZoneBar({ seconds, showLegend = true }) {
  const total = seconds.reduce((a, b) => a + b, 0) || 1;
  return (
    <div>
      <div style={{ display: 'flex', height: 26, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.line}` }}>
        {seconds.map(
          (s, i) =>
            s > 0 && (
              <div
                key={i}
                title={`${ZONE_LABELS[i]}: ${Math.round((s / total) * 100)}%`}
                style={{ width: `${(s / total) * 100}%`, background: ZONE_COLORS[i] }}
              />
            )
        )}
      </div>
      {showLegend && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 8 }}>
          {seconds.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.sub }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: ZONE_COLORS[i], display: 'inline-block' }} />
              {ZONE_LABELS[i]} · {Math.round((s / total) * 100)}%
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Einmalige, geteilte Legende für eine Liste von ZoneBar-Zeilen (Zonenfarben ändern sich nicht pro Einheit). */
export function ZoneLegend() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginBottom: 14, fontSize: 11, color: C.sub }}>
      {ZONE_LABELS.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: ZONE_COLORS[i], display: 'inline-block' }} />
          {label}
        </div>
      ))}
    </div>
  );
}

export const Legend = ({ c, t }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
    <span style={{ width: 14, height: 3, borderRadius: 2, background: c, display: 'inline-block' }} />
    {t}
  </span>
);

export function MiniSport({ label, n, tss, hrs, km, color, info }) {
  return (
    <div style={{ flex: 1, borderRadius: 12, border: `1px solid ${C.line}`, padding: 14, borderLeft: `4px solid ${color}`, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, color: C.ink }}>{label}</div>
        <InfoIcon text={info} />
      </div>
      <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.8 }}>
        <div>{n} Einheiten</div>
        <div>{Math.round(tss)} TSS gesamt</div>
        <div>
          {hrs.toFixed(1)} h · {km.toFixed(1)} km
        </div>
      </div>
    </div>
  );
}

export const Empty = ({ t }) => <div style={{ padding: 40, textAlign: 'center', color: C.sub }}>{t}</div>;
