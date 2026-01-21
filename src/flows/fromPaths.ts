import { flowPaths } from 'globals/paths';

// Reserved keys that should not be treated as step keys inside a flow object
const RESERVED_KEYS = new Set<string>(['_meta', '__order']);

type FlowMap = typeof flowPaths.flow;
export type FlowId = keyof FlowMap;

// A normalized view of a flow definition object
type FlowDef = { __order?: string[]; _meta?: unknown } & Record<string, string>;

/**
 * Parse the current pathname into flowId and step SEGMENT as it appears in the URL.
 * Expected shape: /flow/:flowId/:step
 */
export function parseFlowFromPath(pathname: string): {
  flowId?: string;
  step?: string;
} {
  const parts = pathname.split('/').filter(Boolean); // e.g. ['flow','calculator','income']
  if (parts[0] !== 'flow' || parts.length < 3)
    return { flowId: undefined, step: undefined };
  const flowId = parts[1];
  const step = parts[2]; // may be kebab-case (e.g., 'down-payment')
  return { flowId, step };
}

/**
 * Returns the ordered list of STEP KEYS for a given flow (object keys order or explicit __order).
 * These are the property names in paths.ts (e.g., 'downPayment'), not the URL segments.
 */
export function getOrderedStepKeys(flowId: FlowId): string[] {
  const def = flowPaths.flow[flowId] as unknown as FlowDef | undefined;
  if (!def) return [];
  const explicit: string[] | undefined = def.__order;
  const keys = explicit ?? Object.keys(def);
  return keys.filter((k) => !RESERVED_KEYS.has(k));
}

/**
 * Internal: Given a flow and a URL segment, find the corresponding step KEY from paths.ts.
 * Compares the last segment of each path value.
 */
function getKeyByPathSegment(flowId: FlowId, segment: string): string | null {
  const def = flowPaths.flow[flowId] as unknown as FlowDef | undefined;
  if (!def) return null;
  for (const [key, value] of Object.entries(def)) {
    if (RESERVED_KEYS.has(key)) continue;
    if (typeof value !== 'string') continue;
    const last = value.split('/').filter(Boolean).pop();
    if (last === segment) return key;
  }
  return null;
}

/**
 * Normalize a provided step (which could be a URL segment like 'down-payment') to a step KEY
 * as defined in paths.ts (e.g., 'downPayment'). If it already matches a key, it is returned.
 */
function ensureStepKey(flowId: FlowId, stepOrSegment: string): string {
  const steps = getOrderedStepKeys(flowId);
  if (steps.includes(stepOrSegment)) return stepOrSegment;
  const mapped = getKeyByPathSegment(flowId, stepOrSegment);
  return mapped ?? stepOrSegment;
}

export function getStepIndex(
  flowId: FlowId,
  step: string,
): { steps: string[]; idx: number } {
  const steps = getOrderedStepKeys(flowId);
  const key = ensureStepKey(flowId, step);
  return { steps, idx: steps.indexOf(key) };
}

export function getNextStepPath(flowId: FlowId, step: string): string | null {
  const { steps, idx } = getStepIndex(flowId, step);
  if (idx < 0) return null;
  const nextKey = steps[idx + 1];
  if (!nextKey) return null;
  const def = flowPaths.flow[flowId] as unknown as FlowDef | undefined;
  return def?.[nextKey] ?? null;
}

export function getPrevStepPath(flowId: FlowId, step: string): string | null {
  const { steps, idx } = getStepIndex(flowId, step);
  if (idx <= 0) return null;
  const prevKey = steps[idx - 1];
  const def = flowPaths.flow[flowId] as unknown as FlowDef | undefined;
  return def?.[prevKey] ?? null;
}
