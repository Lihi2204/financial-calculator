import { useState } from 'react';
import * as XLSX from 'xlsx';
import type { TabType, CalculationHistory, AMRTRow } from './types';
import { BasicCalculator } from './components/BasicCalculator';
import { CMPDCalculator } from './components/CMPDCalculator';
import { CASHCalculator } from './components/CASHCalculator';
import { AMRTCalculator } from './components/AMRTCalculator';
import { HistoryPanel } from './components/HistoryPanel';
import { formatNumber } from './lib/formatters';

const TABS: { id: TabType; label: string }[] = [
  { id: 'basic', label: 'Basic' },
  { id: 'cmpd', label: 'CMPD' },
  { id: 'cash', label: 'CASH' },
  { id: 'amrt', label: 'AMRT' },
];

interface CMPDData {
  solveFor: string;
  pv?: number;
  fv?: number;
  rate?: number;
  periods?: number;
  pmt?: number;
  paymentTiming: 'begin' | 'end';
  rateType: 'fixed' | 'variable';
  variableRates?: number[];
  result: string;
}

interface CASHData {
  discountRateType: 'fixed' | 'variable';
  discountRate?: number;
  variableDiscountRates?: number[];
  cashFlows: number[];
  npv: number;
  irr: number | null;
  pi: number | null;
}

interface AMRTData {
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
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [exportMode, setExportMode] = useState<'current' | 'all'>('current');

  // Store current state of each calculator
  const [cmpdData, setCMPDData] = useState<CMPDData | null>(null);
  const [cashData, setCASHData] = useState<CASHData | null>(null);
  const [amrtData, setAMRTData] = useState<AMRTData | null>(null);

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

    // Export Basic Tab
    const basicHistory = history.filter((h) => h.tabType === 'basic');
    if (basicHistory.length > 0) {
      const basicData = basicHistory.map((item) => ({
        Expression: item.description,
        Result: item.result,
      }));
      const worksheet = XLSX.utils.json_to_sheet(basicData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'BASIC');
    }

    // Export CMPD Tab
    if (cmpdData) {
      const cmpdSheet: any[] = [];
      cmpdSheet.push({ A: 'Input Parameters' });
      cmpdSheet.push({ A: 'Solve For', B: cmpdData.solveFor });
      if (cmpdData.pv !== undefined) cmpdSheet.push({ A: 'PV', B: cmpdData.pv });
      if (cmpdData.fv !== undefined) cmpdSheet.push({ A: 'FV', B: cmpdData.fv });
      if (cmpdData.rate !== undefined) cmpdSheet.push({ A: 'Rate (%)', B: cmpdData.rate });
      if (cmpdData.periods !== undefined) cmpdSheet.push({ A: 'Periods', B: cmpdData.periods });
      if (cmpdData.pmt !== undefined) cmpdSheet.push({ A: 'PMT', B: cmpdData.pmt });
      cmpdSheet.push({ A: 'Type', B: cmpdData.paymentTiming.toUpperCase() });
      cmpdSheet.push({ A: 'Rate Type', B: cmpdData.rateType === 'fixed' ? 'Fixed' : 'Variable' });

      if (cmpdData.rateType === 'variable' && cmpdData.variableRates && cmpdData.variableRates.length > 0) {
        cmpdSheet.push({});
        cmpdSheet.push({ A: 'Period', B: 'Rate (%)' });
        cmpdData.variableRates.forEach((rate, idx) => {
          cmpdSheet.push({ A: idx + 1, B: rate });
        });
      }

      cmpdSheet.push({});
      cmpdSheet.push({ A: 'Result', B: cmpdData.result });

      const worksheet = XLSX.utils.json_to_sheet(cmpdSheet, { skipHeader: true });
      XLSX.utils.book_append_sheet(workbook, worksheet, 'CMPD');
    }

