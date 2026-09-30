'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Notice } from '@/components/ui';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { imageProblem } from '@/lib/validate';
import type { PackageWithCosts } from '@/lib/types';

const today = () => new Date().toISOString().slice(0, 10);

export default function PaymentForm({ studentId, studentName }: { studentId: string; studentName: string }) {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageWithCosts[] | null>(null);
  const [pkgError, setPkgError] = useState(false);
  const [pkgId, setPkgId] = useState('');
  const [costId, setCostId] = useState('');
  const [ref, setRef] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadPackages() {
    setPkgError(false);
    const r = await api<{ result?: PackageWithCosts[] }>('package/allAdmin?isActive=true');
    if (r.ok) setPackages(r.body?.result ?? []);
    else setPkgError(true);
  }
  useEffect(() => { loadPackages(); }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function onFile(f: File | undefined) {
    setFileError('');
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    if (!f) return;
    const problem = imageProblem(f);
    if (problem) { setFileError(problem); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function pickCost(pkg: PackageWithCosts, costId: string, price: number) {
    setPkgId(pkg._id);
    setCostId(costId);
    if (!amount) setAmount(String(price)); // editable: the amount actually received can differ
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (ref.trim().length < 3) err.ref = 'Enter the payment reference (at least 3 characters).';
    if (!date) err.date = 'Choose the date the payment was made.';
    else if (date > today()) err.date = 'The payment date cannot be in the future.';
    if (!amount || Number(amount) <= 0) err.amount = 'Enter the amount received.';
    if (!pkgId || !costId) err.pkg = 'Select a package and a price.';
    setErrors(err);
    setSubmitError('');
    if (Object.keys(err).length || fileError) return;

    const fd = new FormData();
    fd.append('paymentRef', ref.trim());
    fd.append('paymentDate', date);
    fd.append('amount', amount);
    fd.append('packageId', pkgId);
    fd.append('packageCostId', costId);
    fd.append('comment', remarks);
    fd.append('studentId', studentId);
    if (file) fd.append('image', file);

    setBusy(true);
    const r = await api('subscription/add-offline-payment', { method: 'POST', body: fd }, 'The payment could not be saved. Check the details and try again.');
    if (r.ok) { router.push('/offline-payments?added=1'); return; }
    setSubmitError(r.message);
    setBusy(false);
  }

  return (
    <form className="card form" onSubmit={onSubmit} noValidate>
      <p className="who">Recording a payment for <strong>{studentName}</strong></p>
      {submitError ? <Notice tone="bad">{submitError}</Notice> : null}

      <div className="f-grid">
        <label>Payment reference number
          <input value={ref} onChange={e => setRef(e.target.value)} aria-invalid={Boolean(errors.ref)} autoFocus />
          {errors.ref ? <span className="f-err">{errors.ref}</span> : null}
        </label>
        <label>Paid date
          <input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} aria-invalid={Boolean(errors.date)} />
          {errors.date ? <span className="f-err">{errors.date}</span> : null}
        </label>
        <label>Amount received (₹)
          <input type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} aria-invalid={Boolean(errors.amount)} />
          {errors.amount ? <span className="f-err">{errors.amount}</span> : null}
        </label>
        <label>Payment proof (JPEG or PNG, up to 2 MB)
          <input type="file" accept="image/png,image/jpeg" onChange={e => onFile(e.target.files?.[0])} />
          {fileError ? <span className="f-err">{fileError}</span> : null}
        </label>
        {preview ? (
          <div className="preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Selected payment proof preview" />
          </div>
        ) : null}
        <label className="wide">Remarks (optional)
          <textarea rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} />
        </label>
      </div>

      <fieldset className="pkgs">
        <legend>Package</legend>
        {errors.pkg ? <span className="f-err">{errors.pkg}</span> : null}
        {pkgError ? (
          <div className="err" role="alert"><strong>We couldn’t load packages.</strong><button type="button" className="btn" onClick={loadPackages}>Try again</button></div>
        ) : !packages ? (
          <div className="skel" aria-busy="true"><i /><i /></div>
        ) : !packages.length ? (
          <div className="empty"><strong>No active packages</strong><span>Activate a package before recording a payment.</span></div>
        ) : (
          <div className="pkg-grid">
            {packages.map(p => (
              <div key={p._id} className={'pkg' + (p._id === pkgId ? ' sel' : '')}>
                <strong>{p.packageName}</strong>
                {p.description ? <small className="muted">{p.description}</small> : null}
                <div className="costs" role="radiogroup" aria-label={`${p.packageName} price`}>
                  {(p.packageCosts ?? []).map(c => (
                    <button key={c._id} type="button" role="radio" aria-checked={c._id === costId}
                            className={'btn sm' + (c._id === costId ? ' primary' : '')} onClick={() => pickCost(p, c._id, c.price)}>
                      {inr(c.price)}{c.validity ? ` · ${c.validity} days` : ''}
                    </button>
                  ))}
                  {!(p.packageCosts ?? []).length ? <small className="muted">No prices set</small> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </fieldset>

      <div className="acts">
        <Link className="btn" href="/users">Cancel</Link>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save payment'}</button>
      </div>
    </form>
  );
}
