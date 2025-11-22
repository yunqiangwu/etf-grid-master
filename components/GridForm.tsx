import React, { useState, useEffect, useRef } from 'react';
import { GridConfig, GridType } from '../types';
import { fetchStockInfo } from '../services/api';

interface Props {
  onRun: (config: GridConfig) => void;
  onHistory: () => void;
  isLoading: boolean;
  initialConfig?: GridConfig | null;
}

const GridForm: React.FC<Props> = ({ onRun, onHistory, isLoading, initialConfig }) => {
  // Default values matching the visual style approximately
  const [symbol, setSymbol] = useState('513010');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [basePrice, setBasePrice] = useState('0.800');
  
  // Grid settings
  const [risePercent, setRisePercent] = useState('5.0'); // Default 5%
  const [fallPercent, setFallPercent] = useState('5.0'); // Default 5%
  const [buyCount, setBuyCount] = useState('1000');
  const [sellCount, setSellCount] = useState('1000');
  
  // Assets
  const [initialCash, setInitialCash] = useState('100000');
  const [initialStock, setInitialStock] = useState('0');
  
  // Dates
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Track the symbol loaded from history to prevent auto-overwriting
  const lastLoadedSymbol = useRef<string | null>(null);

  // Load configuration if provided (e.g. from History)
  useEffect(() => {
    if (initialConfig) {
        setSymbol(initialConfig.symbol);
        setBasePrice(initialConfig.initialBasePrice.toFixed(3));
        setRisePercent(initialConfig.riseSellPercent.toString());
        setFallPercent(Math.abs(initialConfig.fallBuyPercent).toString());
        setBuyCount(initialConfig.buyAmount.toString());
        setSellCount(initialConfig.sellAmount.toString());
        setInitialCash(initialConfig.initialCash.toString());
        setInitialStock(initialConfig.initialStock.toString());
        setStartDate(initialConfig.startDate);
        setEndDate(initialConfig.endDate);
        
        // Lock this symbol so we don't auto-regenerate params immediately
        lastLoadedSymbol.current = initialConfig.symbol;
    }
  }, [initialConfig]);

  useEffect(() => {
    // Debounce fetch for real-time price
    const timer = setTimeout(async () => {
        if(symbol.length >= 6) {
            setIsFetchingPrice(true);
            const info = await fetchStockInfo(symbol);
            setIsFetchingPrice(false);
            
            if(info) {
                setCurrentPrice(info.price);

                // If this symbol matches the one we just loaded from history, do not auto-generate params
                if (lastLoadedSymbol.current === symbol) {
                    return;
                }

                // --- Auto Generate Suitable Parameters ---
                const price = info.price;
                setBasePrice(price.toFixed(3));

                // 1. Calculate suitable share count
                // Strategy: Divide capital into ~20 grids (5% per grid)
                // This is a conservative default for a grid strategy
                const capital = parseFloat(initialCash) || 100000;
                const targetGridValue = capital / 20; 
                let suggestedShares = Math.floor(targetGridValue / price / 100) * 100;
                if (suggestedShares < 100) suggestedShares = 100; // Minimum 1 lot

                setBuyCount(suggestedShares.toString());
                setSellCount(suggestedShares.toString());

                // 2. Set default percentages to 3% (common for ETF grids)
                setRisePercent('3.0');
                setFallPercent('3.0');
            }
        }
    }, 800);
    return () => clearTimeout(timer);
  }, [symbol]); // Intentionally excluding initialCash to avoid resetting params when cash changes

  const handleSubmit = () => {
    onRun({
      symbol,
      initialBasePrice: parseFloat(basePrice),
      gridType: GridType.PERCENTAGE,
      riseSellPercent: parseFloat(risePercent),
      fallBuyPercent: -Math.abs(parseFloat(fallPercent)), // Ensure negative internally
      buyAmount: parseInt(buyCount),
      sellAmount: parseInt(sellCount),
      initialCash: parseFloat(initialCash),
      initialStock: parseInt(initialStock),
      startDate,
      endDate
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-blue-600 text-white p-6 pt-8 rounded-b-[2rem] shadow-lg mb-6 relative">
        <div className="flex justify-between items-start mb-4">
            <h1 className="text-xl font-bold">网格交易条件单</h1>
            <div className="flex space-x-2">
                <button 
                    onClick={onHistory}
                    className="text-xs bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-full transition-colors flex items-center"
                >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    历史记录
                </button>
                <div className="opacity-80 text-sm border border-white/30 rounded-full px-2 cursor-help">?</div>
            </div>
        </div>
        <div className="flex flex-col items-center justify-center py-2">
            <div className="text-3xl font-bold tracking-wider mb-2 flex items-center justify-center w-full">
                <input 
                    type="text" 
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.trim())}
                    className="bg-blue-700/30 border-b-2 border-blue-400 text-center w-40 outline-none focus:border-white focus:bg-blue-700/50 transition-all rounded px-2 text-white placeholder-blue-200"
                    placeholder="输入代码"
                />
                <span className="text-sm font-normal opacity-80 ml-2 shrink-0">ETF</span>
            </div>
            <div className="h-8 flex items-center justify-center">
                {isFetchingPrice ? (
                     <div className="animate-pulse text-xs bg-blue-800/40 px-3 py-1 rounded-full border border-blue-500/30">
                        获取价格中...
                     </div>
                ) : currentPrice && (
                    <div className="text-sm opacity-90 bg-blue-800/40 px-3 py-1 rounded-full border border-blue-500/30">
                        最新价: <span className="font-mono font-bold">{currentPrice}</span>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        
        {/* Settings Card 1: Basics */}
        <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-brand-600 font-bold border-l-4 border-brand-600 pl-2 mb-4 text-sm">触发条件</h2>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">初始基准价</span>
                <div className="flex items-center space-x-2">
                    <button className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition" onClick={() => setBasePrice((parseFloat(basePrice) - 0.001).toFixed(3))}>-</button>
                    <input 
                        type="number" 
                        className="w-20 text-center font-bold text-gray-800 bg-transparent outline-none"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        step="0.001"
                    />
                    <button className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition" onClick={() => setBasePrice((parseFloat(basePrice) + 0.001).toFixed(3))}>+</button>
                </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">涨跌类型</span>
                <div className="flex space-x-4 text-sm">
                    <label className="flex items-center space-x-1 text-brand-600 font-medium">
                        <input type="radio" checked readOnly className="accent-brand-600"/>
                        <span>按百分比</span>
                    </label>
                    <label className="flex items-center space-x-1 text-gray-400 cursor-not-allowed">
                        <input type="radio" disabled className="accent-gray-400"/>
                        <span>按差价</span>
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">每上涨...卖出</span>
                <div className="flex items-center space-x-2">
                    <input 
                        type="number" 
                        className="w-16 text-right font-bold text-red-500 bg-transparent outline-none border-b border-gray-200 focus:border-brand-500"
                        value={risePercent}
                        onChange={(e) => setRisePercent(e.target.value)}
                    />
                    <span className="text-gray-400 font-medium">%</span>
                </div>
            </div>

            <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">每下跌...买入</span>
                <div className="flex items-center space-x-2">
                    <input 
                        type="number" 
                        className="w-16 text-right font-bold text-green-500 bg-transparent outline-none border-b border-gray-200 focus:border-brand-500"
                        value={fallPercent}
                        onChange={(e) => setFallPercent(e.target.value)}
                    />
                    <span className="text-gray-400 font-medium">%</span>
                </div>
            </div>
        </div>

        {/* Settings Card 2: Order Amount */}
        <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-brand-600 font-bold border-l-4 border-brand-600 pl-2 mb-4 text-sm">委托设置</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center text-gray-500 text-xs">买入数量 (股)</div>
                <div className="text-center text-gray-500 text-xs">卖出数量 (股)</div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                 <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <button className="text-gray-400 text-xl hover:text-gray-600" onClick={() => setBuyCount(String(Math.max(100, parseInt(buyCount) - 100)))}>-</button>
                    <input 
                        type="number" 
                        className="w-full text-center text-gray-800 font-bold outline-none" 
                        value={buyCount}
                        onChange={e => setBuyCount(e.target.value)}
                    />
                    <button className="text-gray-400 text-xl hover:text-gray-600" onClick={() => setBuyCount(String(parseInt(buyCount) + 100))}>+</button>
                 </div>
                 <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <button className="text-gray-400 text-xl hover:text-gray-600" onClick={() => setSellCount(String(Math.max(100, parseInt(sellCount) - 100)))}>-</button>
                    <input 
                        type="number" 
                        className="w-full text-center text-gray-800 font-bold outline-none" 
                        value={sellCount}
                        onChange={e => setSellCount(e.target.value)}
                    />
                    <button className="text-gray-400 text-xl hover:text-gray-600" onClick={() => setSellCount(String(parseInt(sellCount) + 100))}>+</button>
                 </div>
            </div>
        </div>

         {/* Settings Card 3: Assets & Time */}
         <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-brand-600 font-bold border-l-4 border-brand-600 pl-2 mb-4 text-sm">回测资金与时间</h2>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">初始资金 (元)</span>
                    <input 
                        type="number"
                        className="bg-gray-50 rounded px-3 py-2 text-right text-gray-700 w-32 focus:ring-1 ring-brand-500 outline-none"
                        value={initialCash}
                        onChange={e => setInitialCash(e.target.value)}
                    />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">初始持仓 (股)</span>
                    <input 
                        type="number"
                        className="bg-gray-50 rounded px-3 py-2 text-right text-gray-700 w-32 focus:ring-1 ring-brand-500 outline-none"
                        value={initialStock}
                        onChange={e => setInitialStock(e.target.value)}
                    />
                </div>

                <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 text-sm">开始日期</span>
                        <input 
                            type="date"
                            className="text-sm bg-gray-50 rounded px-2 py-1 text-gray-700 outline-none border border-transparent focus:border-brand-200"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">结束日期</span>
                        <input 
                            type="date"
                            className="text-sm bg-gray-50 rounded px-2 py-1 text-gray-700 outline-none border border-transparent focus:border-brand-200"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="flex space-x-2 pt-2">
                    {['1年', '3年', '今年'].map(label => (
                        <button 
                            key={label}
                            type="button"
                            onClick={() => {
                                const end = new Date();
                                const start = new Date();
                                if (label === '1年') start.setFullYear(end.getFullYear() - 1);
                                if (label === '3年') start.setFullYear(end.getFullYear() - 3);
                                if (label === '今年') start.setMonth(0, 1);
                                
                                setEndDate(end.toISOString().split('T')[0]);
                                setStartDate(start.toISOString().split('T')[0]);
                            }}
                            className="flex-1 py-2 text-xs bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 rounded transition-colors"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Submit Button Area */}
        <div className="py-4 pb-8">
             <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-full py-3 rounded-full text-white font-bold text-lg shadow-md transition-all active:scale-95 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'}`}
            >
                {isLoading ? '回测计算中...' : '开始回测'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default GridForm;