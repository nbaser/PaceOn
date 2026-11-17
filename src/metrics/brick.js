// Koppeleinheiten (Rad -> transition -> Lauf) landen als zwei getrennte
// Sessions mit demselben sourceFile in der DB (siehe parsing/normalize.js).
// Hier werden sie anhand des sourceFile wieder zu einer Brick-Einheit gruppiert.

export function groupBricks(sessions) {
  const bySource = new Map();
  sessions.forEach((s) => {
    if (!bySource.has(s.sourceFile)) bySource.set(s.sourceFile, []);
    bySource.get(s.sourceFile).push(s);
  });
  return [...bySource.values()]
    .filter((group) => group.some((s) => s.sport === 'cycling') && group.some((s) => s.sport === 'running'))
    .map((group) => [...group].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
}

export function transitionMinutes(group) {
  const bike = group.find((s) => s.sport === 'cycling');
  const run = group.find((s) => s.sport === 'running');
  if (!bike?.endTime || !run?.startTime) return null;
  return Math.max(0, (new Date(run.startTime) - new Date(bike.endTime)) / 60000);
}
