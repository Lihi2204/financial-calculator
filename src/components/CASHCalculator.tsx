import { useState } from 'react';
import { evaluate } from 'mathjs';
import { ExpressionInput } from './ExpressionInput';
import { calculateNPV, calculateNPVVariable, calculateIRR, calculatePI } from '../lib/financial';
import { solveDCFCashFlow } from '../lib/solver';
import { formatNumber } from '../lib/formatters';

interface CASHCalculatorProps {
  onCalculate: (description: string, result: string, details?: Record<string, any>) => void;
  onDataChange?: (data: {
    discountRateType: 'fixed' | 'variable';
    discountRate?: number;
    variableDiscountRates?: number[];
    cashFlows: number[];
    npv: number;
    irr: number | null;
    pi: number | null;
  }) => void;
}

export function CASHCalculator({ onCalculate, onDataChange }: CASHCalculatorProps) {
  const [discountRateInput, setDiscountRateInput] = useState('10');
  const [discountRateType, setDiscountRateType] = useState<'fixed' | 'variable'>('fixed');
  const [variableDiscountRates, setVariableDiscountRates] = useState<string[]>(['']);
  const [cashFlows, setCashFlows] = useState<string[]>(['-1000', '300', '400', '500']);
  const [solverEnabled, setSolverEnabled] = useState(false);
  const [solverPeriod, setSolverPeriod] = useState(1);
  const [targetNPVInput, setTargetNPVInput] = useState('0');
  const [result, setResult] = useState<{ npv: number; irr: number | null; pi: number | null } | null>(null);
  const [solverResult, setSolverResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    try {
      setError(null);
      setResult(null);
      setSolverResult(null);

      const cashFlowValues = cashFlows.map((cf) => (cf.trim() === '' ? 0 : evaluate(cf)));

      if (cashFlowValues.length === 0) {
        setError('Please enter at least one cash flow');
        return;
      }

      let npv: number;
      let irr: number | null = null;
      let pi: number | null = null;

      if (discountRateType === 'variable') {
        const rates = variableDiscountRates
          .filter((r) => r.trim() !== '')
          .map((r) => evaluate(r));

        if (rates.length === 0) {
          setError('Please enter at least one discount rate');
          return;
        }

        if (rates.length !== cashFlowValues.length - 1) {
          setError(
            `Number of discount rates (${rates.length}) must equal number of periods (${cashFlowValues.length - 1})`
          );
          return;
        }

        npv = calculateNPVVariable(cashFlowValues, rates);
      } else {
        const discountRate = evaluate(discountRateInput);
        npv = calculateNPV(cashFlowValues, discountRate);
        pi = calculatePI(cashFlowValues, discountRate);
      }

      irr = calculateIRR(cashFlowValues);

      setResult({ npv, irr, pi });

      // Store data for Excel export
      if (onDataChange) {
        if (discountRateType === 'variable') {
          const rates = variableDiscountRates
            .filter((r) => r.trim() !== '')
            .map((r) => evaluate(r));
          onDataChange({
            discountRateType: 'variable',
            variableDiscountRates: rates,
            cashFlows: cashFlowValues,
            npv,
            irr,
            pi,
          });
        } else {
          const discountRate = evaluate(discountRateInput);
          onDataChange({
            discountRateType: 'fixed',
            discountRate,
            cashFlows: cashFlowValues,
            npv,
            irr,
            pi,
          });
        }
      }

      const details: Record<string, any> = {
        NPV: npv.toFixed(2),
        'Cash Flows': cashFlowValues.join(', '),
      };

      if (irr !== null) {
        details.IRR = `${irr.toFixed(4)}%`;
      }

      if (pi !== null) {
        details.PI = pi.toFixed(4);
      }

      if (discountRateType === 'fixed') {
        details['Discount Rate'] = `${evaluate(discountRateInput)}%`;
      } else {
        details['Discount Type'] = 'Variable';
      }

      onCalculate('CASH: Cash Flow Analysis', `NPV = ${npv.toFixed(2)}`, details);
    } catch (err) {
      setError('Invalid input values. Please check your entries.');
    }
  };

  const handleSolve = () => {
    try {
      setError(null);
      setSolverResult(null);

      const targetNPV = evaluate(targetNPVInput);
      const cashFlowValues = cashFlows.map((cf) => (cf.trim() === '' ? 0 : evaluate(cf)));

      if (solverPeriod < 0 || solverPeriod >= cashFlowValues.length) {
        setError('Invalid solver period');
        return;
      }

      let discountRate = 0;
      let variableRates: number[] = [];

      if (discountRateType === 'variable') {
        variableRates = variableDiscountRates
          .filter((r) => r.trim() !== '')
          .map((r) => evaluate(r));

        if (variableRates.length !== cashFlowValues.length - 1) {
          setError(
            `Number of discount rates (${variableRates.length}) must equal number of periods (${
              cashFlowValues.length - 1
            })`
          );
          return;
        }
      } else {
        discountRate = evaluate(discountRateInput);
      }

      const x = solveDCFCashFlow(
        cashFlowValues,
        solverPeriod,
        targetNPV,
        discountRate,
        discountRateType,
        variableRates
      );

      if (x === null) {
        setError('Could not find a solution');
        return;
      }

      setSolverResult(x);

      onCalculate(
        `CASH: Solve for Cash Flow at Period ${solverPeriod}`,
        `X = ${x.toFixed(2)}`,
        {
          'Target NPV': targetNPV.toFixed(2),
          'Solver Period': solverPeriod,
          'Discount Rate': discountRateType === 'fixed' ? `${discountRate}%` : 'Variable',
        }
      );
    } catch (err) {
      setError('Invalid input values. Please check your entries.');
    }
  };

  const addCashFlow = () => {
    if (cashFlows.length < 30) {
      setCashFlows([...cashFlows, '']);
    }
  };

  const removeCashFlow = (index: number) => {
    setCashFlows(cashFlows.filter((_, i) => i !== index));
  };

  const updateCashFlow = (index: number, value: string) => {
    const newCashFlows = [...cashFlows];
    newCashFlows[index] = value;
    setCashFlows(newCashFlows);
  };

  const addVariableDiscountRate = () => {
    setVariableDiscountRates([...variableDiscountRates, '']);
  };

  const removeVariableDiscountRate = (index: number) => {
    setVariableDiscountRates(variableDiscountRates.filter((_, i) => i !== index));
  };

  const updateVariableDiscountRate = (index: number, value: string) => {
    const newRates = [...variableDiscountRates];
    newRates[index] = value;
    setVariableDiscountRates(newRates);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Cash Flow Analysis</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Rate Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={discountRateType === 'fixed'}
                  onChange={() => setDiscountRateType('fixed')}
                  className="mr-2"
                />
                Fixed
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={discountRateType === 'variable'}
                  onChange={() => setDiscountRateType('variable')}
                  className="mr-2"
                />
                Variable
              </label>
            </div>
          </div>

          {discountRateType === 'fixed' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount Rate (%)</label>
              <ExpressionInput
                value={discountRateInput}
                onChange={setDiscountRateInput}
                placeholder="e.g., 10"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variable Discount Rates (% per period)
              </label>
              <div className="space-y-2">
                {variableDiscountRates.map((rate, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <ExpressionInput
                        value={rate}
                        onChange={(value) => updateVariableDiscountRate(index, value)}
                        placeholder={`Period ${index + 1} discount rate`}
                      />
                    </div>
                    <button
                      onClick={() => removeVariableDiscountRate(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      disabled={variableDiscountRates.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addVariableDiscountRate}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Add Discount Rate Period
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cash Flows</label>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cashFlows.map((cf, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-sm text-gray-600 w-16">Period {index}:</span>
                  <div className="flex-1">
                    <ExpressionInput
                      value={cf}
                      onChange={(value) => updateCashFlow(index, value)}
                      placeholder={index === 0 ? 'Initial investment (negative)' : `Cash flow ${index}`}
                    />
                  </div>
                  <button
                    onClick={() => removeCashFlow(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    disabled={cashFlows.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addCashFlow}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              disabled={cashFlows.length >= 30}
            >
              Add Cash Flow
            </button>
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={solverEnabled}
                onChange={(e) => setSolverEnabled(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Enable Solver Mode</span>
            </label>
          </div>

          {solverEnabled && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Solve for Period (X)
                </label>
                <select
                  value={solverPeriod}
                  onChange={(e) => setSolverPeriod(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {cashFlows.map((_, index) => (
                    <option key={index} value={index}>
                      Period {index}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target NPV</label>
                <ExpressionInput
                  value={targetNPVInput}
                  onChange={setTargetNPVInput}
                  placeholder="e.g., 0"
                />
              </div>

              <div className="col-span-2">
                <button
                  onClick={handleSolve}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Solve for Cash Flow
                </button>
              </div>

              {solverResult !== null && (
                <div className="col-span-2 p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border-l-4 border-purple-500 rounded-lg shadow-md">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Cash Flow at Period {solverPeriod}:</p>
                  <p className="text-3xl font-bold text-purple-800">{formatNumber(solverResult)}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleCalculate}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            Calculate
          </button>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md shadow-sm">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {result !== null && !error && (
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-md">
              <p className="text-sm text-gray-600 mb-3 font-medium">Results:</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">NPV:</span>
                  <span className="text-2xl font-bold text-green-800">{formatNumber(result.npv)}</span>
                </div>
                {result.irr !== null && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">IRR:</span>
                    <span className="text-2xl font-bold text-blue-800">{formatNumber(result.irr, 4)}%</span>
                  </div>
                )}
                {result.pi !== null && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">PI:</span>
                    <span className="text-2xl font-bold text-purple-800">{formatNumber(result.pi, 4)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