    // Export CASH Tab
    if (cashData) {
      const cashSheet: any[] = [];
      cashSheet.push({ A: 'Discount Rate Type', B: cashData.discountRateType === 'fixed' ? 'Fixed' : 'Variable' });

      if (cashData.discountRateType === 'fixed' && cashData.discountRate !== undefined) {
        cashSheet.push({ A: 'Rate (%)', B: cashData.discountRate });
      } else if (cashData.discountRateType === 'variable' && cashData.variableDiscountRates) {
        cashSheet.push({});
        cashSheet.push({ A: 'Period', B: 'Discount Rate (%)' });
        cashData.variableDiscountRates.forEach((rate, idx) => {
          cashSheet.push({ A: idx + 1, B: rate });
        });
      }

      cashSheet.push({});
      cashSheet.push({ A: 'Period', B: 'Cash Flow' });
      cashData.cashFlows.forEach((cf, idx) => {
        cashSheet.push({ A: idx, B: cf });
      });

      cashSheet.push({});
      cashSheet.push({ A: 'Results' });
      cashSheet.push({ A: 'NPV', B: cashData.npv });
      if (cashData.irr !== null) cashSheet.push({ A: 'IRR (%)', B: cashData.irr });
      if (cashData.pi !== null) cashSheet.push({ A: 'PI', B: cashData.pi });

      const worksheet = XLSX.utils.json_to_sheet(cashSheet, { skipHeader: true });
      XLSX.utils.book_append_sheet(workbook, worksheet, 'CASH');
    }

    // Export AMRT Tab
    if (amrtData) {
      const amrtSheet: any[] = [];
      amrtSheet.push({ A: 'Input Parameters' });
      amrtSheet.push({ A: 'Principal', B: amrtData.principal });
      amrtSheet.push({ A: 'Rate (%)', B: amrtData.rate });
      amrtSheet.push({ A: 'Periods', B: amrtData.periods });
      amrtSheet.push({ A: 'Type', B: amrtData.paymentTiming.toUpperCase() });
      amrtSheet.push({ A: 'Schedule Type', B: amrtData.scheduleType });
      if (amrtData.gracePeriods !== undefined) {
        amrtSheet.push({ A: 'Grace Periods', B: amrtData.gracePeriods });
      }

      amrtSheet.push({});
      amrtSheet.push({
        A: 'תקופה',
        B: 'תשלום על חשבון הקרן',
        C: 'תשלום על חשבון הריבית',
        D: 'סה"כ לתשלום',
        E: 'יתרת קרן בלתי מסולקת'
      });

      amrtData.schedule.forEach((row) => {
        amrtSheet.push({
          A: row.period,
          B: row.principalPayment,
          C: row.interestPayment,
          D: row.totalPayment,
          E: row.remainingBalance,
        });
      });

      if (amrtData.summary) {
        amrtSheet.push({});
        amrtSheet.push({ A: 'Summary' });
        amrtSheet.push({ A: 'From Period', B: amrtData.summary.fromPeriod });
        amrtSheet.push({ A: 'To Period', B: amrtData.summary.toPeriod });
        amrtSheet.push({ A: 'Total Principal', B: amrtData.summary.totalPrincipal });
        amrtSheet.push({ A: 'Total Interest', B: amrtData.summary.totalInterest });
        amrtSheet.push({ A: 'Total Payment', B: amrtData.summary.totalPayment });
      }

      const worksheet = XLSX.utils.json_to_sheet(amrtSheet, { skipHeader: true });

      // Apply number formatting to numeric columns
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = worksheet[cellAddress];
          if (cell && typeof cell.v === 'number' && C > 0) {
            cell.z = '#,##0.00';
          }
        }
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'AMRT');
    }

    if (workbook.SheetNames.length === 0) {
      alert('No data to export. Please perform some calculations first.');
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    const fileName = `financial-calculator-${date}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">Financial Calculator</h1>

              <div className="flex gap-3 items-center">
                <button
                  onClick={exportToExcel}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span>Export to Excel</span>
                </button>

                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-5 py-2.5 bg-white text-blue-700 rounded-lg hover:bg-blue-50 font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {showHistory ? 'Hide History' : 'Show History'}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 font-semibold text-sm transition-all duration-200 relative ${
                    activeTab === tab.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-full"></div>
                  )}
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
              onDataChange={setCMPDData}
            />
          )}

          {activeTab === 'cash' && (
            <CASHCalculator
              onCalculate={(description, result, details) => addToHistory('cash', description, result, details)}
              onDataChange={setCASHData}
            />
          )}

          {activeTab === 'amrt' && (
            <AMRTCalculator
              onCalculate={(description, result, details) => addToHistory('amrt', description, result, details)}
              onDataChange={setAMRTData}
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
