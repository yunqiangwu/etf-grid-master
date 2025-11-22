import { BacktestResult, GridConfig, HistoryRecord } from '../types';

const STORAGE_KEY = 'etf_grid_history';

export const saveHistory = (config: GridConfig, result: BacktestResult): void => {
  try {
    const history = getHistory();
    
    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      config,
      summary: {
        totalReturn: result.totalReturn,
        totalReturnRate: result.totalReturnRate,
        tradeCount: result.trades.length
      }
    };

    // Prepend new record
    const updatedHistory = [newRecord, ...history].slice(0, 20); // Keep max 20 records
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const getHistory = (): HistoryRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const deleteHistoryItem = (id: string): HistoryRecord[] => {
  try {
    const history = getHistory();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};