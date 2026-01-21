import { useEffect } from 'react';
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
 */
export function CenterAnimatedOutlet() {
  const outlet = useOutlet();
  const { key } = useLocation();
  const direction = useFlowCenterDirection();
  const { setNextTransitionIntent } = useNavigation();

  // Consume the one-shot intent after we latch the route key
  useEffect(() => {
    setNextTransitionIntent(null);
  }, [key, setNextTransitionIntent]);

  return (
    <CenterOnlyTransition
      routeKey={key}
      direction={direction}
      duration={TRANSITIONS.duration.default}
      easing={TRANSITIONS.easing.smooth}
    >
      {outlet}
    </CenterOnlyTransition>
  );
}
