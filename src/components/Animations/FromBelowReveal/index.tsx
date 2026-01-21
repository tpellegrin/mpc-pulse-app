import React from 'react';

import { TRANSITIONS, prefersReducedMotion } from 'utils/transitions/config';
import { OverlayRoleContext } from 'components/CenterOnlyTransition/OverlayRoleContext';

import { _FromBelowRevealRoot } from './styles';
import { Props, RevealVars } from './types';

export const FromBelowReveal: React.FC<Props> = ({
  children,
  in: isIn = true,
  disabled = false,
  onReveal,
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

  const [active, setActive] = React.useState<boolean>(false);

  // Activate immediately when disabled or in exit overlay
  React.useLayoutEffect(() => {
    if (disabled || isExit) {
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
  }, [isIn, reduced, isExit, disabled]);

  // Fire onReveal once, when first visible
  const onRevealRef = React.useRef(onReveal);
  React.useEffect(() => {
    onRevealRef.current = onReveal;
  }, [onReveal]);
  const firedRef = React.useRef(false);
  React.useEffect(() => {
    if (!firedRef.current && (disabled || (active && isIn))) {
      firedRef.current = true;
      onRevealRef.current?.();
    }
  }, [active, isIn, disabled]);

  // Force zero reveal delay on exit overlays or when disabled
  const mergedStyle: React.CSSProperties & RevealVars = disabled || isExit
    ? { ...(style ?? {}), ['--reveal-delay']: '0ms' }
    : (style as React.CSSProperties & RevealVars);

  const freeze = isExit || disabled; // disable transitions and keep final state

  return (
    <_FromBelowRevealRoot
      as={as}
      className={className}
      style={mergedStyle}
      $duration={disabled ? 0 : durationMs}
      $delay={disabled ? 0 : delayMs}
      $offset={yOffset}
      $easing={easing}
      $reduced={reduced}
      $active={(disabled || active) && isIn}
      $freeze={freeze}
      aria-hidden={!isIn}
      data-allow-motion
      data-reveal
    >
      {children}
    </_FromBelowRevealRoot>
  );
};
