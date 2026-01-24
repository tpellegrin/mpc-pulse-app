import type { PulseState } from './pulseTypes';

export type PulseTag = 'intro' | `q${number}`;

/**
 * Maps a Pulse page tag to its corresponding key in PulseState.
 * - 'intro' -> 'introMorphIndex'
 * - 'qN'    -> 'qNIndex'
 */
export function pulseKeyFor(tag: PulseTag): keyof PulseState {
  if (tag === 'intro') return 'introMorphIndex';
  // tag is like 'q2', 'q3', ... 'q19'
  return `${tag}Index` as keyof PulseState;
}

/**
 * Returns the persisted last-frame key used by the GL morph component
 * so each page restores its last visual frame independently.
 */
export function persistKeyFor(tag: PulseTag): string {
  if (tag === 'intro') return 'pulse-intro';
  return `pulse-${tag}`;
}

/**
 * Reads the stored selection from a PulseState object for a given tag.
 */
export function getSelectionFromState(
  state: PulseState,
  tag: PulseTag,
): number | null {
  const key = pulseKeyFor(tag);
  const val = state[key] as unknown as number | null | undefined;
  return typeof val === 'number' ? val : null;
}

/**
 * Reads the stored selection directly from localStorage (if available),
 * without requiring React context. Useful in non-React modules or
 * outside the provider tree.
 */
export function getStoredSelection(tag: PulseTag): number | null {
  try {
    const raw = localStorage.getItem('pulse:v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PulseState> | undefined;
    if (!parsed) return null;
    const key = pulseKeyFor(tag);
    const val = (parsed as any)[key] as number | null | undefined;
    return typeof val === 'number' ? val : null;
  } catch {
    return null;
  }
}
