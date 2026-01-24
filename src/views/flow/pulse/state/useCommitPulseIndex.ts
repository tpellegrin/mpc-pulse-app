import React from 'react';
import { usePulse } from './pulseContext';
import type { PulseState } from './pulseTypes';

/**
 * Reusable commit helper for Pulse screens that store an integer index selection.
 *
 * Behavior:
 * - Rounds the incoming value to nearest integer and clamps to [0, imagesLength - 1]
 * - No-ops if the value hasn't changed (avoids needless renders and storage writes)
 * - Defers provider write with double requestAnimationFrame to avoid transition flicker
 */
export function useCommitPulseIndex<K extends keyof PulseState>(
  key: K,
  imagesLength: number,
) {
  const { setState } = usePulse();

  return React.useCallback(
    (raw: number | null | undefined) => {
      const idx = Math.round(raw ?? 0);
      const clamped = Math.max(0, Math.min(Math.max(1, imagesLength) - 1, idx));

      const run = () =>
        setState((s) => {
          const prev = s[key] as unknown as number | null | undefined;
          if (prev === clamped) return s;
          return { ...s, [key]: clamped } as PulseState;
        });

      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => requestAnimationFrame(run));
      } else {
        setTimeout(run, 32);
      }
    },
    [imagesLength, key, setState],
  );
}
