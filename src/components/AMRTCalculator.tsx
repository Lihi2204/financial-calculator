import { useState } from 'react';
import { evaluate } from 'mathjs';
import { ExpressionInput } from './ExpressionInput';
import { generateSchedule, calculateSummary } from '../lib/amortization';
import type { AMRTRow } from '../types';

interface AMRTCalculatorProps {
  onCalculate: (description: string, result: string, details?: Record<string, any>) => void;
}

type ScheduleType = 'shpitzer' | 'regular' | 'balloon' | 'grace';

const SCHEDULE_LABELS: Record<ScheduleType, string> = {
  shpitzer: 'שפיצר (Equal Principal)',
  regular: 'סילוקין רגיל (Equal Payments)',
  balloon: 'בלון (Balloon)',
  grace: 'גרייס/חסד (Grace Period)',
};

export function AMRTCalculator({ onCalculate }: AMRTCalculatorProps) {
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Amortization Schedule</h2>

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
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium"
          >
            Calculate Schedule
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {schedule && (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Amortization Table</h3>
              <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-300 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        תקופה
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        תשלום על חשבון הקרן
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        תשלום על חשבון הריבית
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        סה"כ לתשלום
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        יתרת קרן בלתי מסולקת
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schedule.map((row) => (
                      <tr key={row.period} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{row.period}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                          {row.principalPayment.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                          {row.interestPayment.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                          {row.totalPayment.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                          {row.remainingBalance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-4">Period Summation</h3>
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
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
                  >
                    Calculate Sum
                  </button>
                </div>
              </div>

              {summaryResult && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-md border border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Total Principal</p>
                    <p className="text-xl font-bold text-gray-900">
                      {summaryResult.totalPrincipal.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Interest</p>
                    <p className="text-xl font-bold text-gray-900">
                      {summaryResult.totalInterest.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Payment</p>
                    <p className="text-xl font-bold text-green-800">
                      {summaryResult.totalPayment.toFixed(2)}
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
