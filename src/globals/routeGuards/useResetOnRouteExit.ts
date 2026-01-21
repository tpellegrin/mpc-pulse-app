import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { useResetAnimations } from 'globals/context/AnimationSeen';

/**
 * Reset animation flags with `keyPrefix` when leaving a route subtree `routePrefix`.
 * Example: routePrefix "/flow/pulse", keyPrefix "pulse:" => clears when exiting the Pulse flow.
 */
export function useResetOnRouteExit(routePrefix: string, keyPrefix: string) {
  const { pathname } = useLocation();
  const reset = useResetAnimations();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const wasIn = prevPathRef.current.startsWith(routePrefix);
    const nowIn = pathname.startsWith(routePrefix);

    // Transitioned from inside → outside the flow
    if (wasIn && !nowIn) {
      reset(keyPrefix);
    }

    prevPathRef.current = pathname;
  }, [pathname, routePrefix, keyPrefix, reset]);
}
