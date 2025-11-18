import type { CalculationHistory, TabType } from '../types';

interface HistoryPanelProps {
  history: CalculationHistory[];
  onClear: () => void;
  onClose: () => void;
}

const TAB_COLORS: Record<TabType, string> = {
  basic: 'bg-blue-100 text-blue-800',
  cmpd: 'bg-green-100 text-green-800',
  cash: 'bg-purple-100 text-purple-800',
  amrt: 'bg-orange-100 text-orange-800',
};

const TAB_LABELS: Record<TabType, string> = {
  basic: 'Basic',
  cmpd: 'CMPD',
  cash: 'CASH',
  amrt: 'AMRT',
};

export function HistoryPanel({ history, onClear, onClose }: HistoryPanelProps) {
  const displayHistory = history.slice(-50).reverse();

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold">History</h2>
        <div className="flex gap-2">
          <button
            onClick={onClear}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            disabled={history.length === 0}
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {displayHistory.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">No calculations yet</div>
        ) : (
          displayHistory.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${TAB_COLORS[item.tabType]}`}>
                  {TAB_LABELS[item.tabType]}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-sm text-gray-700 mb-1">{item.description}</div>
              <div className="text-sm font-semibold text-gray-900">{item.result}</div>
              {item.details && Object.keys(item.details).length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  {Object.entries(item.details).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
