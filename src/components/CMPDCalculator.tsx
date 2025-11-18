import { useState } from 'react';
import { evaluate } from 'mathjs';
import { ExpressionInput } from './ExpressionInput';
import {
  solveCMPDFV,
  solveCMPDFVVariable,
  solveCMPDPV,
  solveCMPDRate,
  solveCMPDPeriods,
} from '../lib/solver';
import { calculatePMT } from '../lib/financial';

interface CMPDCalculatorProps {
  onCalculate: (description: string, result: string, details?: Record<string, any>) => void;
}

type SolveFor = 'fv' | 'pv' | 'rate' | 'periods' | 'pmt';

export function CMPDCalculator({ onCalculate }: CMPDCalculatorProps) {
  const [solveFor, setSolveFor] = useState<SolveFor>('fv');
  const [pvInput, setPvInput] = useState('');
  const [fvInput, setFvInput] = useState('');
  const [rateInput, setRateInput] = useState('');
  const [periodsInput, setPeriodsInput] = useState('');
  const [pmtInput, setPmtInput] = useState('0');
  const [paymentTiming, setPaymentTiming] = useState<'begin' | 'end'>('end');
  const [rateType, setRateType] = useState<'fixed' | 'variable'>('fixed');
  const [variableRates, setVariableRates] = useState<string[]>(['']);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    try {
      setError(null);
      setResult(null);

      const pmt = pmtInput.trim() === '' ? 0 : evaluate(pmtInput);

      if (rateType === 'variable') {
        // Variable rate calculation - only supports FV
        if (solveFor !== 'fv') {
          setError('Variable rates only support solving for FV');
          return;
        }

        const pv = evaluate(pvInput);
        const periods = evaluate(periodsInput);

        const rates = variableRates
          .filter((r) => r.trim() !== '')
          .map((r) => evaluate(r));

        if (rates.length === 0) {
          setError('Please enter at least one variable rate');
          return;
        }

        if (rates.length !== periods) {
          setError(`Number of rates (${rates.length}) must equal number of periods (${periods})`);
          return;
        }

        const fv = solveCMPDFVVariable(pv, rates, pmt, paymentTiming);
        setResult(fv.toFixed(2));
        onCalculate(
          `CMPD: Solve for FV (Variable Rates)`,
          `FV = ${fv.toFixed(2)}`,
          {
            PV: pv.toFixed(2),
            Periods: periods,
            PMT: pmt.toFixed(2),
            Timing: paymentTiming.toUpperCase(),
            'Rate Type': 'Variable',
          }
        );
        return;
      }

      // Fixed rate calculations
      switch (solveFor) {
        case 'fv': {
          const pv = evaluate(pvInput);
          const rate = evaluate(rateInput);
          const periods = evaluate(periodsInput);

          const fv = solveCMPDFV(pv, rate, periods, pmt, paymentTiming);
          setResult(fv.toFixed(2));
          onCalculate(`CMPD: Solve for FV`, `FV = ${fv.toFixed(2)}`, {
            PV: pv.toFixed(2),
            Rate: `${rate}%`,
            Periods: periods,
            PMT: pmt.toFixed(2),
            Timing: paymentTiming.toUpperCase(),
          });
          break;
        }

        case 'pv': {
          const fv = evaluate(fvInput);
          const rate = evaluate(rateInput);
          const periods = evaluate(periodsInput);

          const pv = solveCMPDPV(fv, rate, periods, pmt, paymentTiming);
          setResult(pv.toFixed(2));
          onCalculate(`CMPD: Solve for PV`, `PV = ${pv.toFixed(2)}`, {
            FV: fv.toFixed(2),
            Rate: `${rate}%`,
            Periods: periods,
            PMT: pmt.toFixed(2),
            Timing: paymentTiming.toUpperCase(),
          });
          break;
        }

        case 'rate': {
          const pv = evaluate(pvInput);
          const fv = evaluate(fvInput);
          const periods = evaluate(periodsInput);

          const rate = solveCMPDRate(pv, fv, periods, pmt, paymentTiming);
          if (rate === null) {
            setError('Could not find a solution for the rate');
            return;
          }
          setResult(`${rate.toFixed(4)}%`);
          onCalculate(`CMPD: Solve for Rate`, `Rate = ${rate.toFixed(4)}%`, {
            PV: pv.toFixed(2),
            FV: fv.toFixed(2),
            Periods: periods,
            PMT: pmt.toFixed(2),
            Timing: paymentTiming.toUpperCase(),
          });
          break;
        }

        case 'periods': {
          const pv = evaluate(pvInput);
          const fv = evaluate(fvInput);
          const rate = evaluate(rateInput);

          const periods = solveCMPDPeriods(pv, fv, rate, pmt, paymentTiming);
          if (periods === null) {
            setError('Could not find a solution for periods');
            return;
          }
          setResult(periods.toFixed(2));
          onCalculate(`CMPD: Solve for Periods`, `Periods = ${periods.toFixed(2)}`, {
            PV: pv.toFixed(2),
            FV: fv.toFixed(2),
            Rate: `${rate}%`,
            PMT: pmt.toFixed(2),
            Timing: paymentTiming.toUpperCase(),
          });
          break;
        }

        case 'pmt': {
          const pv = evaluate(pvInput);
          const fv = evaluate(fvInput);
          const rate = evaluate(rateInput);
          const periods = evaluate(periodsInput);

          const pmtResult = calculatePMT(pv, fv, rate, periods, paymentTiming);
          setResult(pmtResult.toFixed(2));
          onCalculate(`CMPD: Solve for PMT`, `PMT = ${pmtResult.toFixed(2)}`, {
            PV: pv.toFixed(2),
            FV: fv.toFixed(2),
            Rate: `${rate}%`,
            Periods: periods,
            Timing: paymentTiming.toUpperCase(),
          });
          break;
        }
      }
    } catch (err) {
      setError('Invalid input values. Please check your entries.');
    }
  };

  const addVariableRate = () => {
    setVariableRates([...variableRates, '']);
  };

  const removeVariableRate = (index: number) => {
    setVariableRates(variableRates.filter((_, i) => i !== index));
  };

  const updateVariableRate = (index: number, value: string) => {
    const newRates = [...variableRates];
    newRates[index] = value;
    setVariableRates(newRates);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Compound Interest Calculator</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Solve For</label>
            <select
              value={solveFor}
              onChange={(e) => setSolveFor(e.target.value as SolveFor)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="fv">Future Value (FV)</option>
              <option value="pv">Present Value (PV)</option>
              <option value="rate">Rate</option>
              <option value="periods">Periods</option>
              <option value="pmt">Payment (PMT)</option>
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={rateType === 'fixed'}
                    onChange={() => setRateType('fixed')}
                    className="mr-2"
                  />
                  Fixed
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={rateType === 'variable'}
                    onChange={() => setRateType('variable')}
                    className="mr-2"
                  />
                  Variable
                </label>
              </div>
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
            {solveFor !== 'pv' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Present Value (PV)</label>
                <ExpressionInput value={pvInput} onChange={setPvInput} placeholder="e.g., 1000" />
              </div>
            )}

            {solveFor !== 'fv' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Future Value (FV)</label>
                <ExpressionInput value={fvInput} onChange={setFvInput} placeholder="e.g., 2000" />
              </div>
            )}

            {solveFor !== 'rate' && rateType === 'fixed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rate (%)</label>
                <ExpressionInput value={rateInput} onChange={setRateInput} placeholder="e.g., 5" />
              </div>
            )}

            {solveFor !== 'periods' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Periods</label>
                <ExpressionInput value={periodsInput} onChange={setPeriodsInput} placeholder="e.g., 12" />
              </div>
            )}

            {solveFor !== 'pmt' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment (PMT)</label>
                <ExpressionInput value={pmtInput} onChange={setPmtInput} placeholder="e.g., 100" />
              </div>
            )}
          </div>

          {rateType === 'variable' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variable Rates (% per period)
              </label>
              <div className="space-y-2">
                {variableRates.map((rate, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <ExpressionInput
                        value={rate}
                        onChange={(value) => updateVariableRate(index, value)}
                        placeholder={`Period ${index + 1} rate`}
                      />
                    </div>
                    <button
                      onClick={() => removeVariableRate(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      disabled={variableRates.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addVariableRate}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Add Rate Period
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleCalculate}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium"
          >
            Calculate
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {result !== null && !error && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-gray-600 mb-1">Result:</p>
              <p className="text-2xl font-bold text-green-800">{result}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
