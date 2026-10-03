"use client";

import { useCallback, useMemo, useState } from "react";

function same(a: unknown, b: unknown) {
  if (a === b) return true;
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Form state as a set of edits layered over server values. The server copy can
 * refresh underneath (after any write re-fetches) without clobbering what the
 * user is typing, and "dirty" is simply the edits that differ from it.
 */
export function useDraft<T extends Record<string, unknown>>(base: T) {
  const [edits, setEdits] = useState<Partial<T>>({});

  const values = useMemo(() => ({ ...base, ...edits }) as T, [base, edits]);
  const dirtyKeys = useMemo(
    () => (Object.keys(edits) as (keyof T)[]).filter((k) => !same(edits[k], base[k])),
    [base, edits],
  );

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setEdits((e) => ({ ...e, [key]: value }));
  }, []);

  const reset = useCallback(() => setEdits({}), []);

  return { values, set, dirtyKeys, dirty: dirtyKeys.length > 0, isDirty: (k: keyof T) => dirtyKeys.includes(k), reset };
}
