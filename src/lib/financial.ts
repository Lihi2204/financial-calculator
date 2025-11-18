/**
 * Calculate Future Value with fixed rate
 */
export function calculateFV(
  pv: number,
  rate: number,
  periods: number,
  pmt: number = 0,
  paymentTiming: 'begin' | 'end' = 'end'
): number {
  const r = rate / 100;
  const n = periods;

  if (r === 0) {
    return pv + pmt * n;
  }

  const pvFactor = Math.pow(1 + r, n);
  const pmtFactor = ((Math.pow(1 + r, n) - 1) / r) * (paymentTiming === 'begin' ? (1 + r) : 1);

  return pv * pvFactor + pmt * pmtFactor;
}

/**
 * Calculate Future Value with variable rates
 */
export function calculateFVVariable(
  pv: number,
  variableRates: number[],
  pmt: number = 0,
  paymentTiming: 'begin' | 'end' = 'end'
): number {
  let fv = pv;

  for (let i = 0; i < variableRates.length; i++) {
    const r = variableRates[i] / 100;

    if (paymentTiming === 'begin') {
      fv = (fv + pmt) * (1 + r);
    } else {
      fv = fv * (1 + r) + pmt;
    }
  }

  return fv;
}

/**
 * Calculate Present Value
 */
export function calculatePV(
  fv: number,
  rate: number,
  periods: number,
  pmt: number = 0,
  paymentTiming: 'begin' | 'end' = 'end'
): number {
  const r = rate / 100;
  const n = periods;

  if (r === 0) {
    return fv - pmt * n;
  }

  const fvFactor = Math.pow(1 + r, -n);
  const pmtFactor = ((1 - Math.pow(1 + r, -n)) / r) * (paymentTiming === 'begin' ? (1 + r) : 1);

  return fv * fvFactor - pmt * pmtFactor;
}

/**
 * Calculate Net Present Value with fixed discount rate
 */
export function calculateNPV(cashFlows: number[], discountRate: number): number {
  const r = discountRate / 100;
  let npv = 0;

  for (let i = 0; i < cashFlows.length; i++) {
    npv += cashFlows[i] / Math.pow(1 + r, i);
  }

  return npv;
}

/**
 * Calculate Net Present Value with variable discount rates
 */
export function calculateNPVVariable(cashFlows: number[], variableDiscountRates: number[]): number {
  let npv = cashFlows[0]; // Initial cash flow (t=0)

  for (let i = 1; i < cashFlows.length; i++) {
    let discountFactor = 1;
    for (let j = 0; j < i; j++) {
      discountFactor *= (1 + variableDiscountRates[j] / 100);
    }
    npv += cashFlows[i] / discountFactor;
  }

  return npv;
}

/**
 * Calculate Internal Rate of Return using Newton's method
 */
export function calculateIRR(cashFlows: number[], guess: number = 0.1): number | null {
  const maxIterations = 100;
  const tolerance = 1e-6;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }

    if (Math.abs(npv) < tolerance) {
      return rate * 100; // Convert to percentage
    }

    if (Math.abs(dnpv) < 1e-10) {
      return null; // Derivative too small
    }

    rate = rate - npv / dnpv;

    if (rate < -1) {
      return null; // Invalid rate
    }
  }

  return null; // Failed to converge
}

/**
 * Calculate Profitability Index
 */
export function calculatePI(cashFlows: number[], discountRate: number): number | null {
  const initialInvestment = Math.abs(cashFlows[0]);

  if (initialInvestment === 0) {
    return null;
  }

  let presentValueOfFutureCashFlows = 0;
  const r = discountRate / 100;

  for (let i = 1; i < cashFlows.length; i++) {
    presentValueOfFutureCashFlows += cashFlows[i] / Math.pow(1 + r, i);
  }

  return presentValueOfFutureCashFlows / initialInvestment;
}

/**
 * Calculate Payment (PMT)
 */
export function calculatePMT(
  pv: number,
  fv: number,
  rate: number,
  periods: number,
  paymentTiming: 'begin' | 'end' = 'end'
): number {
  const r = rate / 100;
  const n = periods;

  if (r === 0) {
    return -(fv - pv) / n;
  }

  const pvFactor = Math.pow(1 + r, n);
  const pmtFactor = ((Math.pow(1 + r, n) - 1) / r) * (paymentTiming === 'begin' ? (1 + r) : 1);

  return -(fv - pv * pvFactor) / pmtFactor;
}
