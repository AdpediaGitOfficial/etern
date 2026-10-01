'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

interface ShellState { navOpen: boolean; setNavOpen: (open: boolean) => void }
const ShellContext = createContext<ShellState>({ navOpen: false, setNavOpen: () => undefined });

/** Shared state for the mobile navigation drawer: the top bar's menu button opens it, the sidebar renders it. */
export function ShellProvider({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const path = usePathname();

  useEffect(() => setNavOpen(false), [path]); // close after choosing a page
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  const value = useMemo(() => ({ navOpen, setNavOpen }), [navOpen]);
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export const useShell = () => useContext(ShellContext);
