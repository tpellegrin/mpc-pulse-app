import React from 'react';
import { useResetOnRouteExit } from './useResetOnRouteExit';

const PULSE_ROUTE_PREFIX = '/flow/pulse';
const PULSE_ANIM_KEY_PREFIX = 'pulse:';

/**
 * Mounted under Router. Clears Pulse animation flags when navigating out of the Pulse flow subtree.
 */
export function PulseExitAnimationReset() {
  useResetOnRouteExit(PULSE_ROUTE_PREFIX, PULSE_ANIM_KEY_PREFIX);
  return null;
}
