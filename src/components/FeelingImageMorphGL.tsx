import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Flex } from '@components/Flex';
import { Button } from '@components/Button';

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
  // New optional navigation buttons API
  showButtons?: boolean;
  buttonsOnly?: boolean;
  buttonStep?: number;
  transitionDurationMs?: number;
  disableButtonsAtEnds?: boolean;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

// Easing used for snap-on-release animation
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
      const vr = Math.floor(n1 * 255);
      const vg = Math.floor(n2 * 255);
      data[i] = vr; // R
      data[i + 1] = vg; // G
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

// GLSL shaders implementing displacement-based morph with cover fit
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
  uniform vec2 uResolution; // viewport in pixels
  uniform vec2 uImageRes1;  // image 1 native size in pixels
  uniform vec2 uImageRes2;  // image 2 native size in pixels

  // object-fit: cover
  vec2 coverUv(vec2 uv, vec2 res, vec2 img) {
    float rs = res.x / res.y;
    float is = img.x / img.y;
    vec2 newSize = (is > rs) ? vec2(res.y * is, res.y) : vec2(res.x, res.x / is);
    vec2 offset = (newSize - res) * 0.5;
    vec2 uvPixels = uv * res + offset;
    return uvPixels / newSize;
  }

  void main() {
    float p = smoothstep(0.0, 1.0, uProgress);

    // Sample 2D displacement from RG channels; lower frequency for smoother blobs
    vec2 dispUv = vUv * 0.10; // smoother blobs, less grain
    vec2 d = texture2D(uDisp, dispUv).rg * 2.0 - 1.0; // -1..1 in each axis

    // Scale warp by pixel size to make strength resolution-independent
    vec2 px = 1.0 / uResolution; // size of one pixel in UV units
    float strength = uIntensity * 180.0; // expected usable intensity: ~0.01–0.08

    // Distort base UVs in opposite directions for the two textures
    vec2 distortedUv1 = vUv + d * px * strength * (1.0 - p);
    vec2 distortedUv2 = vUv - d * px * strength * (p);

    // Fit images with cover and clamp to avoid sampling outside
    vec2 uv1 = coverUv(distortedUv1, uResolution, uImageRes1);
    vec2 uv2 = coverUv(distortedUv2, uResolution, uImageRes2);
    uv1 = clamp(uv1, 0.0, 1.0);
    uv2 = clamp(uv2, 0.0, 1.0);

    vec4 tex1 = texture2D(uTexture1, uv1);
    vec4 tex2 = texture2D(uTexture2, uv2);

    // DEBUG aid: uncomment next two lines to show first texture without morph.
    // gl_FragColor = tex1;
    // return;

    gl_FragColor = mix(tex1, tex2, p);
  }
