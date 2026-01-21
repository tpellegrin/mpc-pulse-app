import React from 'react';

import { TRANSITIONS, prefersReducedMotion } from 'utils/transitions/config';
import { OverlayRoleContext } from 'components/CenterOnlyTransition/OverlayRoleContext';

import { _FromBelowRevealRoot } from './styles';
import { Props, RevealVars } from './types';

export const FromBelowReveal: React.FC<Props> = ({
  children,
  in: isIn = true,
  delayMs = TRANSITIONS.delay.none,
  durationMs = TRANSITIONS.duration.fast,
  yOffset = 16,
  easing = TRANSITIONS.easing.default,
  className,
  style,
  as,
}) => {
  const reduced = prefersReducedMotion();
  const overlayRole = React.useContext(OverlayRoleContext); // 'active' | 'static' | 'exit'
  const isExit = overlayRole === 'exit';
  const freeze = isExit;

  const [active, setActive] = React.useState<boolean>(false);

  React.useLayoutEffect(() => {
    // If we are rendering in the exit overlay, show immediately without waiting for RAF
    if (isExit) {
      setActive(true);
      return;
    }

    let raf = 0;
    if (!isIn) {
      setActive(false);
      return;
    }

    if (reduced) {
      setActive(true);
      return;
    }

    raf = window.requestAnimationFrame(() => setActive(true));
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [isIn, reduced, isExit]);

  // Force zero reveal delay on exit overlays (defensive; no transition is expected when already active)
  const mergedStyle: React.CSSProperties & RevealVars = isExit
    ? { ...(style ?? {}), ['--reveal-delay']: '0ms' }
    : (style as React.CSSProperties & RevealVars);

  return (
    <_FromBelowRevealRoot
      as={as}
      className={className}
      style={mergedStyle}
      $duration={durationMs}
      $delay={delayMs}
      $offset={yOffset}
      $easing={easing}
      $reduced={reduced}
      $active={active && isIn}
      $freeze={freeze}
      aria-hidden={!isIn}
      data-allow-motion
      data-reveal
    >
      {children}
    </_FromBelowRevealRoot>
  );
};
