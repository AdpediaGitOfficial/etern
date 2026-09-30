'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, listOf } from './api';

export interface Option { value: string; label: string }

/** Loads dropdown options from a list endpoint. Pass `null` to skip loading (e.g. until a parent value is chosen). */
export function useOptions<T extends { _id: string }>(path: string | null, label: (row: T) => string) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!path) { setOptions([]); setLoading(false); setError(false); return; }
    setLoading(true);
    setError(false);
    const r = await api<{ result: unknown }>(path);
    if (r.ok) setOptions(listOf<T>(r.body?.result).map(row => ({ value: row._id, label: label(row) })));
    else setError(true);
    setLoading(false);
    // `label` is a stable inline mapper in every caller; the path is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => { load(); }, [load]);
  return { options, loading, error, reload: load };
}

/** Keeps the currently saved value selectable even if the list (e.g. "active only") no longer contains it. */
export function withCurrent(options: Option[], current?: Option | null): Option[] {
  return current && !options.some(o => o.value === current.value) ? [current, ...options] : options;
}
