export type TabType = 'basic' | 'cmpd' | 'cash' | 'amrt';

export interface CalculationHistory {
  id: string;
  timestamp: Date;
  tabType: TabType;
  description: string;
  result: string;
  details?: Record<string, any>;
}

export interface CMPDInputs {
  pv?: number;
  fv?: number;
  rate?: number;
  periods?: number;
  pmt?: number;
  paymentTiming?: 'begin' | 'end';
  rateType?: 'fixed' | 'variable';
  variableRates?: number[];
}

export interface CashFlow {
  period: number;
  amount: number | string;
}

export interface CASHInputs {
  cashFlows: CashFlow[];
  discountRate?: number;
  discountRateType?: 'fixed' | 'variable';
  variableDiscountRates?: number[];
  solverEnabled?: boolean;
  solverPeriod?: number;
  targetNPV?: number;
}

export interface AMRTInputs {
  principal: number;
  rate: number;
  periods: number;
  paymentTiming?: 'begin' | 'end';
  scheduleType: 'shpitzer' | 'regular' | 'balloon' | 'grace';
  gracePeriods?: number;
}

export interface AMRTRow {
  period: number;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  remainingBalance: number;
}

export interface AMRTSummary {
  totalPrincipal: number;
  totalInterest: number;
  totalPayment: number;
}
