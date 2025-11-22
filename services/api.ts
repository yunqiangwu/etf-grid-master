import { HistoricalDataPoint } from '../types';

const API_BASE = 'https://aks.txy.jajabjbj.top';

export const fetchHistoricalData = async (
  symbol: string,
  startDate: string,
  endDate: string
): Promise<HistoricalDataPoint[]> => {
  try {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      interval: 'day',
      adjust: 'qfq', // Forward adjusted price is best for backtesting
      source: 'eastmoney_direct'
    });

    const response = await fetch(`${API_BASE}/historical-data/${symbol}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format received from API');
    }

    // Transform API response to our internal type
    return data.map((item: any) => {
      // Robust date handling
      let rawDate = item.date ?? item.timestamp;
      let dateStr = '';

      if (rawDate === undefined || rawDate === null) {
        return null;
      }

      // Handle numeric timestamp (ms) or string
      if (typeof rawDate === 'number') {
        // Check if it's seconds (10 digits) or milliseconds (13 digits)
        // Assuming API returns standard timestamps, usually ms or iso string.
        // If it's a small number (seconds), multiply by 1000
        if (rawDate < 10000000000) { 
             rawDate *= 1000;
        }
        dateStr = new Date(rawDate).toISOString().split('T')[0];
      } else {
         dateStr = String(rawDate);
         if (dateStr.includes('T')) {
           dateStr = dateStr.split('T')[0];
         }
      }

      return {
        date: dateStr,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
        volume: Number(item.volume)
      };
    }).filter((item): item is HistoricalDataPoint => item !== null);

  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const fetchStockInfo = async (symbol: string) => {
  try {
    const response = await fetch(`${API_BASE}/realtime-data?symbol=${symbol}&source=eastmoney_direct`);
    if(!response.ok) return null;
    const data = await response.json();
    return data[0] || null; 
  } catch (e) {
    console.warn("Failed to fetch realtime info", e);
    return null;
  }
};