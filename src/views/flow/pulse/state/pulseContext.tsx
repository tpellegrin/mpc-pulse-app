import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { PulseState } from './pulseTypes';
import { createInitialPulseState } from './pulseTypes';

const STORAGE_KEY = 'pulse:v1';

const PulseContext = createContext<{
  state: PulseState;
  setState: React.Dispatch<React.SetStateAction<PulseState>>;
}>({
  state: createInitialPulseState(),
  setState: () => {},
});

export const PulseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<PulseState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createInitialPulseState();
      const parsed = JSON.parse(raw) as Partial<PulseState>;
      // Merge with defaults to tolerate schema changes
      return { ...createInitialPulseState(), ...parsed };
    } catch {
      return createInitialPulseState();
    }
  });

  // Persist to localStorage during idle time to minimize jank
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // ignore write errors (quota, privacy mode, etc.)
      }
    };

    const w = window as any;
    if (typeof w.requestIdleCallback === 'function') {
      const handle = w.requestIdleCallback(run, { timeout: 600 });
      return () => {
        cancelled = true;
        if (typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(handle);
      };
    }

    const id = window.setTimeout(run, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [state]);

  const value = useMemo(() => ({ state, setState }), [state]);

  return (
    <PulseContext.Provider value={value}>{children}</PulseContext.Provider>
  );
};

export const usePulse = () => useContext(PulseContext);
