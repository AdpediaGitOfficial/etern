import Link from 'next/link';
import { ReactNode } from 'react';
import { Breadcrumb } from '@/components/ui';
import type { Result } from '@/lib/backend';

/** The page shown when a record cannot be loaded: not found, or the server did not answer. */
export function LoadProblem({ result, plural, base, noun }: { result: Result<unknown>; plural: string; base: string; noun: string }) {
  const missing = result.ok || result.status === 404 || result.status === 400;
  return (
    <div className="dash">
      <Breadcrumb items={[{ label: plural, href: base }, { label: noun }]} />
      <div className="card"><div className="err" role="alert">
        <strong>{missing ? `${noun} not found` : `We couldn’t load this ${noun.toLowerCase()}.`}</strong>
        <span>{missing ? 'It may have been deleted.' : 'The server didn’t respond. Your data is safe.'}</span>
        <Link className="btn" href={base}>Back to {plural.toLowerCase()}</Link>
      </div></div>
    </div>
  );
}

export function EntityImage({ src, alt }: { src: string | null; alt: string }): ReactNode {
  if (!src) return null;
  return (
    <div className="proof">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
    </div>
  );
}

/** package/:id returns a one-item array; the other detail endpoints return the object itself. */
export function firstOf<T>(data: unknown): T | null {
  const v = Array.isArray(data) ? data[0] : data;
  return (v ?? null) as T | null;
}

