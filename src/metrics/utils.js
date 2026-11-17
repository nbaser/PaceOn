// Kleine mathematische Helfer, die von mehreren Metrik-Modulen genutzt werden.

export function mean(values) {
  if (!values || !values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function round1(n) {
  return n == null ? null : Math.round(n * 10) / 10;
}

export function round2(n) {
  return n == null ? null : Math.round(n * 100) / 100;
}
