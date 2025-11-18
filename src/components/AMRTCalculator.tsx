import { useState } from 'react';
import { evaluate } from 'mathjs';
import { ExpressionInput } from './ExpressionInput';
import { generateSchedule, calculateSummary } from '../lib/amortization';
import { formatNumber } from '../lib/formatters';
import type { AMRTRow } from '../types';

interface AMRTCalculatorProps {
  onCalculate: (description: string, result: string, details?: Record<string, any>) => void;
  onDataChange?: (data: {
    principal: number;
    rate: number;
    periods: number;
    paymentTiming: 'begin' | 'end';
    scheduleType: string;
    gracePeriods?: number;
    schedule: AMRTRow[];
    summary?: {
      fromPeriod: number;
      toPeriod: number;
      totalPrincipal: number;
      totalInterest: number;
      totalPayment: number;
    };
  }) => void;
}

type ScheduleType = 'shpitzer' | 'regular' | 'balloon' | 'grace';

const SCHEDULE_LABELS: Record<ScheduleType, string> = {
  shpitzer: 'שפיצר (Equal Principal)',
  regular: 'סילוקין רגיל (Equal Payments)',
  balloon: 'בלון (Balloon)',
  grace: 'גרייס/חסד (Grace Period)',
};

export function AMRTCalculator({ onCalculate, onDataChange }: AMRTCalculatorProps) {
  const [principalInput, setPrincipalInput] = useState('100000');
  const [rateInput, setRateInput] = useState('5');
  const [periodsInput, setPeriodsInput] = useState('12');
  const [paymentTiming, setPaymentTiming] = useState<'begin' | 'end'>('end');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('shpitzer');
  const [gracePeriodsInput, setGracePeriodsInput] = useState('3');
  const [schedule, setSchedule] = useState<AMRTRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Summation inputs
  const [fromPeriodInput, setFromPeriodInput] = useState('1');
  const [toPeriodInput, setToPeriodInput] = useState('');
  const [summaryResult, setSummaryResult] = useState<{
    totalPrincipal: number;
    totalInterest: number;
    totalPayment: number;
  } | null>(null);

  const handleCalculate = () => {
    try {
      setError(null);
      setSchedule(null);
      setSummaryResult(null);

      const principal = evaluate(principalInput);
      const rate = evaluate(rateInput);
      const periods = evaluate(periodsInput);
      const gracePeriods = scheduleType === 'grace' ? evaluate(gracePeriodsInput) : undefined;

      if (principal <= 0 || rate < 0 || periods <= 0) {
        setError('Invalid input values');
        return;
      }

      if (scheduleType === 'grace' && (!gracePeriods || gracePeriods <= 0 || gracePeriods > periods)) {
        setError('Invalid grace periods');
        return;
      }

      const generatedSchedule = generateSchedule(
        principal,
        rate,
        periods,
        scheduleType,
        paymentTiming,
        gracePeriods
      );

      setSchedule(generatedSchedule);
      setToPeriodInput(periods.toString());

      // Store data for Excel export
      if (onDataChange) {
        onDataChange({
          principal,
          rate,
          periods,
          paymentTiming,
          scheduleType: SCHEDULE_LABELS[scheduleType],
          gracePeriods: scheduleType === 'grace' ? gracePeriods : undefined,
          schedule: generatedSchedule,
        });
      }

      onCalculate(
        `AMRT: ${SCHEDULE_LABELS[scheduleType]}`,
        `Generated ${generatedSchedule.length} periods`,
        {
          Principal: principal.toFixed(2),
          'Rate (%)': rate,
          Periods: periods,
          Timing: paymentTiming.toUpperCase(),
          Type: SCHEDULE_LABELS[scheduleType],
        }
      );
    } catch (err) {
      setError('Invalid input values. Please check your entries.');
    }
  };

  const handleCalculateSummary = () => {
    if (!schedule) {
      setError('Please generate a schedule first');
      return;
    }

    try {
      setError(null);
      const fromPeriod = evaluate(fromPeriodInput);
      const toPeriod = evaluate(toPeriodInput);

      if (fromPeriod < 1 || toPeriod > schedule.length || fromPeriod > toPeriod) {
        setError('Invalid period range');
        return;
      }

      const summary = calculateSummary(schedule, fromPeriod, toPeriod);
      setSummaryResult(summary);

      // Update data with summary
      if (onDataChange) {
        const principal = evaluate(principalInput);
        const rate = evaluate(rateInput);
        const periods = evaluate(periodsInput);
        const gracePeriods = scheduleType === 'grace' ? evaluate(gracePeriodsInput) : undefined;

        onDataChange({
          principal,
          rate,
          periods,
          paymentTiming,
          scheduleType: SCHEDULE_LABELS[scheduleType],
          gracePeriods,
          schedule,
          summary: {
            fromPeriod,
            toPeriod,
            totalPrincipal: summary.totalPrincipal,
            totalInterest: summary.totalInterest,
            totalPayment: summary.totalPayment,
          },
        });
      }

      onCalculate(
        `AMRT: Summary (Periods ${fromPeriod}-${toPeriod})`,
        `Total Payment = ${summary.totalPayment.toFixed(2)}`,
        {
          'Total Principal': summary.totalPrincipal.toFixed(2),
          'Total Interest': summary.totalInterest.toFixed(2),
          'Total Payment': summary.totalPayment.toFixed(2),
        }
      );
    } catch (err) {
      setError('Invalid period range');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Amortization Schedule</h2>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Principal</label>
              <ExpressionInput
                value={principalInput}
                onChange={setPrincipalInput}
                placeholder="e.g., 100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate (%)</label>
              <ExpressionInput value={rateInput} onChange={setRateInput} placeholder="e.g., 5" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Periods</label>
              <ExpressionInput value={periodsInput} onChange={setPeriodsInput} placeholder="e.g., 12" />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Timing</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={paymentTiming === 'end'}
                    onChange={() => setPaymentTiming('end')}
                    className="mr-2"
                  />
                  END
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={paymentTiming === 'begin'}
                    onChange={() => setPaymentTiming('begin')}
                    className="mr-2"
                  />
                  BEGIN
                </label>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Type</label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(SCHEDULE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {scheduleType === 'grace' && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Grace Periods</label>
                <ExpressionInput
                  value={gracePeriodsInput}
                  onChange={setGracePeriodsInput}
                  placeholder="e.g., 3"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleCalculate}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            Calculate Schedule
          </button>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md shadow-sm">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
        </div>

        {schedule && (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Amortization Table</h3>
              <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-700 to-gray-800 sticky top-0 z-10 shadow-md">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">
                        תקופה
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">
                        תשלום על חשבון הקרן
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">
                        תשלום על חשבון הריבית
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">
                        סה"כ לתשלום
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">
                        יתרת קרן בלתי מסולקת
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schedule.map((row, index) => (
                      <tr key={row.period} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">{row.period}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                          {formatNumber(row.principalPayment)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                          {formatNumber(row.interestPayment)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-blue-900">
                          {formatNumber(row.totalPayment)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                          {formatNumber(row.remainingBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Period Summation</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Period</label>
                  <ExpressionInput
                    value={fromPeriodInput}
                    onChange={setFromPeriodInput}
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Period</label>
                  <ExpressionInput
                    value={toPeriodInput}
                    onChange={setToPeriodInput}
                    placeholder={schedule.length.toString()}
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleCalculateSummary}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Calculate Sum
                  </button>
                </div>
              </div>

              {summaryResult && (
                <div className="grid grid-cols-3 gap-4 p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Total Principal</p>
                    <p className="text-xl font-bold text-blue-900">
                      {formatNumber(summaryResult.totalPrincipal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Total Interest</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatNumber(summaryResult.totalInterest)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Total Payment</p>
                    <p className="text-xl font-bold text-green-700">
                      {formatNumber(summaryResult.totalPayment)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
