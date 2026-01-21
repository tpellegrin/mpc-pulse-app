// -------------------- Types --------------------

export type CalcResult = {
  maxHomePrice: number;
  monthly: {
    principalInterest: number;
    tax: number;
    insurance: number;
    hoa: number;
    total: number;
  };
  downPayment: number;
};

export type SimpleInputs = {
  monthlySaving: number; // how much they save per month
  savingPeriodMonths: number; // for how long they will save
  maxInstallment: number; // comfortable future *mortgage* payment (P&I only)
  currentSavings?: number; // optional, default 0
};

// Advanced configuration / levers
export type AffordabilityConfig = {
  interestAPR?: number; // annual interest rate (e.g. 10 for 10%)
  propertyTaxAnnualPct?: number; // % of home price per year
  insuranceAnnualPct?: number; // % of home price per year
  hoaMonthly?: number; // condomínio / HOA
  loanTermYears?: number; // 30 by default
  minEntryPct?: number; // MINIMUM down payment %, e.g. 0.2 = 20%
  closingCostsPct?: number; // closing cost as % of price, from savings
  reservePctOfSavings?: number; // fraction of total savings kept as reserve
};

// -------------------- Defaults --------------------

const DEFAULT_CONFIG: Required<AffordabilityConfig> = {
  interestAPR: 10,
  propertyTaxAnnualPct: 1.0,
  insuranceAnnualPct: 0.5,
  hoaMonthly: 0,
  loanTermYears: 30,
  minEntryPct: 0.2,
  closingCostsPct: 0.04,
  reservePctOfSavings: 0.1,
};

// -------------------- Core engine --------------------

const computeAffordabilityWithConfig = (
  inputs: SimpleInputs,
  cfgOverrides: AffordabilityConfig = {},
): CalcResult => {
  const cfg: Required<AffordabilityConfig> = {
    ...DEFAULT_CONFIG,
    ...cfgOverrides,
  };

  const {
    interestAPR,
    propertyTaxAnnualPct,
    insuranceAnnualPct,
    hoaMonthly,
    loanTermYears,
    minEntryPct,
    closingCostsPct,
    reservePctOfSavings,
  } = cfg;

  // ---------- Savings & usable cash ----------

  const currentSavings = inputs.currentSavings ?? 0;
  const futureSavings =
    currentSavings + inputs.monthlySaving * inputs.savingPeriodMonths;

  // Keep a buffer; only use this share for down + closing
  const usableSavings = Math.max(0, futureSavings * (1 - reservePctOfSavings));

  if (usableSavings <= 0) {
    return {
      maxHomePrice: 0,
      monthly: {
        principalInterest: 0,
        tax: 0,
        insurance: 0,
        hoa: hoaMonthly,
        total: hoaMonthly,
      },
      downPayment: 0,
    };
  }

  // This is a *hard* upper bound for price:
  // even if you only put the minimum down, you must still pay minEntryPct + closingCostsPct in cash.
  const totalMinCashPct = minEntryPct + closingCostsPct;
  const priceBySavingsUpperBound =
    totalMinCashPct > 0 ? usableSavings / totalMinCashPct : Infinity;

  if (!isFinite(priceBySavingsUpperBound) || priceBySavingsUpperBound <= 0) {
    return {
      maxHomePrice: 0,
      monthly: {
        principalInterest: 0,
        tax: 0,
        insurance: 0,
        hoa: hoaMonthly,
        total: hoaMonthly,
      },
      downPayment: 0,
    };
  }

  // ---------- Loan / monthly math ----------

  const apr = interestAPR / 100;
  const nMonths = loanTermYears * 12;
  const r = apr / 12;

  const taxPct = propertyTaxAnnualPct / 100;
  const insPct = insuranceAnnualPct / 100;

  const maxAffordableMortgage = Math.max(0, inputs.maxInstallment);

  const amortizedPayment = (principal: number): number => {
    if (principal <= 0) return 0;
    if (r === 0) return principal / nMonths;
    return (principal * r) / (1 - Math.pow(1 + r, -nMonths));
  };

  type PriceEval = {
    feasible: boolean;
    principalInterest: number;
    tax: number;
    insurance: number;
    total: number; // full monthly cost for display
    downPayment: number;
  };

  // For a given home price, choose the largest feasible down payment
  // the buyer can afford (respecting savings and minEntryPct), then
  // check whether the resulting mortgage payment fits the cap.
  const evaluatePrice = (price: number): PriceEval => {
    if (price <= 0) {
      return {
        feasible: true,
        principalInterest: 0,
        tax: 0,
        insurance: 0,
        total: hoaMonthly,
        downPayment: 0,
      };
    }

    const closing = price * closingCostsPct;
    const minDown = price * minEntryPct;

    // Max cash available for down after paying closing costs
    const maxCashForDown = Math.max(0, usableSavings - closing);

    // If we can't even meet minimum down, this price is infeasible
    if (maxCashForDown < minDown) {
      return {
        feasible: false,
        principalInterest: 0,
        tax: 0,
        insurance: 0,
        total: Number.POSITIVE_INFINITY,
        downPayment: minDown,
      };
    }

    // Use as much down payment as possible, up to full price (all-cash)
    const downPayment = Math.min(price, maxCashForDown);
    const loan = Math.max(0, price - downPayment);

    const principalInterest = amortizedPayment(loan);
    const taxMonthly = (price * taxPct) / 12;
    const insMonthly = (price * insPct) / 12;
    const totalMonthly =
      principalInterest + taxMonthly + insMonthly + hoaMonthly;

    // Constraint 1: mortgage-only cap (P&I)
    const mortgageFeasible =
      principalInterest <= maxAffordableMortgage && isFinite(principalInterest);

    // Constraint 2: "no mortgage" mode (maxInstallment = 0) with all-cash
    const cashOnlyFeasible =
      maxAffordableMortgage === 0 && loan === 0 && isFinite(totalMonthly);

    return {
      feasible: mortgageFeasible || cashOnlyFeasible,
      principalInterest,
      tax: taxMonthly,
      insurance: insMonthly,
      total: totalMonthly,
      downPayment,
    };
  };

  // ---------- Binary search on max feasible price ----------

  let lo = 0;
  let hi = Math.min(priceBySavingsUpperBound, 100_000_000); // safety cap
  let bestEval = evaluatePrice(0);
  let bestPrice = 0;

  // We assume feasibility is monotone in price:
  // once a price is infeasible, higher prices are also infeasible,
  // given we always use the *maximum* affordable down payment.
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const evalMid = evaluatePrice(mid);

    if (evalMid.feasible) {
      bestPrice = mid;
      bestEval = evalMid;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const finalPrice = isFinite(bestPrice) ? bestPrice : 0;

  return {
    maxHomePrice: finalPrice,
    monthly: {
      principalInterest: bestEval.principalInterest,
      tax: bestEval.tax,
      insurance: bestEval.insurance,
      hoa: hoaMonthly,
      total: bestEval.total,
    },
    downPayment: bestEval.downPayment,
  };
};

export const computeAffordabilitySimple = (
  inputs: SimpleInputs,
): CalcResult => computeAffordabilityWithConfig(inputs);

export const refineAffordability = (
  inputs: SimpleInputs,
  overrides: AffordabilityConfig,
): CalcResult => computeAffordabilityWithConfig(inputs, overrides);
