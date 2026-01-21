import React from 'react';

import { TRANSITIONS, prefersReducedMotion } from 'utils/transitions/config';
import { OverlayRoleContext } from './OverlayRoleContext';

import { CenterPhase, Props } from './types';
import { useCenterOnlyTransitionLogic } from './logic';
import {
  _CenterOnlyTransitionRoot,
  _CenterOnlyTransitionScene,
} from './styles';
import { useNavigation } from 'globals/context/NavigationContext';

export const CenterOnlyTransition = ({
  children,
  routeKey,
  direction,
  duration = TRANSITIONS.duration.default,
  easing = TRANSITIONS.easing.smooth,
}: Props) => {
  const reduceMotion = prefersReducedMotion();
  const { scrollRef } = useNavigation();

  // Single-mount active page
  const [active, setActive] = React.useState<{
    key: string;
    node: React.ReactNode;
  }>(() => ({
    key: routeKey,
    node: children,
  }));
  // Previous page overlay during exit
  const [exitOverlay, setExitOverlay] = React.useState<React.ReactNode | null>(
    null,
  );

  // Explicit phase (prevents mid-sequence re-arms)
  const [phase, setPhase] = React.useState<CenterPhase>('settled');

  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const activeRef = React.useRef<HTMLDivElement | null>(null);
  const exitRef = React.useRef<HTMLDivElement | null>(null);
  const [activeOverlay, setActiveOverlay] = React.useState(false);

  // On route change: lock height, swap nodes, set overlay phase
  React.useEffect(() => {
    if (active.key === routeKey) return;

    const el = stageRef.current;
    if (el) {
      // Lock to the actual center viewport height (the real scroller),
      // falling back to the current stage height if unavailable.
      const viewport = scrollRef.current;
      const h = viewport?.clientHeight || el.offsetHeight;
      el.style.height = `${h}px`;
    }

    setExitOverlay(active.node);
    setActive({ key: routeKey, node: children });
    setActiveOverlay(true);
    setPhase('overlay');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  // Drive the animation; includes fallback+watchdog and zero-flicker finalize
  useCenterOnlyTransitionLogic({
    activeOverlay,
    exitOverlay,
    setActiveOverlay,
    setExitOverlay,
    setPhase,
    duration,
    easing,
    direction,
    reduceMotion,
    stageRef,
    activeRef,
    exitRef,
  });

  return (
    <_CenterOnlyTransitionRoot ref={stageRef} data-center-phase={phase}>
      {/* Active scene (single mount). Renders as overlay during entering, then static. */}
      <OverlayRoleContext.Provider value={activeOverlay ? 'active' : 'static'}>
        <_CenterOnlyTransitionScene
          ref={activeRef}
          $overlay={activeOverlay}
          data-overlay={activeOverlay ? 'enter' : undefined}
          style={{ zIndex: activeOverlay ? 3 : 1 }}
          data-allow-motion={phase === 'overlay' ? true : undefined}
        >
          {active.node}
        </_CenterOnlyTransitionScene>
      </OverlayRoleContext.Provider>

      {/* Exit overlay: previous page slides out */}
      {exitOverlay ? (
        <OverlayRoleContext.Provider value="exit">
          <_CenterOnlyTransitionScene
            ref={exitRef}
            $overlay={true}
            data-overlay="exit"
            style={{ zIndex: 2 }}
            data-allow-motion={phase === 'overlay' ? true : undefined}
          >
            {exitOverlay}
          </_CenterOnlyTransitionScene>
        </OverlayRoleContext.Provider>
      ) : null}
    </_CenterOnlyTransitionRoot>
  );
};
