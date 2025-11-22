export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export enum GridType {
  PERCENTAGE = 'PERCENTAGE',
  PRICE_DIFF = 'PRICE_DIFF'
}

export interface GridConfig {
  symbol: string;
  initialBasePrice: number;
  gridType: GridType;
  
  // Percentage mode (e.g., 0.05 for 5%)
  riseSellPercent: number;
  fallBuyPercent: number;
  
  // Amount per trade
  buyAmount: number; // Number of shares
  sellAmount: number; // Number of shares
  
  // Initial Holdings
  initialCash: number;
  initialStock: number;

  // Date Range
  startDate: string;
  endDate: string;
}

export interface TradeRecord {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  fee: number;
  total: number; // Total cash impact
}

export interface BacktestResult {
  trades: TradeRecord[];
  finalCash: number;
  finalStock: number;
  finalTotalAsset: number;
  initialTotalAsset: number;
  totalReturn: number; // Percentage
  totalReturnRate: number;
  history: {
    date: string;
    price: number;
    asset: number;
  }[];
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  config: GridConfig;
  summary: {
    totalReturn: number;
    totalReturnRate: number;
    tradeCount: number;
  };
}