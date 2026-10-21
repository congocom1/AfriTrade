export const REFRESH_THRESHOLD = 76;

/** Distance and axis lock used by touch pull-to-refresh. */
export function pullDistance(start, current) {
  if (!start || !current) return 0;
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  return dy > 8 && dy > Math.abs(dx) * 1.25 ? Math.min(112, dy * 0.55) : 0;
}
