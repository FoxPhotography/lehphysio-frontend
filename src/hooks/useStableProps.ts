import { useLayoutEffect, useRef } from 'react';

/**
 * Returns the same object shape, but every function prop is replaced by a wrapper whose
 * identity never changes and that always calls the latest version.
 *
 * App.tsx recreates its handlers on every render; passing them through this lets
 * React.memo'd children (feed cards, chat rows) skip re-rendering when only App's
 * unrelated state changed, without stale closures.
 */
export function useStableProps<T extends Record<string, any>>(props: T): T {
  const latest = useRef(props);
  const wrappers = useRef<Record<string, (...args: any[]) => any>>({});

  useLayoutEffect(() => {
    latest.current = props;
  });
  // Also update synchronously so callbacks invoked during this render see fresh values.
  latest.current = props;

  const out: Record<string, any> = {};
  for (const key of Object.keys(props)) {
    const value = props[key];
    if (typeof value === 'function') {
      if (!wrappers.current[key]) {
        wrappers.current[key] = (...args: any[]) => latest.current[key](...args);
      }
      out[key] = wrappers.current[key];
    } else {
      out[key] = value;
    }
  }
  return out as T;
}
