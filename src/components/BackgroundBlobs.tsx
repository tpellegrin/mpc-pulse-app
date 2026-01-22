import React, { useEffect, useMemo, useRef } from 'react';

/**
 * BackgroundBlobs
 * A performant animated background using a single full-viewport canvas.
 * - Fixed canvas behind content (pointer-events: none)
 * - Imperative rendering with requestAnimationFrame
 * - DPR scaling, resize handling
 * - Page Visibility pause
 * - Respects prefers-reduced-motion
 * - Subtle, erratic blob motion with smooth color drift and occasional jumps
 */

export type BackgroundBlobsProps = {
  /** Density of blobs relative to viewport area. Typical range 0.5–2. Defaults to 1. */
  density?: number;
  /** Minimum blob radius in CSS pixels. */
  minRadius?: number;
  /** Maximum blob radius in CSS pixels. */
  maxRadius?: number;
  /** Base speed multiplier (0.5–2). Defaults to 1. */
  speed?: number;
  /** Color mode tweaks the saturation/lightness. */
  colorMode?: 'vivid' | 'pastel';
  /** If false, component renders nothing. */
  enabled?: boolean;
  /** Optional CSS className for the canvas. */
  className?: string;
  /** Optional style overrides for the canvas. */
  style?: React.CSSProperties;
  /** Wobbly/slime outlines enabled (default true). */
  wobble?: boolean;
  /** Number of points for wobble outline (default 32, clamp 16..64). */
  wobblePoints?: number;
  /** Wobble amplitude as fraction of radius (default 0.10, clamp 0..0.25). */
  wobbleAmp?: number;
  /** Wobble speed multiplier (default 1, clamp 0..3). */
  wobbleSpeed?: number;
  /** Wobble detail/frequency multiplier around the edge (default 1, clamp 0.5..2). */
  wobbleDetail?: number;
};

const DEFAULTS = {
  density: 1,
  minRadius: 60,
  maxRadius: 180,
  speed: 1,
  colorMode: 'pastel' as const,
  wobble: true,
  wobblePoints: 32,
  wobbleAmp: 0.1,
  wobbleSpeed: 1,
  wobbleDetail: 1,
};

// Small helper: seeded pseudo-random (mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Linear interpolation
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Clamp utility
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Map viewport area to number of blobs.
function computeBlobCount(w: number, h: number, density: number) {
  const area = w * h;
  // Base: ~1 blob per 60k px at density=1. Clamp 8..36.
  const count = Math.round((area / 60000) * density);
  return clamp(count, 8, 36);
}

interface BlobState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  // For legacy usage in physics; keep r equal to r0.
  r: number; // effective radius used by physics
  r0: number; // base radius used for wobble and gradient sizing
  // Wobble parameters (initialized once per blob; no per-frame allocations)
  phase: number; // random phase for noise
  amp: number; // amplitude as fraction of r0
  freq1: number;
  freq2: number;
  speed1: number;
  speed2: number;
  ptsX?: Float32Array; // allocated only when wobble enabled
  ptsY?: Float32Array; // allocated only when wobble enabled
  // Color state
  hue: number;              // current displayed hue (0–360)
  targetHue: number;       // slowly changing goal hue
  hueChaseSpeed: number;   // deg/sec, e.g. 6–18
  nextTargetAt: number;    // ms timestamp for choosing a new target
  lastGradHueBucket?: number;
  colorStopCenter?: string;
  colorStopEdge?: string;
}

