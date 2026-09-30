'use client';

import Link from 'next/link';
import type { Result } from '@/lib/backend';
import { Empty, PanelError } from '@/components/ui';
import { attentionItems } from '@/lib/attention';
import type { VideoRow } from '@/lib/types';

interface Props {
  expiring: Result<number>;
  expired: Result<number>;
  videos: Result<VideoRow[]>;
  retry: () => void;
  busy: boolean;
}

export default function AttentionCard({ expiring, expired, videos, retry, busy }: Props) {
  const checks = [expiring, expired, videos];
  const failed = checks.filter(c => !c.ok).length;
  const items = attentionItems(expiring, expired, videos);

  return (
    <div className="card">
      <h2>Needs attention</h2>
      <p className="muted">Most urgent first</p>
      {failed === checks.length ? (
        <PanelError onRetry={retry} busy={busy} />
      ) : (
        <>
          {items.length ? (
            <ul className="att">
              {items.map(i => (
                <li key={i.key}>
                  <span className={`att-dot ${i.tone}`} aria-hidden="true" />
                  <div className="att-t"><strong>{i.title}</strong><small className="muted">{i.hint}</small></div>
                  <Link className="btn sm" href={i.href}>{i.action}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="All clear" hint="No expiring subscriptions and no content problems right now." />
          )}
          {failed ? (
            <p className="att-note" role="status">Some checks could not load. <button type="button" className="link" onClick={retry} disabled={busy}>Try again</button></p>
          ) : null}
        </>
      )}
    </div>
  );
}
