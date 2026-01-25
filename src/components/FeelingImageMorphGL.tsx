import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
  useContext,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, useTexture, View } from '@react-three/drei';
import * as THREE from 'three';
import { Flex } from '@components/Flex';
import { Button } from '@components/Button';
import { Range } from '@components/Form/Range';
import { OverlayRoleContext } from 'components/CenterOnlyTransition/OverlayRoleContext';
import { usePulseCanvasReady } from '../views/flow/pulse/state/PulseCanvasHost';

export interface FeelingImageMorphGLProps {
  images: string[];
  labels?: string[];
  width?: number | string;
  height?: number | string;
  className?: string;
  showSlider?: boolean;
  value?: number; // controlled value in [0..images.length-1]
  onChange?: (value: number) => void;
  initialValue?: number;
  step?: number; // slider step
  snapToSteps?: boolean; // DEPRECATED: rounds while dragging only; does not snap on release
  snapOnRelease?: boolean; // when true, snaps to nearest integer on release with a short easing animation
  disableDamping?: boolean;
  displacementUrl?: string;
  intensity?: number;
  bgColor?: string;

  // New optional navigation buttons API
  showButtons?: boolean;
  buttonsOnly?: boolean;
  buttonStep?: number;
  transitionDurationMs?: number;
  disableButtonsAtEnds?: boolean;

  // Persist last rendered frame across remounts (used during route transitions)
  persistLastFrameKey?: string;

  // When true, render into a shared persistent Canvas via drei <View>
  useSharedCanvas?: boolean;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

// Generates a simple fractal-ish noise DataTexture as fallback displacement map
function makeNoiseTexture(size = 256): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);

  // Multi-octave value noise (very lightweight)
  const rnd = (x: number, y: number) => {
    const n = Math.sin((x * 127.1 + y * 311.7) * 43758.5453);
    return n - Math.floor(n);
  };

  const valueNoise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const r1 = rnd(xi, yi);
    const r2 = rnd(xi + 1, yi);
    const r3 = rnd(xi, yi + 1);
    const r4 = rnd(xi + 1, yi + 1);

    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);

    const a = r1 * (1 - u) + r2 * u;
    const b = r3 * (1 - u) + r4 * u;
    return a * (1 - v) + b * v;
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = x / size;
      const ny = y / size;

      // Two independent noise fields (for RG) to produce a true 2D displacement
      let n1 = 0;
      let n2 = 0;
      let amp = 1.0;
      let freq = 1.0;
      for (let o = 0; o < 4; o += 1) {
        n1 += valueNoise(nx * size * freq, ny * size * freq) * amp;
        // Phase-shifted sample space for the second channel to decorrelate from R
        n2 +=
          valueNoise(nx * size * freq + 37.13, ny * size * freq + 91.73) * amp;
        amp *= 0.5;
        freq *= 2.0;
      }
      const norm = 1.0 + 0.5 + 0.25 + 0.125;
      n1 /= norm;
      n2 /= norm;

      const i = (y * size + x) * 4;
      data[i] = Math.floor(n1 * 255); // R
      data[i + 1] = Math.floor(n2 * 255); // G
      data[i + 2] = 128; // B (unused)
      data[i + 3] = 255; // A
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.NoColorSpace; // linear data for displacement
  texture.needsUpdate = true;
  return texture;
}

// Cache a single instance of the generated noise texture across mounts
let CACHED_NOISE_TEX: THREE.DataTexture | null = null;
function getNoiseTexture() {
  if (!CACHED_NOISE_TEX) CACHED_NOISE_TEX = makeNoiseTexture(256);
  return CACHED_NOISE_TEX;
}

