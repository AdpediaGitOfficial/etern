'use client';

import { useEffect } from 'react';

export interface ToastData { id: number; msg: string; tone?: 'good' | 'bad'; undo?: () => void }

/** Short confirmation at the bottom of the screen, with an optional Undo. Disappears after 6 seconds. */
export default function Toast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div className={'toast' + (toast.tone === 'bad' ? ' bad' : '')} role="status">
      <span>{toast.msg}</span>
      {toast.undo ? <button type="button" onClick={() => { toast.undo?.(); onClose(); }}>Undo</button> : null}
      <button type="button" className="toast-x" onClick={onClose} aria-label="Dismiss">✕</button>
    </div>
  );
}
