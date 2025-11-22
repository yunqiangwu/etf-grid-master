import { GridConfig, HistoricalDataPoint, BacktestResult, TradeRecord, GridType } from '../types';

export const runBacktest = (
  data: HistoricalDataPoint[],
  config: GridConfig
): BacktestResult => {
  let cash = config.initialCash;
  let stock = config.initialStock;
  const trades: TradeRecord[] = [];
  const history = [];

  // The "grid anchor" price. Moves dynamically in some grid strategies, 
  // but for a standard "Static Grid" (often used in simpler tools), it might stay fixed or reset after a trade.
  // Based on the screenshot "Initial Base Price", we will use a simple dynamic grid:
  // After a buy, the next sell target is based on that buy price. 
  // After a sell, the next buy target is based on that sell price.
  // HOWEVER, standard mesh trading often keeps a "Last Transacted Price" or "Baseline".
  
  let lastTransactionPrice = config.initialBasePrice;
  
  // To prevent multiple trades on the same day in this simple daily-sim,
  // we will check if Low triggers Buy or High triggers Sell.
  // Priority: If Open > Last, we check Sell first. If Open < Last, check Buy first.

  const feeRate = 0.0002; // Assumed simplified commission fee (e.g. 0.02%)

  for (const day of data) {
    let dailyTrades = 0;
    let currentPrice = day.open; // Start simulation at open
    
    // Simple heuristic to simulate intra-day movement: Open -> Low -> High -> Close
    // or Open -> High -> Low -> Close depending on candle shape.
    // We will try to match "limit orders".
    
    // Calculate targets based on Last Transaction Price
    let buyTarget = 0;
    let sellTarget = 0;

    if (config.gridType === GridType.PERCENTAGE) {
        buyTarget = lastTransactionPrice * (1 + config.fallBuyPercent / 100);
        sellTarget = lastTransactionPrice * (1 + config.riseSellPercent / 100);
    } else {
        // Price Difference Logic (not fully implemented in UI default, but supported here)
        // Assuming user inputs absolute values for rise/fall if we were to support this mode fully
        buyTarget = lastTransactionPrice - Math.abs(config.fallBuyPercent); 
        sellTarget = lastTransactionPrice + Math.abs(config.riseSellPercent);
    }

    // Check Low for BUY
    // We can buy if the day's LOW dropped below our target
    if (cash > 0 && day.low <= buyTarget) {
        // Execute Buy
        // In a real scenario, we'd buy AT the target price, not the day.low (unless gap down)
        // If Open was already lower than target, we buy at Open (gap down). Otherwise at target.
        const executionPrice = day.open < buyTarget ? day.open : buyTarget;
        
        const cost = executionPrice * config.buyAmount;
        if (cash >= cost) {
            const fee = cost * feeRate;
            cash -= (cost + fee);
            stock += config.buyAmount;
            trades.push({
                date: day.date,
                type: 'BUY',
                price: executionPrice,
                amount: config.buyAmount,
                fee,
                total: -(cost + fee)
            });
            lastTransactionPrice = executionPrice;
            dailyTrades++;
            
            // If we bought, we might be able to sell intraday if the High is high enough relative to THIS new price?
            // For simplicity in Daily data, we usually stop or allow one pair.
            // Let's re-calculate sell target based on new price for potential same-day swing (unlikely but possible).
             if (config.gridType === GridType.PERCENTAGE) {
                sellTarget = lastTransactionPrice * (1 + config.riseSellPercent / 100);
            }
        }
    }

    // Check High for SELL
    // We can sell if the day's HIGH went above our target
    // Note: If we just bought, lastTransactionPrice changed. 
    if (stock >= config.sellAmount && day.high >= sellTarget) {
         const executionPrice = day.open > sellTarget ? day.open : sellTarget;
         
         const revenue = executionPrice * config.sellAmount;
         const fee = revenue * feeRate;
         cash += (revenue - fee);
         stock -= config.sellAmount;
         trades.push({
             date: day.date,
             type: 'SELL',
             price: executionPrice,
             amount: config.sellAmount,
             fee,
             total: (revenue - fee)
         });
         lastTransactionPrice = executionPrice;
         dailyTrades++;
    }

    // Record History
    const totalAsset = cash + (stock * day.close);
    history.push({
        date: day.date,
        price: day.close,
        asset: totalAsset
    });
  }

  const initialTotalAsset = config.initialCash + (config.initialStock * config.initialBasePrice);
  const finalTotalAsset = cash + (stock * data[data.length - 1].close);
  const totalReturn = finalTotalAsset - initialTotalAsset;
  const totalReturnRate = (totalReturn / initialTotalAsset) * 100;

  return {
    trades,
    finalCash: cash,
    finalStock: stock,
    finalTotalAsset,
    initialTotalAsset,
    totalReturn,
    totalReturnRate,
    history
  };
};