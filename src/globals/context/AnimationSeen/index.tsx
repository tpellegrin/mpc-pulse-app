import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// Simple, session-scoped map of "has animated" flags
export type SeenMap = Record<string, true>;

export type AnimationSeenContextValue = {
  hasSeen: (key: string) => boolean;
  markSeen: (key: string) => void;
  reset: (prefix?: string) => void; // when prefix provided, only keys starting with it are cleared
};

const STORAGE_KEY = 'animation-seen';

const AnimationSeenContext = createContext<AnimationSeenContextValue | null>(
  null,
);

export const AnimationSeenProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [seen, setSeen] = useState<SeenMap>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SeenMap) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    } catch {
      // ignore storage exceptions (quota, privacy, etc.)
    }
  }, [seen]);

  const hasSeen = useCallback((key: string) => !!seen[key], [seen]);

  const markSeen = useCallback((key: string) => {
    setSeen((s) => (s[key] ? s : { ...s, [key]: true as const }));
  }, []);

  const reset = useCallback((prefix?: string) => {
    setSeen((s) => {
      if (!prefix) return {};
      const next: SeenMap = {};
      for (const k of Object.keys(s)) {
        if (!k.startsWith(prefix)) next[k] = s[k];
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ hasSeen, markSeen, reset }),
    [hasSeen, markSeen, reset],
  );

  return (
    <AnimationSeenContext.Provider value={value}>
      {children}
    </AnimationSeenContext.Provider>
  );
};

export function useAnimationSeen(key: string) {
  const ctx = useContext(AnimationSeenContext);
  if (!ctx)
    throw new Error(
      'useAnimationSeen must be used within AnimationSeenProvider',
    );
  const firstRef = useRef(true);
  const shouldAnimate = !ctx.hasSeen(key);
  const mark = useCallback(() => ctx.markSeen(key), [ctx, key]);

  // If a consumer wants to optimistically mark immediately after mount when not animating,
  // they can call mark(). We keep it simple here and expose primitives.
  useEffect(() => {
    // no-op, but keep a ref example in case of future edge handling
    firstRef.current = false;
  }, []);

  return { shouldAnimate, mark } as const;
}

export function useResetAnimations() {
  const ctx = useContext(AnimationSeenContext);
  if (!ctx)
    throw new Error(
      'useResetAnimations must be used within AnimationSeenProvider',
    );
  return ctx.reset;
}