`;

type MorphSceneProps = {
  textures: THREE.Texture[];
  dispTex: THREE.Texture;
  indexI: number;
  indexJ: number;
  fTarget: number; // 0..1
  intensity: number;
  disableDamping?: boolean;
};

function MorphScene({
  textures,
  dispTex,
  indexI,
  indexJ,
  fTarget,
  intensity,
  disableDamping,
}: MorphSceneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const progressRef = useRef<number>(fTarget);
  const { size, viewport, gl } = useThree();

  // Ensure proper color spaces and filters
  useEffect(() => {
    textures.forEach((t) => {
      if (!t) return;
      t.colorSpace = THREE.SRGBColorSpace; // photos are sRGB
      t.magFilter = THREE.LinearFilter;
      // Keep mipmaps for images for better quality when scaled
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy?.() || 1);
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

  // Update texture pair and image resolutions when index changes
  useEffect(() => {
    const mat = materialRef.current;
    const tex1 = textures[indexI] || textures[0];
    const tex2 = textures[indexJ] || textures[textures.length - 1];
    if (!tex1 || !tex2 || !mat) return;

    mat.uniforms.uTexture1.value = tex1;
    mat.uniforms.uTexture2.value = tex2;
    mat.uniforms.uDisp.value = dispTex;

    const img1 = (tex1.image as HTMLImageElement) || { width: 1, height: 1 };
    const img2 = (tex2.image as HTMLImageElement) || { width: 1, height: 1 };
    mat.uniforms.uImageRes1.value.set(img1.width || 1, img1.height || 1);
    mat.uniforms.uImageRes2.value.set(img2.width || 1, img2.height || 1);

    // IMPORTANT: prevent boundary twitch when pair changes by syncing progress
    progressRef.current = fTarget;
    mat.uniforms.uProgress.value = fTarget;
  }, [indexI, indexJ, textures, dispTex, fTarget]);

  // Update resolution uniform when canvas resizes or dpr changes
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    const dpr = gl.getPixelRatio();
    mat.uniforms.uResolution.value.set(size.width * dpr, size.height * dpr);
  }, [size, gl]);

  // Animate progress (damping)
  useFrame(() => {
    const mat = materialRef.current;
    if (!mat) return;
    if (disableDamping) {
      progressRef.current = fTarget;
    } else {
      const p = progressRef.current;
      progressRef.current = p + (fTarget - p) * 0.12; // simple critically-damped-ish lerp
    }
    mat.uniforms.uProgress.value = clamp(progressRef.current, 0, 1);
    mat.uniforms.uIntensity.value = intensity;
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
          uImageRes1: { value: new THREE.Vector2(1, 1) },
          uImageRes2: { value: new THREE.Vector2(1, 1) },
        },
        vertexShader,
        fragmentShader,
        transparent: false,
      }),
    [],
  );

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 1]} />
      {/* Unit plane scaled to viewport to fill the view */}
      <mesh scale={[viewport.width, viewport.height, 1]}>
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

// Loads textures within the R3F Canvas context and renders the morph scene
type GLContentProps = {
  images: string[];
  displacementUrl?: string;
  indexI: number;
  indexJ: number;
  fTarget: number;
  intensity: number;
  disableDamping?: boolean;
};

function GLContent({
  images,
  displacementUrl,
  indexI,
  indexJ,
  fTarget,
  intensity,
  disableDamping,
}: GLContentProps) {
  // Preload all image textures inside Canvas context
  const textures = useTexture(images) as unknown as THREE.Texture[];

  // Displacement texture: either from URL or generated noise (hooks called inside Canvas)
  const fallbackForHook = displacementUrl || images[0];
  const loadedDisp = useTexture(fallbackForHook) as THREE.Texture;
  const noiseDisp = useMemo(() => makeNoiseTexture(256), []);
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
    />
  );
}

export const FeelingImageMorphGL: React.FC<FeelingImageMorphGLProps> = ({
  images,
  labels,
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
  // New buttons defaults
  showButtons = false,
  buttonsOnly = false,
  buttonStep = 1,
  transitionDurationMs = 350,
  disableButtonsAtEnds = true,
}) => {
  // Validate props
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

  // Controlled/uncontrolled slider state
  const isControlled = typeof value === 'number';
  const [internalValue, setInternalValue] = useState<number>(
    clamp(initialValue, 0, images.length - 1),
  );
  const t = clamp(isControlled ? value : internalValue, 0, images.length - 1);

  // Local animation for button-driven transitions when controlled
  const [animatedT, setAnimatedT] = useState<number | null>(null);

  // Displayed value (drives GL + slider)
  const viewT = isControlled ? (animatedT ?? t) : t;

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

  // Label for current integer index (based on displayed value)
  const currentIndexForLabel = clamp(Math.round(viewT), 0, images.length - 1);
  const labelText =
    labels && labels[currentIndexForLabel]
      ? `${labels[currentIndexForLabel]}`
      : `${currentIndexForLabel + 1} / ${images.length}`;

  // Simple styles
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
    background: '#FAF8F4',
  };
  const sliderWrap: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 0 0 0',
  };
  const labelBadge: React.CSSProperties = {
    position: 'absolute',
    left: 12,
    bottom: 12,
    padding: '4px 8px',
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: 12,
    borderRadius: 8,
    pointerEvents: 'none',
  };

  // Slider events and snapping
  const [isInteracting, setIsInteracting] = useState(false);

  // snap animation refs (slider snap-on-release)
  const snapRaf = useRef<number | null>(null);
  const snapStart = useRef<number>(0);
  const snapFrom = useRef<number>(0);
  const snapTo = useRef<number>(0);
  const snapDuration = useRef<number>(200); // ms

  const cancelSnap = useCallback(() => {
    if (snapRaf.current != null) {
      cancelAnimationFrame(snapRaf.current);
      snapRaf.current = null;
    }
  }, []);

  // button-driven animation refs
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

  // If parent updates controlled value during a local animation, follow parent
  useEffect(() => {
    if (isControlled) {
      // Hand control back to parent on any external value change
      setAnimatedT(null);
    }
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
        // In controlled mode, prefer calling once with the final value
        if (onChange) onChange(nearest);
        return;
      }

      // Already at integer
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

  // Button-driven animation to a target integer index
  const animateToIndex = useCallback(
    (targetIndex: number) => {
      cancelButtonAnim();
      cancelSnap();
      const last = images.length - 1;
      const clampedTarget = clamp(Math.round(targetIndex), 0, last);
      // Determine current starting point from what user sees now
      const currentView = isControlled ? (animatedT ?? value) : internalValue;

      if (!isFinite(currentView)) return;

      // If already at target, nothing to do
      if (Math.abs(currentView - clampedTarget) < 1e-6) {
        if (isControlled) {
          onChange?.(clampedTarget);
        } else {
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
        if (isControlled) {
          setAnimatedT(nextVal);
        } else {
          setInternalValue(nextVal);
        }
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

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value);
    cancelButtonAnim();
    // Deprecated snapToSteps: rounds while dragging only
    const next = snapToSteps && isInteracting ? Math.round(raw) : raw;
    handleChange(next);
  };

  const onPointerDown = () => {
    setIsInteracting(true);
    cancelSnap();
    cancelButtonAnim();
  };

  const onPointerUp = () => {
    setIsInteracting(false);
    if (snapOnRelease) {
      startSnap();
    }
  };

  const onPointerCancel = () => {
    setIsInteracting(false);
    if (snapOnRelease) {
      startSnap();
    }
  };

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
    if (keys.includes(e.key)) {
      startSnap();
    }
  };

  return (
    <div style={wrapperStyle} className={className}>
      <div style={viewportStyle}>
        <Canvas dpr={[1, 2]} gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <GLContent
              images={images}
              displacementUrl={displacementUrl}
              indexI={i}
              indexJ={j}
              fTarget={f}
              intensity={intensity}
              disableDamping={disableDamping}
            />
          </Suspense>
        </Canvas>
        <div style={labelBadge} aria-hidden="true">
          {labelText}
        </div>
      </div>
      {(showSlider !== false && !buttonsOnly) || showButtons ? (
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
          {showSlider !== false && !buttonsOnly && (
            <input
              aria-label="Image morph slider"
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={step}
              value={viewT}
              onChange={onInput}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onKeyUp={onKeyUp}
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
    </div>
  );
};

export default FeelingImageMorphGL;

/*
Usage example:

import { FeelingImageMorphGL } from 'components/FeelingImageMorphGL';

export function Demo() {
  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
      <FeelingImageMorphGL
        images={[
          'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=1600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?q=80&w=1600&auto=format&fit=crop',
        ]}
        labels={["One", "Two", "Three"]}
        height={400}
        step={0.01}
        intensity={0.4}
      />
    </div>
  );
}
*/
