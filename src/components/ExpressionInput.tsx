import { useState, useEffect } from 'react';
import { evaluate } from 'mathjs';

interface ExpressionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ExpressionInput({ value, onChange, placeholder, className = '' }: ExpressionInputProps) {
  const [evaluatedValue, setEvaluatedValue] = useState<number | null>(null);

  useEffect(() => {
    if (value.trim() === '') {
      setEvaluatedValue(null);
      return;
    }

    try {
      const result = evaluate(value);
      if (typeof result === 'number' && !isNaN(result)) {
        setEvaluatedValue(result);
      } else {
        setEvaluatedValue(null);
      }
    } catch {
      setEvaluatedValue(null);
    }
  }, [value]);

  const showEvaluation = evaluatedValue !== null && value.trim() !== '' && value !== evaluatedValue.toString();

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      />
      {showEvaluation && (
        <div className="absolute left-3 -bottom-5 text-xs text-gray-500">
          {value} = {evaluatedValue}
        </div>
      )}
    </div>
  );
}
