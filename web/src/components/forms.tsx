'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { imageProblem } from '@/lib/validate';

export function Field({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={wide ? 'wide' : undefined}>
      {label}
      {children}
      {error ? <span className="f-err" role="alert">{error}</span> : null}
    </label>
  );
}

export function TextInput({ value, onChange, error, ...rest }: { value: string; onChange: (v: string) => void; error?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return <input {...rest} value={value} onChange={e => onChange(e.target.value)} aria-invalid={Boolean(error)} />;
}

export function Select({ value, onChange, options, placeholder, error, disabled }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
  placeholder?: string; error?: string; disabled?: boolean;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} aria-invalid={Boolean(error)} disabled={disabled}>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export const STATUS_OPTIONS = [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }];
export const KIND_OPTIONS = [{ value: 'kid', label: 'Kid' }, { value: 'parent', label: 'Parent' }];

/** Image input with type/size checks and a preview. `existingUrl` shows the saved image when editing. */
export function ImagePicker({ file, onFile, existingUrl }: { file: File | null; onFile: (f: File | null) => void; existingUrl?: string }) {
  const [problem, setProblem] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(f: File | undefined) {
    if (!f) { setProblem(''); onFile(null); return; }
    const p = imageProblem(f);
    setProblem(p);
    onFile(p ? null : f);
  }

  const shown = preview ?? existingUrl ?? null;
  return (
    <>
      <Field label="Image (JPEG or PNG, up to 2 MB)" error={problem}>
        <input type="file" accept="image/png,image/jpeg" onChange={e => pick(e.target.files?.[0])} />
      </Field>
      {shown ? (
        <div className="preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shown} alt={preview ? 'Selected image preview' : 'Current image'} />
        </div>
      ) : null}
    </>
  );
}

/** Standard form chrome: error banner, action buttons, no native validation bubbles. */
export function FormFrame({ onSubmit, error, busy, cancelHref, saveLabel, children }: {
  onSubmit: (e: React.FormEvent) => void; error: string; busy: boolean; cancelHref: string; saveLabel: string; children: ReactNode;
}) {
  return (
    <form className="card form" onSubmit={onSubmit} noValidate>
      {error ? <div className="banner bad" role="alert">{error}</div> : null}
      {children}
      <div className="acts">
        <Link className="btn" href={cancelHref}>Cancel</Link>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving…' : saveLabel}</button>
      </div>
    </form>
  );
}
