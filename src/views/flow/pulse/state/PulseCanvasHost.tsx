import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Signal to Pulse pages that the shared Canvas is mounted and ready.
 */
const PulseCanvasReadyContext = createContext(false);
export const usePulseCanvasReady = () => useContext(PulseCanvasReadyContext);

/**
 * Persistent R3F Canvas for the Pulse flow subtree.
 * - Renders once and lives across all /flow/pulse routes.
 * - Uses drei <View.Port /> so child pages can render scenes via <View track={ref}>.
 * - Keeps pointer events off the canvas element so regular UI remains interactive.
 */
export const PulseCanvasHost: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  // Delay mounting Canvas by a frame to avoid Strict-Effects/timing races on first paint
  useLayoutEffect(() => {
    let id1: number | null = null;
    let id2: number | null = null;
    const rAF =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (cb: FrameRequestCallback) =>
            window.setTimeout(() => cb(performance.now()), 16);
    const cAF =
      typeof cancelAnimationFrame === 'function'
        ? cancelAnimationFrame
        : (id: number) => window.clearTimeout(id);

    id1 = rAF(() => {
      id2 = rAF(() => setReady(true));
    });
    return () => {
      if (id1 != null) cAF(id1);
      if (id2 != null) cAF(id2);
    };
  }, []);

  if (!ready) return null;

  return (
    <PulseCanvasReadyContext.Provider value={true}>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 5,
          pointerEvents: 'none', // UI controls should receive events
        }}
      >
        <Canvas
          ref={canvasRef}
          dpr={[1, 1.5]}
          frameloop="demand"
          gl={{
            alpha: true,
            antialias: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: true,
          }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.NoToneMapping;
            gl.setClearColor(0x000000, 0);
          }}
          // Mark as shared Pulse canvas for snapshot queries
          data-pulse-shared="1"
          // Ensure the canvas itself does not intercept pointer events
          style={{ pointerEvents: 'none' }}
          eventPrefix="client"
        >
          {/* Shared view port for all <View> instances on Pulse pages */}
          <View.Port />
        </Canvas>
      </div>
    </PulseCanvasReadyContext.Provider>
  );
};

export default PulseCanvasHost;
