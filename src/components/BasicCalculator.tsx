import { useState } from 'react';
import { evaluate } from 'mathjs';
import { ExpressionInput } from './ExpressionInput';
import { formatNumber } from '../lib/formatters';

interface BasicCalculatorProps {
  onCalculate: (expression: string, result: number) => void;
}

export function BasicCalculator({ onCalculate }: BasicCalculatorProps) {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    if (expression.trim() === '') {
      setError('Please enter an expression');
      setResult(null);
      return;
    }

    try {
      const calculated = evaluate(expression);
      if (typeof calculated === 'number' && !isNaN(calculated)) {
        setResult(calculated);
        setError(null);
        onCalculate(expression, calculated);
      } else {
        setError('Invalid expression');
        setResult(null);
      }
    } catch (err) {
      setError('Invalid expression');
      setResult(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCalculate();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Basic Calculator</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expression</label>
            <ExpressionInput
              value={expression}
              onChange={setExpression}
              placeholder="e.g., 2 + 2, 10 * 5, sqrt(16)"
              className="text-lg"
            />
            <div onKeyPress={handleKeyPress} />
          </div>

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
              <p className="text-sm text-gray-600 mb-2 font-medium">Result:</p>
              <p className="text-3xl font-bold text-green-800">{formatNumber(result, 6)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
