import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { CalculatorState, CalculatorCoreInputs } from 'domain/calculator/types';

const STORAGE_KEY = 'calculator:v1';

const createEmptyCore = (): CalculatorCoreInputs => ({
  currentSavings: 0,
  monthlySaving: 0,
  savingPeriodMonths: 0,
  maxInstallment: 0,
});

const createInitialState = (): CalculatorState => ({
  core: createEmptyCore(),
  advanced: undefined,
  derived: undefined,
});

const CalculatorContext = createContext<{
  state: CalculatorState;
  setState: React.Dispatch<React.SetStateAction<CalculatorState>>;
}>({
  state: createInitialState(),
  setState: () => {},
});

export const CalculatorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<CalculatorState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createInitialState();

      const parsed = JSON.parse(raw) as CalculatorState;
      if (!parsed || typeof parsed !== 'object' || !('core' in parsed)) {
        return createInitialState();
      }

      return {
        core: {
          currentSavings: parsed.core.currentSavings ?? 0,
          monthlySaving: parsed.core.monthlySaving ?? 0,
          savingPeriodMonths: parsed.core.savingPeriodMonths ?? 0,
          maxInstallment: parsed.core.maxInstallment ?? 0,
        },
        advanced: parsed.advanced,
        derived: parsed.derived,
      };
    } catch {
      return createInitialState();
    }
  });

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // ignore write errors
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [state]);

  const value = useMemo(() => ({ state, setState }), [state]);

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
};

export const useCalculator = () => useContext(CalculatorContext);
