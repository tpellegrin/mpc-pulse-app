import React from 'react';
import type { LottieSegment, LottieStartAt } from './types';

export type LottieEmojiProps = {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  renderer?: 'svg' | 'canvas';
  // control from parent – if true, play; otherwise pause/stop
  play?: boolean;
  // start and playback controls
  startAt?: LottieStartAt;
  playSegment?: LottieSegment;
  restartOnPlay?: boolean;
  freezeOnEnd?: boolean;
  delay?: number; // delay (ms) before starting playback
  // optional smooth finish controls
  endSlowdownFrames?: number;
  endSlowdownMinSpeed?: number;
  endSlowdownCurve?: 'linear' | 'easeOutCubic';
  endWrapSpeed?: number;
  className?: string;
  style?: React.CSSProperties;
};

/*
  Lightweight Lottie player wrapper
  - Lazy-loads lottie-web only when needed
  - Cleans up animations on unmount
  - Responds to prop changes (play, speed)
  - Respects prefers-reduced-motion
*/
export const LottieEmoji: React.FC<LottieEmojiProps> = ({
  src,
  loop = true,
  autoplay = false,
  speed = 1,
  renderer = 'svg',
  play = false,
  // new advanced controls
  startAt,
  playSegment,
  restartOnPlay = false,
  freezeOnEnd,
  delay = 0,
  // smooth finish controls (all optional)
  endSlowdownFrames,
  endSlowdownMinSpeed,
  endSlowdownCurve,
  endWrapSpeed,
  className,
  style,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const animationRef = React.useRef<any | null>(null);
  const [lottieMod, setLottieMod] = React.useState<any | null>(null);
  const wasPlayingRef = React.useRef<boolean>(false);
  const playRef = React.useRef<boolean>(play);
  const delayTimerRef = React.useRef<number | null>(null);
  // track the base (requested) speed to allow temporary overrides and restore
  const baseSpeedRef = React.useRef<number>(speed ?? 1);
  // true only while we are running the post-complete wrap segment
  const isWrappingRef = React.useRef<boolean>(false);
  // store enterFrame handler so we can remove it on cleanup
  const enterFrameHandlerRef = React.useRef<((...args: any[]) => void) | null>(
    null,
  );

  // easing helper for slowdown
  const easeOutCubic = React.useCallback(
    (t: number) => 1 - Math.pow(1 - t, 3),
    [],
  );

  const clearDelayTimer = React.useCallback(() => {
    if (delayTimerRef.current != null) {
      try {
        window.clearTimeout(delayTimerRef.current);
      } catch {}
      delayTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    playRef.current = !!play;
  }, [play]);

  // Helper: resolve a marker name to an absolute frame
  const resolveMarkerFrame = React.useCallback((name: string) => {
    const anim = animationRef.current;
    if (
      !anim ||
      !anim.animationData ||
      !Array.isArray(anim.animationData.markers)
    )
      return null;
    const m = anim.animationData.markers.find((mk: any) => mk.cm === name);
    return m ? Math.round(m.tm) : null;
  }, []);

  // Helper: compute a frame from startAt
  const frameFromStartAt = React.useCallback((): number | null => {
    const anim = animationRef.current;
    // startAt is provided via props; compute lazily when animation is ready
    if (!anim || !startAt) return null;
    const total = Math.max(0, Math.round(anim.totalFrames ?? 0));
    const last = Math.max(0, total - 1);
    if ('frame' in startAt)
      return Math.max(0, Math.min(last, Math.round(startAt.frame)));
    if ('progress' in startAt)
      return Math.max(0, Math.min(last, Math.round(last * startAt.progress)));
    if ('marker' in startAt) {
      const m = resolveMarkerFrame(startAt.marker);
      return m == null ? 0 : Math.max(0, Math.min(last, m));
    }
    return null;
  }, [startAt, resolveMarkerFrame]);

  // Helper: resolve a segment definition to [from, to] in frames
  const segmentFrames = React.useCallback((): [number, number] | null => {
    const anim = animationRef.current;
    if (!anim || !playSegment) return null;
    if (Array.isArray(playSegment)) return playSegment;
    const from = resolveMarkerFrame(playSegment.fromMarker);
    const to = resolveMarkerFrame(playSegment.toMarker);
    return from != null && to != null ? [from, to] : null;
  }, [playSegment, resolveMarkerFrame]);

  // Reduced motion preference
  const prefersReducedMotion = React.useMemo(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    )
      return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Lazy-load lottie-web once per component instance
  React.useEffect(() => {
    let mounted = true;
    import('lottie-web')
      .then((mod) => {
        if (!mounted) return;
        setLottieMod(mod.default ?? mod);
      })
      .catch(() => {
        // Fail silently; in production we don't want to break the UI if lottie fails to load
        setLottieMod(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize animation when we have lottie and a container
  React.useEffect(() => {
    if (!lottieMod || !containerRef.current) return;

    // Destroy an existing animation before creating a new one
    if (animationRef.current) {
      try {
        animationRef.current.destroy();
      } catch {}
      animationRef.current = null;
    }

    const lottie = lottieMod;
    try {
      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer,
        loop,
        autoplay: false, // control start manually below
        path: src,
      });
      animationRef.current = anim;
      baseSpeedRef.current = speed ?? 1;
      anim.setSpeed(baseSpeedRef.current);

      const onDataReady = () => {
        const initial = frameFromStartAt();
        if (prefersReducedMotion) {
          // Reduced motion: show configured pose (or first frame)
          try {
            anim.goToAndStop(initial ?? 0, true);
          } catch {}
          return;
        }

        // Always set to the initial pose first
        try {
          anim.goToAndStop(initial ?? 0, true);
        } catch {}

        // tail slowdown config (opt-in); clamp ranges
        const slowdownFrames = Math.max(0, Math.round(endSlowdownFrames ?? 0));
        const slowdownMin = Math.max(
          0.01,
          Math.min(1, endSlowdownMinSpeed ?? 0.25),
        );
        const slowdownCurve = endSlowdownCurve ?? 'easeOutCubic';

        // Enter-frame speed adjustment near the end (only when loop=false)
        let slowed = false;
        const onEnterFrame = () => {
          if (loop) return; // only meaningful when not looping
          if (!slowdownFrames) return;
          if (!playRef.current) return; // don't adjust when not playing
          if (isWrappingRef.current) return; // don't interfere with wrap segment

          const seg = segmentFrames();
          const total = Math.max(0, Math.round(anim.totalFrames ?? 0));
          const last = Math.max(0, total - 1);
          const endFrame = seg ? Math.max(0, Math.min(last, seg[1])) : last;
          const current = Math.max(0, Math.round(anim.currentFrame ?? 0));
          const remaining = Math.max(0, endFrame - current);

          if (remaining <= slowdownFrames) {
            const t = 1 - remaining / Math.max(1, slowdownFrames); // 0..1
            const eased = slowdownCurve === 'linear' ? t : easeOutCubic(t);
            const base = baseSpeedRef.current || 1;
            const target =
              base * (slowdownMin + (1 - slowdownMin) * (1 - eased));
            try {
              anim.setSpeed(Math.max(0.01, target));
              slowed = true;
            } catch {}
          } else if (slowed) {
            // ensure speed is restored if we moved away from tail (via seek, etc.)
            try {
              anim.setSpeed(baseSpeedRef.current || 1);
              slowed = false;
            } catch {}
          }
        };

        // Attach enterFrame listener if applicable
        if (!loop && slowdownFrames > 0) {
          try {
            anim.addEventListener?.('enterFrame', onEnterFrame);
          } catch {}
          enterFrameHandlerRef.current = onEnterFrame;
        }

        const doStart = (forceRestart: boolean) => {
          const seg = segmentFrames();
          try {
            // ensure speed is at base before starting
            try {
              anim.setSpeed(baseSpeedRef.current);
            } catch {}
            isWrappingRef.current = false;
            if (seg) {
              anim.playSegments(seg, true);
              return;
            }
            if (forceRestart) {
              const init2 = frameFromStartAt();
              if (init2 != null) {
                anim.goToAndPlay(init2, true);
                return;
              }
            }
            anim.play();
          } catch {}
        };

        const scheduleStart = (
          forceRestart: boolean,
          requirePlayTrue: boolean,
        ) => {
          // clear any previous pending start
          try {
            clearDelayTimer();
          } catch {}
          const ms = Math.max(0, Math.round(delay || 0));
          if (ms > 0) {
            delayTimerRef.current = window.setTimeout(() => {
              delayTimerRef.current = null;
              if (requirePlayTrue && !playRef.current) return;
              doStart(forceRestart);
            }, ms);
          } else {
            if (requirePlayTrue && !playRef.current) return;
            doStart(forceRestart);
          }
        };

        // Start when ready if autoplay OR play is already true (e.g., selected before load)
        // - If autoplay: don't require play=true to start
        // - If not autoplay: require current play=true to start
        if (autoplay || playRef.current) {
          scheduleStart(true, !autoplay);
        }

        if (!loop) {
          // Smooth wrap-around to the first frame (startAt or 0) after completion
          const onMainComplete = () => {
            const total = Math.max(0, Math.round(anim.totalFrames ?? 0));
            const last = Math.max(0, total - 1);
            const seg = segmentFrames();
            const endFrame = seg ? Math.max(0, Math.min(last, seg[1])) : last;
            const firstFrame = initial ?? 0;

            // Ensure this handler runs only once per main completion
            anim.removeEventListener?.('complete', onMainComplete);

            // If playback was cancelled before completion, just park at firstFrame
            if (!playRef.current) {
              try {
                anim.goToAndStop(firstFrame, true);
              } catch {}
              return;
            }

            try {
              if (freezeOnEnd) {
                // Explicit override: freeze at the end frame (clamped)
                try {
                  anim.setSpeed(baseSpeedRef.current || 1);
                } catch {}
                anim.goToAndStop(endFrame, true);
                return;
              }

              if (firstFrame <= 0) {
                // Nothing to wrap; stop at 0 smoothly
                try {
                  anim.setSpeed(baseSpeedRef.current || 1);
                } catch {}
                anim.goToAndStop(0, true);
                return;
              }

              // Play a one-off wrap segment 0 → firstFrame, then stop exactly at firstFrame
              const onWrapComplete = () => {
                anim.removeEventListener?.('complete', onWrapComplete);
                try {
                  isWrappingRef.current = false;
                  anim.setSpeed(baseSpeedRef.current || 1);
                  anim.goToAndStop(firstFrame, true);
                } catch {}
              };
              try {
                isWrappingRef.current = true;
                const wrapSpeed = endWrapSpeed;
                anim.setSpeed(
                  wrapSpeed != null
                    ? Math.max(0.01, wrapSpeed)
                    : baseSpeedRef.current || 1,
                );
              } catch {}
              anim.addEventListener?.('complete', onWrapComplete);
              anim.playSegments([0, firstFrame], true);
            } catch {}
          };

          // Remove any previous handler for safety and attach the new one
          anim.removeEventListener?.('complete', onMainComplete as any);
          anim.addEventListener?.('complete', onMainComplete);
        }
      };

      // When data is ready, position to the right frame before first paint/play
      anim.addEventListener?.('DOMLoaded', onDataReady);
      anim.addEventListener?.('data_ready', onDataReady);
      // Fallback: in case events are not dispatched, try after a tick
      setTimeout(() => {
        if (anim && !anim.isLoaded) onDataReady();
      }, 0);
    } catch {
      // no-op
    }

    return () => {
      // cancel any pending delayed start
      clearDelayTimer();
      // remove enterFrame if we attached one
      try {
        const a = animationRef.current;
        if (a && enterFrameHandlerRef.current) {
          a.removeEventListener?.(
            'enterFrame',
            enterFrameHandlerRef.current as any,
          );
          enterFrameHandlerRef.current = null;
        }
      } catch {}
      if (animationRef.current) {
        try {
          animationRef.current.destroy();
        } catch {}
        animationRef.current = null;
      }
    };
    // re-init if these change
  }, [
    lottieMod,
    src,
    renderer,
    loop,
    autoplay,
    speed,
    prefersReducedMotion,
    startAt,
    playSegment,
    restartOnPlay,
    freezeOnEnd,
    frameFromStartAt,
    segmentFrames,
    endSlowdownFrames,
    endSlowdownMinSpeed,
    endSlowdownCurve,
    endWrapSpeed,
  ]);

  // React to play prop changes without re-initializing
  React.useEffect(() => {
    const anim = animationRef.current;
    if (!anim) return;
    if (prefersReducedMotion) return;

    const wasPlaying = wasPlayingRef.current;
    wasPlayingRef.current = !!play;

    const doStart = (forceRestart: boolean) => {
      const seg = segmentFrames();
      try {
        // ensure new cycle starts at base speed
        try {
          anim.setSpeed(baseSpeedRef.current || 1);
        } catch {}
        isWrappingRef.current = false;
        if (seg) {
          anim.playSegments(seg, true);
          return;
        }
        if (forceRestart) {
          const initial = frameFromStartAt();
          if (initial != null) {
            anim.goToAndPlay(initial, true);
            return;
          }
        }
        anim.play();
      } catch {}
    };

    const scheduleStart = (forceRestart: boolean) => {
      // cancel any previous scheduled start
      clearDelayTimer();
      const ms = Math.max(0, Math.round(delay || 0));
      if (ms > 0) {
        delayTimerRef.current = window.setTimeout(() => {
          delayTimerRef.current = null;
          if (!playRef.current) return;
          doStart(forceRestart);
        }, ms);
      } else {
        // Use the current prop value to avoid race with playRef update when delay is 0
        if (!play) return;
        doStart(forceRestart);
      }
    };

    try {
      if (play) {
        const forceRestart = !wasPlaying && !!restartOnPlay;
        scheduleStart(forceRestart);
      } else {
        // stop/pause immediately and clear any pending delayed start
        clearDelayTimer();
        // restore base speed so next play cycle starts from consistent speed
        try {
          anim.setSpeed(baseSpeedRef.current || 1);
        } catch {}
        if (loop) {
          anim.pause();
        } else {
          const initial = frameFromStartAt();
          anim.goToAndStop(initial ?? 0, true);
        }
      }
    } catch {
      // no-op
    }
  }, [
    play,
    loop,
    restartOnPlay,
    prefersReducedMotion,
    frameFromStartAt,
    segmentFrames,
    delay,
    clearDelayTimer,
  ]);

  // React to speed changes
  React.useEffect(() => {
    const anim = animationRef.current;
    baseSpeedRef.current = speed ?? 1;
    if (!anim) return;
    try {
      // apply the new base speed immediately; slowdown logic will adjust per-frame if needed
      anim.setSpeed(baseSpeedRef.current);
    } catch {}
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '1em', height: '1em', display: 'inline-block', ...style }}
      aria-hidden
    />
  );
};
