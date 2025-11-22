import React, { useState, useRef, useEffect } from 'react';
import GridForm from './components/GridForm';
import ResultsView from './components/ResultsView';
import HistoryView from './components/HistoryView';
import { BacktestResult, GridConfig } from './types';
import { fetchHistoricalData } from './services/api';
import { runBacktest } from './services/backtestEngine';
import { saveHistory } from './services/storage';

type ViewMode = 'MAIN' | 'HISTORY';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('MAIN');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [lastConfig, setLastConfig] = useState<GridConfig | null>(null);
  const [initialConfig, setInitialConfig] = useState<GridConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleRunBacktest = async (config: GridConfig) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch Data
      const data = await fetchHistoricalData(config.symbol, config.startDate, config.endDate);
      
      if (data.length === 0) {
        throw new Error("未找到该时间段的交易数据");
      }

      // 2. Run Logic
      const backtestResult = runBacktest(data, config);
      
      // 3. Save to history
      saveHistory(config, backtestResult);

      // 4. Update State
      setResult(backtestResult);
      setLastConfig(config);
      
      // Scroll to results after a brief delay to allow rendering
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadHistory = (config: GridConfig) => {
    setInitialConfig(config);
    setViewMode('MAIN');
    // When loading history, we reset the current result until they run it again
    // This avoids confusion between old results and new parameters
    setResult(null); 
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen shadow-2xl overflow-hidden relative">
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center animate-in fade-in slide-in-from-top-4">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-3 font-bold opacity-75 hover:opacity-100">✕</button>
        </div>
      )}

      {viewMode === 'MAIN' && (
        <>
            <GridForm 
                onRun={handleRunBacktest} 
                onHistory={() => setViewMode('HISTORY')}
                isLoading={isLoading} 
                initialConfig={initialConfig}
            />
            
            {result && lastConfig && (
                <div ref={resultsRef} className="border-t-4 border-gray-200">
                    <ResultsView 
                        result={result} 
                        config={lastConfig}
                        isEmbedded={true}
                    />
                </div>
            )}
        </>
      )}

      {viewMode === 'HISTORY' && (
        <HistoryView 
            onLoad={handleLoadHistory}
            onBack={() => setViewMode('MAIN')}
        />
      )}
    </div>
  );
};

export default App;