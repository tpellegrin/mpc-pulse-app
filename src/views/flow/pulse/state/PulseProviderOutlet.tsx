import React from 'react';
import { Outlet } from 'react-router-dom';
import { PulseProvider } from './pulseContext';
import { PulseCanvasHost } from './PulseCanvasHost';

/**
 * Wrap all Pulse flow routes so selections persist across the subtree.
 * Also mounts a persistent R3F Canvas host so GL isn't torn down between pages.
 */
export const PulseProviderOutlet: React.FC = () => {
  return (
    <PulseProvider>
      {/* Persistent shared Canvas for /flow/pulse */}
      <PulseCanvasHost />
      <Outlet />
    </PulseProvider>
  );
};
