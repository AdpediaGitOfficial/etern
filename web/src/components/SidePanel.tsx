'use client';

import { ReactNode, useEffect, useRef } from 'react';
import Icon from './icons';

/** Right-hand details sheet built on <dialog>: focus stays inside, Escape and a click outside close it. */
export default function SidePanel({ open, title, subtitle, icon, onClose, footer, children }: {
  open: boolean; title: string; subtitle?: string; icon?: ReactNode; onClose: () => void; footer?: ReactNode; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="sheet-title" onCancel={e => { e.preventDefault(); onClose(); }}
            onClick={e => { if (e.target === ref.current) onClose(); }}>
      {open ? (
        <>
          <div className="sheet-head">
            {icon}
            <div className="grow">
              <h2 id="sheet-title">{title}</h2>
              {subtitle ? <p className="muted">{subtitle}</p> : null}
            </div>
            <button type="button" className="btn icon-only" onClick={onClose} aria-label="Close details"><Icon name="x" /></button>
          </div>
          <div className="sheet-body">{children}</div>
          {footer ? <div className="sheet-foot">{footer}</div> : null}
        </>
      ) : null}
    </dialog>
  );
}
