import type { CalculationHistory, TabType } from '../types';

interface HistoryPanelProps {
  history: CalculationHistory[];
  onClear: () => void;
  onClose: () => void;
}

const TAB_COLORS: Record<TabType, string> = {
  basic: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300',
  cmpd: 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border border-green-300',
  cash: 'bg-gradient-to-r from-purple-100 to-indigo-200 text-purple-800 border border-purple-300',
  amrt: 'bg-gradient-to-r from-orange-100 to-amber-200 text-orange-800 border border-orange-300',
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
    <div className="w-80 bg-white border-l-2 border-gray-300 flex flex-col h-full shadow-xl">
      <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-300 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">History</h2>
        <div className="flex gap-2">
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-medium shadow-sm hover:shadow-md transition-all duration-200"
            disabled={history.length === 0}
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 font-medium shadow-sm hover:shadow-md transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        {displayHistory.length === 0 ? (
          <div className="text-center text-gray-500 mt-8 font-medium">No calculations yet</div>
        ) : (
          displayHistory.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm ${TAB_COLORS[item.tabType]}`}>
                  {TAB_LABELS[item.tabType]}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-sm text-gray-700 mb-1 font-medium">{item.description}</div>
              <div className="text-sm font-bold text-gray-900">{item.result}</div>
              {item.details && Object.keys(item.details).length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                  {Object.entries(item.details).map(([key, value]) => (
                    <div key={key} className="py-0.5">
                      <span className="font-semibold text-gray-700">{key}:</span> {String(value)}
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
