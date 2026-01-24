import { useEffect, useRef } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';

import { CenterOnlyTransition } from 'components/CenterOnlyTransition';
import { useFlowCenterDirection } from 'components/CenterOnlyTransition/useFlowCenterDirection';
import { TRANSITIONS } from 'utils/transitions/config';
import { useNavigation } from 'globals/context/NavigationContext';

/**
 * CenterAnimatedOutlet
 *
 * Keeps header/footer static by only animating the center content area.
 * Must remain mounted across route changes (used inside a persistent layout shell).
 *
 * Implementation detail:
 * - We LATCH the routeKey only while under "/flow/*". When exiting the flow,
 *   we keep the last flow key so CenterOnlyTransition does not re-arm on exit.
 */
export function CenterAnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();
  const direction = useFlowCenterDirection();
  const { setNextTransitionIntent } = useNavigation();

  // Latch the last flow-only route key. Only update it while under /flow.
  const isFlow = location.pathname.startsWith('/flow/');
  const flowRouteKeyRef = useRef<string>(location.key);
  if (isFlow && flowRouteKeyRef.current !== location.key) {
    flowRouteKeyRef.current = location.key;
  }
  const centerRouteKey = flowRouteKeyRef.current;

  // Consume the one-shot intent after we latch keys
  useEffect(() => {
    setNextTransitionIntent(null);
  }, [location.key, setNextTransitionIntent]);

  // TEMP: Bypass center transition shell for the Pulse Results page to avoid layout clamps
  if (location.pathname === '/flow/pulse/result') {
    return <>{outlet}</>;
  }

  return (
    <CenterOnlyTransition
      routeKey={centerRouteKey}
      direction={direction}
      duration={TRANSITIONS.duration.default}
      easing={TRANSITIONS.easing.smooth}
    >
      {outlet}
    </CenterOnlyTransition>
  );
}
