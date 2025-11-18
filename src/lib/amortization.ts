import type { AMRTRow, AMRTSummary } from '../types';

/**
 * Generate Shpitzer schedule (equal principal payments)
 */
export function generateShpitzerSchedule(
  principal: number,
  rate: number,
  periods: number,
  paymentTiming: 'begin' | 'end' = 'end'
): AMRTRow[] {
  const schedule: AMRTRow[] = [];
  const principalPayment = principal / periods;
  const r = rate / 100;
  let remainingBalance = principal;

  for (let period = 1; period <= periods; period++) {
    let interestPayment: number;
    let actualPrincipalPayment: number;

    if (paymentTiming === 'begin') {
      // Payment at beginning: interest on remaining balance after payment
      actualPrincipalPayment = Math.min(principalPayment, remainingBalance);
      const balanceAfterPrincipal = remainingBalance - actualPrincipalPayment;
      interestPayment = balanceAfterPrincipal * r;
    } else {
      // Payment at end: interest on balance before payment
      interestPayment = remainingBalance * r;
      actualPrincipalPayment = Math.min(principalPayment, remainingBalance);
    }

    const totalPayment = actualPrincipalPayment + interestPayment;
    remainingBalance -= actualPrincipalPayment;

    schedule.push({
      period,
      principalPayment: actualPrincipalPayment,
      interestPayment,
      totalPayment,
      remainingBalance: Math.max(0, remainingBalance),
    });
  }

  return schedule;
}

/**
 * Generate regular amortization schedule (equal total payments)
 */
export function generateRegularSchedule(
  principal: number,
  rate: number,
  periods: number,
  paymentTiming: 'begin' | 'end' = 'end'
): AMRTRow[] {
  const schedule: AMRTRow[] = [];
  const r = rate / 100;
  let remainingBalance = principal;

  // Calculate fixed payment amount
  let pmt: number;
  if (r === 0) {
    pmt = principal / periods;
  } else {
    if (paymentTiming === 'begin') {
      pmt = (principal * r) / ((1 - Math.pow(1 + r, -periods)) * (1 + r));
    } else {
      pmt = (principal * r) / (1 - Math.pow(1 + r, -periods));
    }
  }

  for (let period = 1; period <= periods; period++) {
    let interestPayment: number;
    let principalPayment: number;

    if (paymentTiming === 'begin') {
      // Payment at beginning
      principalPayment = Math.min(pmt / (1 + r), remainingBalance);
      const balanceAfterPrincipal = remainingBalance - principalPayment;
      interestPayment = balanceAfterPrincipal * r;
    } else {
      // Payment at end
      interestPayment = remainingBalance * r;
      principalPayment = Math.min(pmt - interestPayment, remainingBalance);
    }

    const totalPayment = principalPayment + interestPayment;
    remainingBalance -= principalPayment;

    schedule.push({
      period,
      principalPayment,
      interestPayment,
      totalPayment,
      remainingBalance: Math.max(0, remainingBalance),
    });
  }

  return schedule;
}

/**
 * Generate balloon schedule (interest-only payments + final balloon)
 */
export function generateBalloonSchedule(
  principal: number,
  rate: number,
  periods: number,
  paymentTiming: 'begin' | 'end' = 'end'
): AMRTRow[] {
  const schedule: AMRTRow[] = [];
  const r = rate / 100;

  for (let period = 1; period <= periods; period++) {
    let interestPayment: number;
    let principalPayment: number;
    let remainingBalance: number;

    if (period < periods) {
      // Interest-only payments
      if (paymentTiming === 'begin') {
        interestPayment = principal * r;
      } else {
        interestPayment = principal * r;
      }
      principalPayment = 0;
      remainingBalance = principal;
    } else {
      // Final balloon payment
      if (paymentTiming === 'begin') {
        interestPayment = 0;
      } else {
        interestPayment = principal * r;
      }
      principalPayment = principal;
      remainingBalance = 0;
    }

    const totalPayment = principalPayment + interestPayment;

    schedule.push({
      period,
      principalPayment,
      interestPayment,
      totalPayment,
      remainingBalance,
    });
  }

  return schedule;
}

/**
 * Generate grace schedule (interest-only during grace, then principal at end)
 */
export function generateGraceSchedule(
  principal: number,
  rate: number,
  periods: number,
  gracePeriods: number,
  paymentTiming: 'begin' | 'end' = 'end'
): AMRTRow[] {
  const schedule: AMRTRow[] = [];
  const r = rate / 100;

  for (let period = 1; period <= periods; period++) {
    let interestPayment: number;
    let principalPayment: number;
    let remainingBalance: number;

    if (period < periods) {
      // Interest-only payments during grace period
      interestPayment = principal * r;
      principalPayment = 0;
      remainingBalance = principal;
    } else {
      // Final payment: last interest + full principal
      interestPayment = principal * r;
      principalPayment = principal;
      remainingBalance = 0;
    }

    const totalPayment = principalPayment + interestPayment;

    schedule.push({
      period,
      principalPayment,
      interestPayment,
      totalPayment,
      remainingBalance,
    });
  }

  return schedule;
}

/**
 * Generate schedule based on type
 */
export function generateSchedule(
  principal: number,
  rate: number,
  periods: number,
  scheduleType: 'shpitzer' | 'regular' | 'balloon' | 'grace',
  paymentTiming: 'begin' | 'end' = 'end',
  gracePeriods?: number
): AMRTRow[] {
  switch (scheduleType) {
    case 'shpitzer':
      return generateShpitzerSchedule(principal, rate, periods, paymentTiming);
    case 'regular':
      return generateRegularSchedule(principal, rate, periods, paymentTiming);
    case 'balloon':
      return generateBalloonSchedule(principal, rate, periods, paymentTiming);
    case 'grace':
      return generateGraceSchedule(principal, rate, periods, gracePeriods || periods, paymentTiming);
    default:
      return [];
  }
}

/**
 * Calculate summary for a range of periods
 */
export function calculateSummary(schedule: AMRTRow[], fromPeriod: number, toPeriod: number): AMRTSummary {
  let totalPrincipal = 0;
  let totalInterest = 0;
  let totalPayment = 0;

  for (const row of schedule) {
    if (row.period >= fromPeriod && row.period <= toPeriod) {
      totalPrincipal += row.principalPayment;
      totalInterest += row.interestPayment;
      totalPayment += row.totalPayment;
    }
  }

  return {
    totalPrincipal,
    totalInterest,
    totalPayment,
  };
}
