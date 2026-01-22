import React from 'react';
import { Outlet } from 'react-router-dom';
import { CalculatorProvider } from '../../../../features/calculator/state';

/**
 * ProviderOutlet wraps all calculator steps with a single CalculatorProvider
 * so the state remains stable while navigating within the flow.
 */
export const CalculatorProviderOutlet: React.FC = () => {
  return (
    <CalculatorProvider>
      <Outlet />
    </CalculatorProvider>
  );
};