export const BackgroundBlobs: React.FC<BackgroundBlobsProps> = ({
  density = DEFAULTS.density,
  minRadius = DEFAULTS.minRadius,
  maxRadius = DEFAULTS.maxRadius,
  speed = DEFAULTS.speed,
  colorMode = DEFAULTS.colorMode,
  enabled = true,
  className,
  style,
  wobble = DEFAULTS.wobble,
  wobblePoints = DEFAULTS.wobblePoints,
  wobbleAmp = DEFAULTS.wobbleAmp,
  wobbleSpeed = DEFAULTS.wobbleSpeed,
  wobbleDetail = DEFAULTS.wobbleDetail,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef<boolean>(false);
  const blobsRef = useRef<BlobState[]>([]);
  const lastTsRef = useRef<number>(0);
  const prefersReducedRef = usePrefersReducedMotionRef();

  // Color parameters based on mode
  const colorParams = useMemo(() => {
    return colorMode === 'vivid'
      ? { s: 80, lCenter: 55, lEdge: 55, alphaCenter: 0.22, alphaEdge: 0 }
      : { s: 55, lCenter: 65, lEdge: 65, alphaCenter: 0.18, alphaEdge: 0 };
  }, [colorMode]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    // Clamp wobble config for safety
    const wobbleEnabled = !!wobble;
    const W_POINTS = clamp(Math.round(wobblePoints || DEFAULTS.wobblePoints), 16, 64);
    const W_AMP = clamp(wobbleAmp ?? DEFAULTS.wobbleAmp, 0, 0.25);
    const W_SPEED = clamp(wobbleSpeed ?? DEFAULTS.wobbleSpeed, 0, 3);
    const W_DETAIL = clamp(wobbleDetail ?? DEFAULTS.wobbleDetail, 0.5, 2);

    // Setup DPR scaling
    const maxDpr = 2; // cap to keep bitmap reasonable
    const updateCanvasSize = () => {
      const { innerWidth: w, innerHeight: h, devicePixelRatio } = window;
      const dpr = clamp(devicePixelRatio || 1, 1, maxDpr);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale to CSS pixels
    };

    updateCanvasSize();

    // Seed / create blobs based on viewport
    const rng = mulberry32(0xdecafb0b ^ Math.floor(Math.random() * 0xffffffff));
    const makeBlob = (pointsForWobble: number): BlobState => {
      const r = lerp(minRadius, maxRadius, rng());
      // Init in expanded area so they can drift in
      const w = window.innerWidth;
      const h = window.innerHeight;
      const pad = Math.max(r, 40);
      const x = lerp(-pad, w + pad, rng());
      const y = lerp(-pad, h + pad, rng());
      const speedBase = 6e-3 * speed; // CSS px per ms nominal
      const angle = rng() * Math.PI * 2;
      const vx = Math.cos(angle) * speedBase;
      const vy = Math.sin(angle) * speedBase;
      const ax = 0;
      const ay = 0;
      const hue = rng() * 360;
      const targetHue = (hue + 40 + rng() * 200) % 360; // different but not extreme
      const hueChaseSpeed = lerp(6, 18, rng()); // deg/sec
      const now = performance.now();
      const nextTargetAt = now + 4000 + rng() * 6000; // 4–10s

      const r0 = r;
      const phase = rng() * Math.PI * 2;
      const amp = W_AMP * (0.85 + rng() * 0.3); // slight per-blob variance
      // Frequencies scaled by detail; keep small to avoid jagged edges
      const freq1 = (2 + rng() * 4) * W_DETAIL; // ~2..6
      const freq2 = (5 + rng() * 6) * W_DETAIL; // ~5..11
      const speed1 = 0.6 + rng() * 0.8; // ~0.6..1.4
      const speed2 = 0.6 + rng() * 0.8; // ~0.6..1.4
      const ptsX = wobbleEnabled ? new Float32Array(pointsForWobble) : undefined;
      const ptsY = wobbleEnabled ? new Float32Array(pointsForWobble) : undefined;

      return { x, y, vx, vy, ax, ay, r, r0, phase, amp, freq1, freq2, speed1, speed2, ptsX, ptsY, hue, targetHue, hueChaseSpeed, nextTargetAt };
    };

    const reseedBlobs = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const count = computeBlobCount(w, h, density);
      // Guardrail: reduce wobblePoints if many blobs
      const effectivePoints = wobbleEnabled && count > 24 ? Math.min(W_POINTS, 24) : W_POINTS;
      const arr: BlobState[] = new Array(count);
      for (let i = 0; i < count; i++) arr[i] = makeBlob(effectivePoints);
      blobsRef.current = arr;
    };

    reseedBlobs();

    const onResize = () => {
      updateCanvasSize();
      reseedBlobs();
      // Draw one frame immediately to avoid blank after resize
      drawFrame(performance.now());
    };

    window.addEventListener('resize', onResize);

    // Page Visibility pause/resume
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const start = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      lastTsRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      runningRef.current = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const tick = (ts: number) => {
      if (!runningRef.current) return;
      const dt = Math.min(ts - lastTsRef.current, 100); // clamp delta to avoid huge jumps
      lastTsRef.current = ts;

      // Reduced motion: either draw static first frame or update very slowly
      if (prefersReducedRef.current) {
        // Draw once then pause
        drawFrame(ts);
        stop();
        return;
      }

      drawFrame(ts, dt);

      // FPS cap via setTimeout-like approach is tricky with rAF; instead we can skip frames.
      // Here we target ~60fps; if needed, could implement accumulator.
      rafRef.current = requestAnimationFrame(tick);
    };

    // Smooth pseudo-noise based on sines; continuous in time and angle
    const edgeNoise = (angle: number, tSec: number, b: BlobState) => {
      // Weighted sum of two sines with different frequencies and time directions
      const n1 = Math.sin(angle * (b.freq1 || 3) + tSec * (b.speed1 || 1) + (b.phase || 0));
      const n2 = Math.sin(angle * (b.freq2 || 7) - tSec * (b.speed2 || 1) + (b.phase || 0) * 1.7);
      return 0.6 * n1 + 0.4 * n2; // ~[-1, 1]
    };

    // Draw a single wobbling blob path and fill with a radial gradient
    const drawWobbleBlob = (
      ctx: CanvasRenderingContext2D,
      b: BlobState,
      tSec: number,
      displayHue: number,
      points: number
    ) => {
      const ptsX = b.ptsX!;
      const ptsY = b.ptsY!;
      const step = (Math.PI * 2) / points;
      const r0 = b.r0 ?? b.r;
      const baseAmp = b.amp ?? W_AMP;

      // 1) Sample points around the circle with noise-modulated radius
      for (let i = 0, a = 0; i < points; i++, a += step) {
        const n = edgeNoise(a, tSec, b); // [-1..1]
        const r = r0 * (1 + baseAmp * n);
        ptsX[i] = b.x + Math.cos(a) * r;
        ptsY[i] = b.y + Math.sin(a) * r;
      }

      // 2) Build smooth closed path with quadratic curves between midpoints
      ctx.beginPath();
      let cx = ptsX[0], cy = ptsY[0];
      // Start at midpoint between last and first
      let lx = ptsX[points - 1], ly = ptsY[points - 1];
      let mx = (lx + cx) * 0.5, my = (ly + cy) * 0.5;
      ctx.moveTo(mx, my);
      for (let i = 0; i < points; i++) {
        cx = ptsX[i];
        cy = ptsY[i];
        const nx = ptsX[(i + 1) % points];
        const ny = ptsY[(i + 1) % points];
        mx = (cx + nx) * 0.5;
        my = (cy + ny) * 0.5;
        ctx.quadraticCurveTo(cx, cy, mx, my);
      }
      ctx.closePath();

      // 3) Radial gradient centered at blob center; cache color strings by hue bucket
      const { s, lCenter, lEdge, alphaCenter, alphaEdge } = colorParams;
      const hueBucket = Math.floor(displayHue / 3);
      if (b.lastGradHueBucket !== hueBucket || !b.colorStopCenter || !b.colorStopEdge) {
        b.lastGradHueBucket = hueBucket;
        const hueStr = displayHue.toFixed(1);
        b.colorStopCenter = `hsla(${hueStr}, ${s}%, ${lCenter}%, ${alphaCenter})`;
        b.colorStopEdge = `hsla(${hueStr}, ${s}%, ${lEdge}%, ${alphaEdge})`;
      }
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r0 * 1.05);
      grad.addColorStop(0, b.colorStopCenter);
      grad.addColorStop(1, b.colorStopEdge);
      ctx.fillStyle = grad;
      ctx.fill();
    };

    const drawFrame = (ts: number, dtMs?: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Clear with slight alpha to create very subtle trails? We'll use full clear to keep crisp.
      ctx.clearRect(0, 0, w, h);

      // Composite for pleasing overlaps
      ctx.globalCompositeOperation = 'lighter';

      const blobs = blobsRef.current;
      const now = ts;

      // Time in seconds for wobble, scaled by wobble speed
      const tSec = (ts * 0.001) * W_SPEED;

      // Update & render
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        // Update motion
        if (dtMs != null) {
          // Random gentle acceleration with damping: erratic but slow
          const jitter = 0.0006 * speed; // accel magnitude in px/ms^2
          const theta = (i * 37.3 + now * 0.0007) % (Math.PI * 2);
          // small directional drift plus random nudge
          b.ax += (Math.cos(theta) * jitter - b.ax) * 0.05;
          b.ay += (Math.sin(theta) * jitter - b.ay) * 0.05;

          b.vx += b.ax * dtMs;
          b.vy += b.ay * dtMs;

          // Damping
          b.vx *= 0.985;
          b.vy *= 0.985;

          // Integrate
          b.x += b.vx * dtMs;
          b.y += b.vy * dtMs;

          // Gentle wrap-around boundaries (use base radius, not instantaneous wobble)
          const pad = (b.r0 ?? b.r) * 1.2;
          if (b.x < -pad) b.x = w + pad;
          else if (b.x > w + pad) b.x = -pad;
          if (b.y < -pad) b.y = h + pad;
          else if (b.y > h + pad) b.y = -pad;

          // Occasionally pick a new target hue (NO snapping)
          if (now >= b.nextTargetAt) {
            const offset = 60 + rng() * 180; // 60..240 deg change
            b.targetHue = (b.targetHue + offset) % 360;
            b.nextTargetAt = now + 4000 + rng() * 6000; // 4–10s
          }

          // Smoothly move current hue toward target hue at a fixed max rate
          const maxStep = b.hueChaseSpeed * (dtMs / 1000); // deg this frame
          b.hue = stepWrappedHue(b.hue, b.targetHue, maxStep);
        }

        // Use current hue directly for display (no per-frame lerp)
        const displayHue = b.hue;

        if (wobbleEnabled && b.ptsX && b.ptsY) {
          drawWobbleBlob(ctx, b, tSec, displayHue, b.ptsX.length);
        } else {
          // Fallback: radial gradient circle (soft edges)
          const r0 = b.r0 ?? b.r;
          const { s, lCenter, lEdge, alphaCenter, alphaEdge } = colorParams;
          const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r0);
          grad.addColorStop(0, `hsla(${displayHue.toFixed(1)}, ${s}%, ${lCenter}%, ${alphaCenter})`);
          grad.addColorStop(1, `hsla(${displayHue.toFixed(1)}, ${s}%, ${lEdge}%, ${alphaEdge})`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(b.x, b.y, r0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // Kick things off (unless tab hidden)
    if (!document.hidden) start();

    return () => {
      stop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // We intentionally leave density, minRadius, etc. out to avoid re-init on prop changes.
    // If these props change at runtime, consumer should key the component to remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, colorParams, minRadius, maxRadius, speed, density]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        // Optional painterly blending for the whole canvas when composited with page
        // mixBlendMode: 'screen',
        ...style,
      }}
    />
  );
};

// Shortest-arc hue stepping without snapping
function stepWrappedHue(current: number, target: number, maxStep: number) {
  let delta = ((target - current + 540) % 360) - 180; // [-180, 180)
  if (Math.abs(delta) <= maxStep) return (target + 360) % 360;
  const next = current + Math.sign(delta) * maxStep;
  return (next + 360) % 360;
}

function usePrefersReducedMotionRef() {
  const reducedRef = useRef<boolean>(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedRef.current = !!mql.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedRef.current = !!e.matches;
    };
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);

  return reducedRef;
}

export default BackgroundBlobs;
