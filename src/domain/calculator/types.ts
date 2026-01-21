// -------------------- Basic shared types --------------------

export type MonthlyBreakdown = {
  principalInterest: number;
  tax: number;
  insurance: number;
  hoa: number;
  total: number;
};

// What the calculator ultimately returns
export type CalcResult = {
  maxHomePrice: number;
  monthly: MonthlyBreakdown;
  downPayment: number;
  futureSavings: number;
  usableSavings: number;
};

// -------------------- New CalculatorState shape --------------------

// Upfront / simple inputs (what you collect in the main flow)
export type CalculatorCoreInputs = {
  monthlySaving: number; // R$ saved per month
  savingPeriodMonths: number; // how long they plan to save
  maxInstallment: number; // comfortable future monthly payment
  currentSavings?: number; // R$ already saved (can be 0)
};

// Advanced levers (tweaked on the result screen)
// All optional; anything missing falls back to defaults.
export type CalculatorAdvancedConfig = {
  // Home purchase structure
  entryPct?: number; // min entry/down payment (0.2 = 20%)
  loanTermYears?: number; // amortization term

  // Rate assumptions
  interestAPR?: number; // e.g. 10 (%)
  propertyTaxAnnualPct?: number;
  insuranceAnnualPct?: number;
  hoaMonthly?: number;

  // Cash handling assumptions
  reservePctOfSavings?: number; // fraction of total savings kept as reserve
  closingCostsPct?: number; // closing costs as % of home price

  // Optional expert stuff (for future DTI-based mode)
  incomeMonthlyGross?: number;
  incomeOtherMonthly?: number;
  monthlyDebtPayments?: number;
  frontDTI?: number; // e.g. 0.28
  backDTI?: number; // e.g. 0.36
};

// Derived stuff you may want to store in localStorage as well
export type CalculatorDerivedResult = {
  result: CalcResult;
};

// Single state object persisted in localStorage
export type CalculatorState = {
  core: CalculatorCoreInputs;
  advanced?: CalculatorAdvancedConfig;
  derived?: CalculatorDerivedResult;
};