// IMPORTANT CHANGE:
// - We no longer do cover/contain in the shader.
// - We do "contain" by scaling the plane geometry in world units (letterbox via CSS bg).
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;
  uniform sampler2D uDisp;
  uniform float uProgress;
  uniform float uIntensity;
  uniform vec2 uResolution; // drawing buffer size in pixels

  void main() {
    float p = smoothstep(0.0, 1.0, uProgress);

    // Sample 2D displacement from RG channels; lower frequency for smoother blobs
    vec2 dispUv = vUv * 0.10;
    vec2 d = texture2D(uDisp, dispUv).rg * 2.0 - 1.0; // -1..1

    // Scale warp by pixel size to make strength resolution-independent
    vec2 px = 1.0 / uResolution;
    float strength = uIntensity * 180.0;

    // Distort UVs in opposite directions for the two textures
    vec2 distortedUv1 = vUv + d * px * strength * (1.0 - p);
    vec2 distortedUv2 = vUv - d * px * strength * (p);

    vec2 uv1 = clamp(distortedUv1, 0.0, 1.0);
    vec2 uv2 = clamp(distortedUv2, 0.0, 1.0);

    vec4 tex1 = texture2D(uTexture1, uv1);
    vec4 tex2 = texture2D(uTexture2, uv2);

    vec4 col = mix(tex1, tex2, p);
    if (col.a < 0.004) discard; // prevent white edge fringe
    gl_FragColor = col;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function containSize(viewW: number, viewH: number, imgAspect: number) {
  const viewAspect = viewW / viewH;
  let w = viewW;
  let h = viewH;

  if (imgAspect > viewAspect) {
    // image is wider than view: fit width
    h = viewW / imgAspect;
  } else {
    // image is taller than view: fit height
    w = viewH * imgAspect;
  }
  return { w, h };
}

type MorphSceneProps = {
  textures: THREE.Texture[];
  dispTex: THREE.Texture;
  indexI: number;
  indexJ: number;
  fTarget: number; // 0..1
  intensity: number;
  disableDamping?: boolean;
  bgColor?: string;
};

function MorphScene({
  textures,
  dispTex,
  indexI,
  indexJ,
  fTarget,
  intensity,
  disableDamping,
  bgColor,
}: MorphSceneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const progressRef = useRef<number>(fTarget);
  const { size, viewport, gl, invalidate } = useThree();

  // Ensure proper color spaces and filters
  useEffect(() => {
    textures.forEach((t) => {
      if (!t) return;
      // UI photos: avoid mipmap generation stalls and keep sampling simple
      t.colorSpace = THREE.SRGBColorSpace; // photos are sRGB
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.magFilter = THREE.LinearFilter;
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      t.needsUpdate = true;
    });

    // Displacement is linear data, no mipmaps, repeat wrap to tile
    dispTex.wrapS = THREE.RepeatWrapping;
    dispTex.wrapT = THREE.RepeatWrapping;
    dispTex.magFilter = THREE.LinearFilter;
    dispTex.minFilter = THREE.LinearFilter;
    dispTex.generateMipmaps = false;
    dispTex.colorSpace = THREE.NoColorSpace;
    dispTex.needsUpdate = true;
  }, [textures, dispTex, gl]);

  // Update texture pair when index changes
  useEffect(() => {
    const mat = materialRef.current;
    const tex1 = textures[indexI] || textures[0];
    const tex2 = textures[indexJ] || textures[textures.length - 1];
    if (!tex1 || !tex2 || !mat) return;

    mat.uniforms.uTexture1.value = tex1;
    mat.uniforms.uTexture2.value = tex2;
    mat.uniforms.uDisp.value = dispTex;

    // prevent boundary twitch when pair changes by syncing progress
    progressRef.current = fTarget;
    mat.uniforms.uProgress.value = fTarget;
    // ensure a frame is rendered in demand mode
    try {
      invalidate();
    } catch {}
  }, [indexI, indexJ, textures, dispTex, fTarget, invalidate]);

  // Update resolution uniform using actual drawing buffer size (more reliable on mobile)
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    const buf = new THREE.Vector2();
    gl.getDrawingBufferSize(buf);
    mat.uniforms.uResolution.value.set(buf.x, buf.y);
    try {
      invalidate();
    } catch {}
  }, [size, gl, invalidate]);

  // Animate progress (damping)
  useFrame(() => {
    const mat = materialRef.current;
    if (!mat) return;

    if (disableDamping) {
      progressRef.current = fTarget;
    } else {
      const p = progressRef.current;
      progressRef.current = p + (fTarget - p) * 0.12;
    }

    mat.uniforms.uProgress.value = clamp(progressRef.current, 0, 1);
    mat.uniforms.uIntensity.value = intensity;

    // In demand mode, request frames while progress hasn't settled
    if (Math.abs(fTarget - progressRef.current) > 0.0005) {
      try {
        invalidate();
      } catch {}
    }
  });

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTexture1: { value: null },
          uTexture2: { value: null },
          uDisp: { value: null },
          uProgress: { value: 0 },
          uIntensity: { value: intensity },
          uResolution: { value: new THREE.Vector2(1, 1) },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
      }),
    [],
  );

  // Compute "contain" plane size (no stretching, no cropping)
  const tex1 = textures[indexI] || textures[0];
  const tex2 = textures[indexJ] || textures[textures.length - 1];

  const a1 =
    (tex1?.image as any)?.width && (tex1?.image as any)?.height
      ? (tex1.image as any).width / (tex1.image as any).height
      : 1;

  const a2 =
    (tex2?.image as any)?.width && (tex2?.image as any)?.height
      ? (tex2.image as any).width / (tex2.image as any).height
      : a1;

  // Smooth aspect transition while morphing (prevents abrupt letterbox jumps)
  const aspect = a1 + (a2 - a1) * clamp(fTarget, 0, 1);
  const { w: planeW, h: planeH } = containSize(
    viewport.width,
    viewport.height,
    aspect,
  );

  const bgHex = useMemo(() => new THREE.Color(bgColor || '#FAF8F4'), [bgColor]);

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 1]} />

      {/* Background plane fills the view to avoid transparent letterbox in shared canvas */}
      <mesh
        scale={[viewport.width, viewport.height, 1]}
        position={[0, 0, -0.5]}
      >
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color={bgHex} toneMapped={false} />
      </mesh>

      {/* Foreground plane scaled to "contain" inside viewport */}
      <mesh scale={[planeW, planeH, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <primitive
          ref={materialRef as any}
          object={shaderMaterial}
          attach="material"
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

type GLContentProps = {
  images: string[];
  displacementUrl?: string;
  indexI: number;
  indexJ: number;
  fTarget: number;
  intensity: number;
  disableDamping?: boolean;
  bgColor?: string;
};

function GLContent({
  images,
  displacementUrl,
  indexI,
  indexJ,
  fTarget,
  intensity,
  disableDamping,
  bgColor,
}: GLContentProps) {
  // Preload all image textures inside Canvas context
  const textures = useTexture(images) as unknown as THREE.Texture[];

  // Displacement texture: either from URL or generated noise (hooks called inside Canvas)
  const fallbackForHook = displacementUrl || images[0];
  const loadedDisp = useTexture(fallbackForHook) as THREE.Texture;
  const noiseDisp = useMemo(() => getNoiseTexture(), []);
  const dispTex = displacementUrl ? loadedDisp : noiseDisp;

  return (
    <MorphScene
      textures={textures}
      dispTex={dispTex}
      indexI={indexI}
      indexJ={indexJ}
      fTarget={fTarget}
      intensity={intensity}
      disableDamping={disableDamping}
      bgColor={bgColor}
    />
  );
}

function FirstFrame({ onFirstFrame }: { onFirstFrame: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (!fired.current) {
      fired.current = true;
      onFirstFrame();
    }
  });
  return null;
}

function InvalidateOnSize({ w, h }: { w: number; h: number }) {
  const { invalidate } = useThree();
  useEffect(() => {
    try {
      invalidate();
    } catch {}
  }, [w, h, invalidate]);
  return null;
}

export const FeelingImageMorphGL: React.FC<FeelingImageMorphGLProps> = ({
  images,
  // labels,
  width = '100%',
  height = 360,
  className,
  showSlider = true,
  value,
  onChange,
  initialValue = 0,
  step = 0.01,
  snapToSteps = false,
  snapOnRelease = false,
  disableDamping = false,
  displacementUrl,
  intensity = 0.01,
  bgColor = '#FAF8F4',
  // New buttons defaults
  showButtons = false,
  buttonsOnly = false,
  buttonStep = 1,
  transitionDurationMs = 350,
  disableButtonsAtEnds = true,
  persistLastFrameKey,
  useSharedCanvas = false,
}) => {
  if (!images || images.length < 2) {
    return (
      <div
        style={{ width, height, display: 'grid', placeItems: 'center' }}
        className={className}
      >
        <span>FeelingImageMorphGL: provide at least 2 images.</span>
      </div>
    );
  }

  const overlayRole = useContext(OverlayRoleContext);
  const isExit = overlayRole === 'exit';
  const isEnter = overlayRole === 'active';

  // Track when the Canvas has produced its first frame while entering.
  const [firstFrameDrawn, setFirstFrameDrawn] = useState(false);

  // Reset and set a safety timeout when we are in the entering overlay.
  useEffect(() => {
    if (!isEnter) return;
    setFirstFrameDrawn(false);
    const id = window.setTimeout(() => setFirstFrameDrawn(true), 1200);
    return () => window.clearTimeout(id);
  }, [isEnter]);

  const storageKey = persistLastFrameKey
    ? `FeelingImageMorphGL:${persistLastFrameKey}`
    : null;

  const initialFromStorage = useMemo(() => {
    if (!storageKey) return null;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return null;
      const num = parseFloat(raw);
      if (Number.isNaN(num)) return null;
      return clamp(num, 0, images.length - 1);
    } catch {
      return null;
    }
  }, [storageKey, images.length]);

  const isControlled = typeof value === 'number';
  const [internalValue, setInternalValue] = useState<number>(
    clamp(initialFromStorage ?? initialValue, 0, images.length - 1),
  );
  const t = clamp(isControlled ? value : internalValue, 0, images.length - 1);

  const [animatedT, setAnimatedT] = useState<number | null>(null);
  const viewT = isControlled ? (animatedT ?? t) : t;

  // Persist the last value for reuse in exit overlay remounts
  useEffect(() => {
    if (!storageKey) return;
    try {
      const toStore = String(isControlled ? (animatedT ?? t) : t);
      sessionStorage.setItem(storageKey, toStore);
    } catch {}
  }, [storageKey, isControlled, t, animatedT]);

  const i = clamp(Math.floor(viewT), 0, images.length - 1);
  const j = Math.min(i + 1, images.length - 1);
  const f = clamp(viewT - i, 0, 1);

  const handleChange = useCallback(
    (next: number) => {
      const clamped = clamp(next, 0, images.length - 1);
      if (!isControlled) setInternalValue(clamped);
      onChange?.(clamped);
    },
    [images.length, isControlled, onChange],
  );

  const sliderMin = 0;
  const sliderMax = Math.max(1, images.length - 1);

  const currentIndexForLabel = clamp(Math.round(viewT), 0, images.length - 1);
  // const labelText =
  //   labels && labels[currentIndexForLabel]
  //     ? `${labels[currentIndexForLabel]}`
  //     : `${currentIndexForLabel + 1} / ${images.length}`;

  const wrapperStyle: React.CSSProperties = {
    width,
    height,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  };
  const viewportStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 12,
    background: useSharedCanvas ? 'transparent' : bgColor, // in shared mode, let Canvas show through
  };
  const sliderWrap: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 0 0 0',
  };
  // const labelBadge: React.CSSProperties = {
  //   position: 'absolute',
  //   left: 12,
  //   bottom: 12,
  //   padding: '4px 8px',
  //   background: 'rgba(0,0,0,0.5)',
  //   color: '#fff',
  //   fontSize: 12,
  //   borderRadius: 8,
  //   pointerEvents: 'none',
  //   zIndex: 3,
  // };

  // Provide a stable element for R3F to attach pointer/keyboard events to
  const viewportRef = useRef<HTMLDivElement | null>(null);
  // Option B: delay Canvas mount until after the viewport exists and a frame has painted
  const [showCanvas, setShowCanvas] = useState(false);
  useLayoutEffect(() => {
    let raf1 = 0 as number;
    const rAF =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (cb: FrameRequestCallback) =>
            window.setTimeout(() => cb(performance.now()), 16);
    const cAF =
      typeof cancelAnimationFrame === 'function'
        ? cancelAnimationFrame
        : (id: number) => window.clearTimeout(id);

    raf1 = rAF(() => setShowCanvas(true));

    return () => {
      if (raf1) cAF(raf1);
    };
  }, []);

  // Shared Canvas readiness and robust fallback to local Canvas
  const sharedReady = usePulseCanvasReady();
  const [fallbackLocal, setFallbackLocal] = useState(false);

  useEffect(() => {
    if (!useSharedCanvas) return;
    let id: any;
    if (!sharedReady) {
      id = setTimeout(() => setFallbackLocal(true), 300);
    } else {
      setFallbackLocal(false);
    }
    return () => {
      if (id) clearTimeout(id);
    };
  }, [useSharedCanvas, sharedReady]);

  // Track whether the viewport has a non-zero size to allow <View> registration
  const [viewportHasSize, setViewportHasSize] = useState(false);
  const [viewportDims, setViewportDims] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) {
      setViewportHasSize(false);
      setViewportDims({ w: 0, h: 0 });
      return;
    }
    const update = () => {
      const r = el.getBoundingClientRect();
      setViewportHasSize(r.width > 0 && r.height > 0);
      setViewportDims({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  const canUseShared = Boolean(
    useSharedCanvas &&
      sharedReady &&
      viewportHasSize &&
      viewportRef.current &&
      !fallbackLocal,
  );
  // No key on <View>; resizing shouldn't remount the scene
  // const viewKey = canUseShared ? `${viewportDims.w}x${viewportDims.h}` : undefined;

  const [isInteracting, setIsInteracting] = useState(false);

  // If the shared canvas view doesn't produce a first frame shortly after mounting,
  // fall back to a local Canvas to avoid blank content due to timing races.
  useEffect(() => {
    if (!useSharedCanvas) return;
    if (!showCanvas) return;
    if (!canUseShared) return;
    if (firstFrameDrawn) return;
    const id = window.setTimeout(() => {
      if (!firstFrameDrawn) setFallbackLocal(true);
    }, 800);
    return () => window.clearTimeout(id);
  }, [useSharedCanvas, showCanvas, canUseShared, firstFrameDrawn]);

  // Preload textures in advance to avoid Suspense flicker on remounts (e.g., during transitions)
  useEffect(() => {
    try {
      (useTexture as any).preload?.(images);
      if (displacementUrl) (useTexture as any).preload?.(displacementUrl);
    } catch {}
  }, [images, displacementUrl]);

  const snapRaf = useRef<number | null>(null);
  const snapStart = useRef<number>(0);
  const snapFrom = useRef<number>(0);
  const snapTo = useRef<number>(0);
  const snapDuration = useRef<number>(200);

  const cancelSnap = useCallback(() => {
    if (snapRaf.current != null) {
      cancelAnimationFrame(snapRaf.current);
      snapRaf.current = null;
    }
  }, []);

  const btnRaf = useRef<number | null>(null);
  const btnStart = useRef<number>(0);
  const btnFrom = useRef<number>(0);
  const btnToIndex = useRef<number>(0);

  const cancelButtonAnim = useCallback(() => {
    if (btnRaf.current != null) {
      cancelAnimationFrame(btnRaf.current);
      btnRaf.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      cancelSnap();
      cancelButtonAnim();
    },
    [cancelSnap, cancelButtonAnim],
  );

  useEffect(() => {
    if (isControlled) setAnimatedT(null);
  }, [isControlled, value]);

  const startSnap = useCallback(
    (targetIndex?: number) => {
      cancelSnap();
      const current = clamp(
        isControlled ? value : internalValue,
        0,
        images.length - 1,
      );
      const nearest = clamp(
        typeof targetIndex === 'number' ? targetIndex : Math.round(current),
        0,
        images.length - 1,
      );

      if (isControlled) {
        onChange?.(nearest);
        return;
      }

      if (Math.abs(current - nearest) < 1e-6) {
        setInternalValue(nearest);
        onChange?.(nearest);
        return;
      }

      snapFrom.current = current;
      snapTo.current = nearest;
      snapStart.current = performance.now();

      const tick = (now: number) => {
        const tNorm = clamp(
          (now - snapStart.current) / snapDuration.current,
          0,
          1,
        );
        const eased = easeOutCubic(tNorm);
        const nextVal =
          snapFrom.current + (snapTo.current - snapFrom.current) * eased;
        setInternalValue(nextVal);
        if (tNorm < 1) {
          snapRaf.current = requestAnimationFrame(tick);
        } else {
          setInternalValue(snapTo.current);
          onChange?.(snapTo.current);
          snapRaf.current = null;
        }
      };

      snapRaf.current = requestAnimationFrame(tick);
    },
    [cancelSnap, images.length, internalValue, isControlled, onChange, value],
  );

  const animateToIndex = useCallback(
    (targetIndex: number) => {
      cancelButtonAnim();
      cancelSnap();
      const last = images.length - 1;
      const clampedTarget = clamp(Math.round(targetIndex), 0, last);
      const currentView = isControlled ? (animatedT ?? value) : internalValue;
      if (!isFinite(currentView)) return;

      if (Math.abs(currentView - clampedTarget) < 1e-6) {
        if (isControlled) onChange?.(clampedTarget);
        else {
          setInternalValue(clampedTarget);
          onChange?.(clampedTarget);
        }
        return;
      }

      btnFrom.current = currentView;
      btnToIndex.current = clampedTarget;
      btnStart.current = performance.now();
      const duration = Math.max(0, transitionDurationMs);

      const tick = (now: number) => {
        const tNorm = clamp((now - btnStart.current) / duration, 0, 1);
        const eased = easeOutCubic(tNorm);
        const nextVal =
          btnFrom.current + (btnToIndex.current - btnFrom.current) * eased;

        if (isControlled) setAnimatedT(nextVal);
        else setInternalValue(nextVal);

        if (tNorm < 1) {
          btnRaf.current = requestAnimationFrame(tick);
        } else {
          if (isControlled) {
            setAnimatedT(btnToIndex.current);
            onChange?.(btnToIndex.current);
          } else {
            setInternalValue(btnToIndex.current);
            onChange?.(btnToIndex.current);
          }
          btnRaf.current = null;
        }
      };

      btnRaf.current = requestAnimationFrame(tick);
    },
    [
      animatedT,
      cancelButtonAnim,
      cancelSnap,
      images.length,
      internalValue,
      isControlled,
      onChange,
      transitionDurationMs,
      value,
    ],
  );

  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!snapOnRelease) return;
    const keys = [
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown',
    ];
    if (keys.includes(e.key)) startSnap();
  };

  const isAnimatingView =
    isInteracting ||
    btnRaf.current != null ||
    snapRaf.current != null ||
    (isEnter && !firstFrameDrawn);

  // Always show a DOM cover during exit/enter to avoid any flash, regardless of shared canvas state
  const showDomCover = isExit || (isEnter && !firstFrameDrawn);

  // Snapshot cover of the last rendered frame to guarantee no blank during transitions
  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [forceCover, setForceCover] = useState(false);

  const captureLastFrame = useCallback(() => {
    try {
      // Prefer the shared canvas if present
      const shared = document.querySelector(
        'canvas[data-pulse-shared="1"]',
      ) as HTMLCanvasElement | null;
      const local = viewportRef.current?.querySelector('canvas') as
        | HTMLCanvasElement
        | null;
      const canvas = shared || local;
      if (!canvas) return;
      try {
        const url = canvas.toDataURL('image/png');
        if (url && typeof url === 'string') setCoverSrc(url);
      } catch {
        // Some browsers may block toDataURL; ignore
      }
    } catch {}
  }, []);

  // Listen for global cover-show requests (e.g., right before navigation)
  useEffect(() => {
    const onShow = () => {
      setForceCover(true);
      captureLastFrame();
    };
    document.addEventListener('pulse:cover-show', onShow);
    return () => document.removeEventListener('pulse:cover-show', onShow);
  }, [captureLastFrame]);

  // Capture when starting to exit
  useEffect(() => {
    if (isExit) captureLastFrame();
  }, [isExit, captureLastFrame]);

  // Clear forced cover when the entering view draws its first frame
  useEffect(() => {
    if (isEnter && firstFrameDrawn) {
      setForceCover(false);
      setCoverSrc(null);
    }
  }, [isEnter, firstFrameDrawn]);

  const showCover = showDomCover || forceCover || !!coverSrc;

  return (
    <Flex gap="md" style={wrapperStyle} className={className}>
      <div ref={viewportRef} style={viewportStyle}>
        {showCover && (
          <img
            src={coverSrc ?? images[currentIndexForLabel]}
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              borderRadius: 12,
              pointerEvents: 'none',
              zIndex: 2,
              opacity: isExit ? 1 : firstFrameDrawn ? 0 : 1,
              transition: 'opacity 140ms ease-out',
              willChange: 'opacity, transform',
            }}
          />
        )}
        {showCanvas &&
          (canUseShared ? (
            <View
              track={viewportRef as any}
              frames={
                isAnimatingView || isExit || (isEnter && !firstFrameDrawn)
                  ? Infinity
                  : 1
              }
            >
              <Suspense fallback={null}>
                {/* Hide the entering DOM cover once the shared Canvas has rendered a frame */}
                {isEnter && (
                  <FirstFrame onFirstFrame={() => setFirstFrameDrawn(true)} />
                )}
                <InvalidateOnSize w={viewportDims.w} h={viewportDims.h} />
                <GLContent
                  images={images}
                  displacementUrl={displacementUrl}
                  indexI={i}
                  indexJ={j}
                  fTarget={f}
                  intensity={intensity}
                  disableDamping={disableDamping}
                  bgColor={bgColor}
                />
              </Suspense>
            </View>
          ) : (
            <Canvas
              // Provide explicit event target to prevent null parent during animated mounts
              eventSource={
                viewportRef as unknown as React.RefObject<HTMLElement>
              }
              eventPrefix="client"
              dpr={[1, 1.5]}
              frameloop="demand"
              gl={{
                alpha: true,
                antialias: false,
                powerPreference: 'high-performance',
                preserveDrawingBuffer: true,
              }}
              onCreated={(state) => {
                const { gl } = state;
                gl.outputColorSpace = THREE.SRGBColorSpace;
                gl.toneMapping = THREE.NoToneMapping;
                gl.setClearColor(0x000000, 0);
                // Defensive: ensure events are connected to the viewport after creation
                const target =
                  viewportRef.current as unknown as HTMLElement | null;
                const anyState = state as any;
                try {
                  if (target && anyState?.events) {
                    anyState.events.disconnect?.();
                    anyState.events.connect?.(target);
                  }
                } catch {}
              }}
            >
              <Suspense fallback={null}>
                {/* Hide the entering DOM cover once the Canvas has rendered a frame */}
                {isEnter && (
                  <FirstFrame onFirstFrame={() => setFirstFrameDrawn(true)} />
                )}
                <GLContent
                  images={images}
                  displacementUrl={displacementUrl}
                  indexI={i}
                  indexJ={j}
                  fTarget={f}
                  intensity={intensity}
                  disableDamping={disableDamping}
                  bgColor={bgColor}
                />
              </Suspense>
            </Canvas>
          ))}
        {/*<div style={labelBadge} aria-hidden="true">*/}
        {/*  {labelText}*/}
        {/*</div>*/}
      </div>

      {(showSlider && !buttonsOnly) || showButtons ? (
        <Flex
          direction="row"
          alignItems="flex-end"
          justifyContent="flex-end"
          style={sliderWrap}
        >
          {showButtons && (
            <Button
              aria-label="Previous"
              label="Back"
              size="small"
              variant="secondary"
              onClick={() =>
                animateToIndex(
                  (isControlled ? (animatedT ?? value) : t) - buttonStep,
                )
              }
              disabled={disableButtonsAtEnds && currentIndexForLabel <= 0}
            />
          )}

          {showSlider && !buttonsOnly && (
            <Range
              aria-label="Image morph slider"
              min={sliderMin}
              max={sliderMax}
              step={step}
              value={viewT}
              onValueChange={(val) => {
                // Treat as interacting during value change
                if (!isInteracting) setIsInteracting(true);
                cancelButtonAnim();
                const next =
                  snapToSteps && isInteracting ? Math.round(val) : val;
                handleChange(next);
              }}
              onValueCommit={() => {
                setIsInteracting(false);
                if (snapOnRelease) startSnap();
              }}
              onKeyUp={onKeyUp}
              hideFootnote
              style={{ width: '100%' }}
            />
          )}

          {showButtons && (
            <Button
              aria-label="Next"
              label="Next"
              size="small"
              variant="secondary"
              onClick={() =>
                animateToIndex(
                  (isControlled ? (animatedT ?? value) : t) + buttonStep,
                )
              }
              disabled={
                disableButtonsAtEnds &&
                currentIndexForLabel >= images.length - 1
              }
            />
          )}
        </Flex>
      ) : null}
    </Flex>
  );
};

export default FeelingImageMorphGL;
