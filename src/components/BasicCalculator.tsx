import { useState } from 'react';
import { evaluate } from 'mathjs';
import { ExpressionInput } from './ExpressionInput';

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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Basic Calculator</h2>

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
