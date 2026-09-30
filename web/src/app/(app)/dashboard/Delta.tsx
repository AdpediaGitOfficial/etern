import Icon from '@/components/icons';

/** Change against the previous period, e.g. "▲ 12%". Shown only when a comparison is available. */
export default function Delta({ cur, prev }: { cur: number; prev: number | undefined }) {
  if (prev === undefined) return null;
  if (prev === 0) return cur === 0 ? <span className="delta flat">No change</span> : <span className="delta up"><Icon name="trendUp" size={13} />New</span>;
  const pct = ((cur - prev) / prev) * 100;
  if (Math.abs(pct) < 0.05) return <span className="delta flat">No change</span>;
  return <span className={'delta ' + (pct >= 0 ? 'up' : 'dn')}><Icon name={pct >= 0 ? 'trendUp' : 'trendDown'} size={13} />{Math.abs(pct).toLocaleString('en-IN', { maximumFractionDigits: 1 })}%</span>;
}
