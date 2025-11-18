import { calculateFV, calculateFVVariable, calculatePV, calculateNPV, calculateNPVVariable } from './financial';

/**
 * Bisection method for finding roots
 */
export function bisectionMethod(
  func: (x: number) => number,
  a: number,
  b: number,
  tolerance: number = 1e-6,
  maxIterations: number = 100
): number | null {
  let fa = func(a);
  let fb = func(b);

  if (fa * fb > 0) {
    return null; // No root in interval
  }

  for (let i = 0; i < maxIterations; i++) {
    const c = (a + b) / 2;
    const fc = func(c);

    if (Math.abs(fc) < tolerance || Math.abs(b - a) < tolerance) {
      return c;
    }

    if (fa * fc < 0) {
      b = c;
      fb = fc;
    } else {
      a = c;
      fa = fc;
    }
  }

  return (a + b) / 2; // Return midpoint if max iterations reached
}

/**
 * Solve for FV in compound interest (fixed rate)
 */
export function solveCMPDFV(
  pv: number,
  rate: number,
  periods: number,
  pmt: number,
  paymentTiming: 'begin' | 'end'
): number {
  return calculateFV(pv, rate, periods, pmt, paymentTiming);
}

/**
 * Solve for FV in compound interest (variable rates)
 */
export function solveCMPDFVVariable(
  pv: number,
  variableRates: number[],
  pmt: number,
  paymentTiming: 'begin' | 'end'
): number {
  return calculateFVVariable(pv, variableRates, pmt, paymentTiming);
}

/**
 * Solve for PV in compound interest
 */
export function solveCMPDPV(
  fv: number,
  rate: number,
  periods: number,
  pmt: number,
  paymentTiming: 'begin' | 'end'
): number {
  return calculatePV(fv, rate, periods, pmt, paymentTiming);
}

/**
 * Solve for rate in compound interest
 */
export function solveCMPDRate(
  pv: number,
  fv: number,
  periods: number,
  pmt: number,
  paymentTiming: 'begin' | 'end'
): number | null {
  const func = (rate: number) => {
    return calculateFV(pv, rate, periods, pmt, paymentTiming) - fv;
  };

  return bisectionMethod(func, -99, 1000, 1e-6, 200);
}

/**
 * Solve for periods in compound interest
 */
export function solveCMPDPeriods(
  pv: number,
  fv: number,
  rate: number,
  pmt: number,
  paymentTiming: 'begin' | 'end'
): number | null {
  const func = (periods: number) => {
    return calculateFV(pv, rate, periods, pmt, paymentTiming) - fv;
  };

  return bisectionMethod(func, 0.1, 10000, 1e-6, 200);
}

/**
 * Solve for cash flow X to achieve target NPV
 */
export function solveDCFCashFlow(
  cashFlows: number[],
  solverPeriod: number,
  targetNPV: number,
  discountRate: number,
  discountRateType: 'fixed' | 'variable',
  variableDiscountRates?: number[]
): number | null {
  const func = (x: number) => {
    const modifiedCashFlows = [...cashFlows];
    modifiedCashFlows[solverPeriod] = x;

    let npv: number;
    if (discountRateType === 'variable' && variableDiscountRates) {
      npv = calculateNPVVariable(modifiedCashFlows, variableDiscountRates);
    } else {
      npv = calculateNPV(modifiedCashFlows, discountRate);
    }

    return npv - targetNPV;
  };

  return bisectionMethod(func, -1e10, 1e10, 1e-6, 200);
}
