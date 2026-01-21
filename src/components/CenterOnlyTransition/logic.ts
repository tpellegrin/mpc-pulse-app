import React from 'react';

import { HookConfig } from './types';

const getAnimatedTarget = (root: HTMLElement | null): HTMLElement | null => {
  if (!root) return null;
  const content = root.querySelector('[data-center-content]');
  return (content as HTMLElement) ?? root;
};

export function useCenterOnlyTransitionLogic(cfg: HookConfig) {
  const {
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
  } = cfg;

  const isAnimatingRef = React.useRef(false);

  React.useLayoutEffect(() => {
    if (!activeOverlay && !exitOverlay) return;
    if (isAnimatingRef.current) return;

    const activeNode = activeRef.current;
    const exitNode = exitRef.current;
    const enterTarget = getAnimatedTarget(activeNode);
    const exitTarget = getAnimatedTarget(exitNode);

    const effectiveDuration = reduceMotion ? 0 : duration;

    // No-motion path (still unlock height & settle)
    if (effectiveDuration <= 0) {
      setActiveOverlay(false);
      setExitOverlay(null);
      const stageEl = stageRef.current;
      if (stageEl) stageEl.style.height = '';
      setPhase('settled');
      return;
    }

    const animatedElements: HTMLElement[] = [];
    if (enterTarget) animatedElements.push(enterTarget);
    if (exitTarget) animatedElements.push(exitTarget);

    isAnimatingRef.current = true;

    for (const element of animatedElements) {
      element.style.setProperty(
        '--transition-duration',
        `${effectiveDuration}ms`,
      );
      element.style.setProperty('--transition-easing', `${easing}`);
      element.style.willChange = 'transform';
      element.style.backfaceVisibility = 'hidden';
    }

    const outX = -direction * 100;
    const inX = direction * 100;

    // 1) Start with no transition (CSS keeps enter offscreen by default)
    if (exitTarget) {
      exitTarget.style.transition = 'none';
      exitTarget.style.transform = 'translate3d(0, 0, 0)';
    }
    if (enterTarget) {
      enterTarget.style.transition = 'none';
      enterTarget.style.transform = `translate3d(${inX}%, 0, 0)`;
    }

    // 2) Reflow — still inside layout effect, before paint
    if (enterTarget) void enterTarget.getBoundingClientRect();
    if (exitTarget) void exitTarget.getBoundingClientRect();

    // 3) Apply final transforms with transition — animation starts immediately on first paint
    if (exitTarget) {
      exitTarget.style.transition = `transform var(--transition-duration) var(--transition-easing)`;
      exitTarget.style.transform = `translate3d(${outX}%, 0, 0)`;
    }
    if (enterTarget) {
      enterTarget.style.transition = `transform var(--transition-duration) var(--transition-easing)`;
      enterTarget.style.transform = 'translate3d(0, 0, 0)';
    }

    let finishedCount = 0;
    const expectedEnds = animatedElements.length;
    let didFinalize = false;

    const finalize = () => {
      if (didFinalize) return;
      didFinalize = true;

      const stageEl = stageRef.current;
      if (stageEl) {
        const measured = stageEl.offsetHeight;
        stageEl.style.minHeight = `${measured}px`;
      }

      if (enterTarget) enterTarget.style.willChange = 'transform';

      // T+1 remove exit
      requestAnimationFrame(() => {
        setExitOverlay(null);

        // T+2 demote active; freeze transitions
        requestAnimationFrame(() => {
          if (activeNode) {
            activeNode.style.transition = 'none';
            activeNode.style.animation = 'none';
            void activeNode.getBoundingClientRect();
          }
          if (enterTarget) {
            enterTarget.style.transition = 'none';
            enterTarget.style.transform = 'translate3d(0, 0, 0)';
            void enterTarget.getBoundingClientRect();
          }
          setActiveOverlay(false);

          // T+3 unlock + cleanup
          requestAnimationFrame(() => {
            if (stageEl) {
              stageEl.style.height = '';
              stageEl.style.minHeight = '';
            }
            for (const element of animatedElements) {
              element.style.transition = '';
              element.style.willChange = '';
              element.style.backfaceVisibility = '';
              element.style.removeProperty('--transition-duration');
              element.style.removeProperty('--transition-easing');
            }
            if (enterTarget) {
              enterTarget.style.willChange = 'auto';
              void enterTarget.getBoundingClientRect();
            }
            if (activeNode) {
              activeNode.style.transition = '';
              activeNode.style.animation = '';
            }

            setPhase('settled');
            isAnimatingRef.current = false;
          });
        });
      });
    };

    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'transform') return;
      finishedCount += 1;
      if (finishedCount >= expectedEnds) finalize();
    };

    for (const element of animatedElements) {
      element.addEventListener('transitionend', handleTransitionEnd);
    }

    // Timers (const; cleaned up in return)
    const fallbackTimer = window.setTimeout(finalize, effectiveDuration + 50);
    const watchdogTimer = window.setTimeout(() => {
      if (isAnimatingRef.current) {
        // eslint-disable-next-line no-console
        console.warn(
          '[CenterOnlyTransition] Animation exceeded expected duration; forcing finalize.',
        );
        finalize();
      }
    }, effectiveDuration + 200);

    return () => {
      if (!isAnimatingRef.current) {
        for (const element of animatedElements) {
          element.removeEventListener('transitionend', handleTransitionEnd);
        }
      }
      clearTimeout(fallbackTimer);
      clearTimeout(watchdogTimer);
    };
  }, [
    activeOverlay,
    exitOverlay,
    duration,
    easing,
    direction,
    reduceMotion,
    setActiveOverlay,
    setExitOverlay,
    setPhase,
    stageRef,
    activeRef,
    exitRef,
  ]);
}
