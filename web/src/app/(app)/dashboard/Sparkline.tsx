/** Tiny trend line for a KPI card. Decorative detail, so the exact numbers live in the chart below. */
export default function Sparkline({ values, label }: { values: number[]; label: string }) {
  const W = 96, H = 30, PAD = 3;
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1; // a flat series draws a straight line, not NaN
  const points = values
    .map((v, i) => `${((i * (W - PAD * 2)) / (values.length - 1) + PAD).toFixed(1)},${(H - PAD - ((v - min) / span) * (H - PAD * 2)).toFixed(1)}`)
    .join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={label}>
      <polyline points={points} />
    </svg>
  );
}
