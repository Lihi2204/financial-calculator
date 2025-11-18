import { useState } from 'react';
import * as XLSX from 'xlsx';
import type { TabType, CalculationHistory } from './types';
import { BasicCalculator } from './components/BasicCalculator';
import { CMPDCalculator } from './components/CMPDCalculator';
import { CASHCalculator } from './components/CASHCalculator';
import { AMRTCalculator } from './components/AMRTCalculator';
import { HistoryPanel } from './components/HistoryPanel';

const TABS: { id: TabType; label: string }[] = [
  { id: 'basic', label: 'Basic' },
  { id: 'cmpd', label: 'CMPD' },
  { id: 'cash', label: 'CASH' },
  { id: 'amrt', label: 'AMRT' },
];

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [exportMode, setExportMode] = useState<'current' | 'all'>('current');

  const addToHistory = (
    tabType: TabType,
    description: string,
    result: string,
    details?: Record<string, any>
  ) => {
    const newEntry: CalculationHistory = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      tabType,
      description,
      result,
      details,
    };

    setHistory((prev) => [...prev, newEntry]);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    if (exportMode === 'current') {
      // Export current tab only
      const tabHistory = history.filter((h) => h.tabType === activeTab);

      if (tabHistory.length === 0) {
        alert('No calculations to export for this tab');
        return;
      }

      const data = tabHistory.map((item) => ({
        Timestamp: new Date(item.timestamp).toLocaleString(),
        Description: item.description,
        Result: item.result,
        ...item.details,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.toUpperCase());
    } else {
      // Export all tabs
      if (history.length === 0) {
        alert('No calculations to export');
        return;
      }

      TABS.forEach((tab) => {
        const tabHistory = history.filter((h) => h.tabType === tab.id);

        if (tabHistory.length > 0) {
          const data = tabHistory.map((item) => ({
            Timestamp: new Date(item.timestamp).toLocaleString(),
            Description: item.description,
            Result: item.result,
            ...item.details,
          }));

          const worksheet = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, worksheet, tab.id.toUpperCase());
        }
      });
    }

    const date = new Date().toISOString().split('T')[0];
    const fileName = `financial-calculator-${exportMode === 'current' ? activeTab : 'all'}-${date}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Financial Calculator</h1>

              <div className="flex gap-4 items-center">
                <div className="flex gap-2 items-center">
                  <label className="text-sm text-gray-700">Export:</label>
                  <select
                    value={exportMode}
                    onChange={(e) => setExportMode(e.target.value as 'current' | 'all')}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="current">Current Tab</option>
                    <option value="all">All Tabs</option>
                  </select>
                  <button
                    onClick={exportToExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-sm"
                    disabled={history.length === 0}
                  >
                    Export to Excel
                  </button>
                </div>

                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
                >
                  {showHistory ? 'Hide History' : 'Show History'}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'basic' && (
            <BasicCalculator onCalculate={(expr, result) => addToHistory('basic', expr, result.toString())} />
          )}

          {activeTab === 'cmpd' && (
            <CMPDCalculator
              onCalculate={(description, result, details) => addToHistory('cmpd', description, result, details)}
            />
          )}

          {activeTab === 'cash' && (
            <CASHCalculator
              onCalculate={(description, result, details) => addToHistory('cash', description, result, details)}
            />
          )}

          {activeTab === 'amrt' && (
            <AMRTCalculator
              onCalculate={(description, result, details) => addToHistory('amrt', description, result, details)}
            />
          )}
        </main>
      </div>

      {/* History Panel */}
      {showHistory && (
        <HistoryPanel
          history={history}
          onClear={clearHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

export default App;
