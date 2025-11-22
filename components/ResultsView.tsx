import React from 'react';
import { BacktestResult, GridConfig } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts';

interface Props {
  result: BacktestResult;
  config: GridConfig;
  onBack?: () => void;
  isEmbedded?: boolean;
}

const ResultsView: React.FC<Props> = ({ result, config, onBack, isEmbedded = false }) => {
  const { trades, history, totalReturn, totalReturnRate } = result;

  // Format history data for chart
  const chartData = history.map(point => {
    const trade = trades.find(t => t.date === point.date);
    return {
      ...point,
      buyPoint: trade?.type === 'BUY' ? trade.price : null,
      sellPoint: trade?.type === 'SELL' ? trade.price : null,
    };
  });

  return (
    <div className={`bg-gray-50 ${!isEmbedded ? 'min-h-screen pb-10 animate-in slide-in-from-right duration-300' : 'animate-in fade-in slide-in-from-bottom-4 duration-500'}`}>
      {/* Header (Only show if not embedded) */}
      {!isEmbedded && (
        <div className="bg-white sticky top-0 z-10 border-b border-gray-200 px-4 py-3 flex items-center space-x-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex flex-col">
              <span className="font-bold text-gray-800">{config.symbol} 回测报告</span>
              <span className="text-xs text-gray-500">{config.startDate} ~ {config.endDate}</span>
          </div>
        </div>
      )}
      
      {isEmbedded && (
        <div className="px-4 py-2 flex items-center justify-between">
            <h2 className="font-bold text-lg text-gray-800">回测结果</h2>
            <span className="text-xs text-gray-500">{config.symbol} ({config.startDate} ~ {config.endDate})</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="p-4 space-y-4 pt-2">
        <div className={`rounded-xl p-5 text-white shadow-lg ${totalReturn >= 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'}`}>
            <div className="text-sm opacity-90 mb-1">总收益 (元)</div>
            <div className="text-3xl font-bold mb-2">
                {totalReturn > 0 ? '+' : ''}{totalReturn.toFixed(2)}
            </div>
            <div className="flex justify-between items-end">
                <div>
                    <div className="text-xs opacity-80">收益率</div>
                    <div className="font-semibold">{totalReturnRate.toFixed(2)}%</div>
                </div>
                <div className="text-right">
                    <div className="text-xs opacity-80">交易次数</div>
                    <div className="font-semibold">{trades.length} 次</div>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm grid grid-cols-2 gap-4">
            <div>
                <div className="text-xs text-gray-500">最终持仓市值</div>
                <div className="font-semibold text-gray-800">{(result.finalStock * result.history[result.history.length-1].price).toFixed(2)}</div>
            </div>
            <div>
                <div className="text-xs text-gray-500">最终现金</div>
                <div className="font-semibold text-gray-800">{result.finalCash.toFixed(2)}</div>
            </div>
            <div>
                <div className="text-xs text-gray-500">持仓数量</div>
                <div className="font-semibold text-gray-800">{result.finalStock}</div>
            </div>
            <div>
                <div className="text-xs text-gray-500">总资产</div>
                <div className="font-semibold text-gray-800">{result.finalTotalAsset.toFixed(2)}</div>
            </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl p-4 shadow-sm h-96">
            <h3 className="font-bold text-gray-700 mb-4 text-sm border-l-4 border-blue-500 pl-2">价格走势与交易点</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 10}} 
                        minTickGap={30}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis 
                        domain={['auto', 'auto']} 
                        tick={{fontSize: 10}} 
                        width={40}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip 
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        labelStyle={{fontSize: '12px', color: '#666'}}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Brush 
                        dataKey="date" 
                        height={30} 
                        stroke="#8884d8" 
                        tickFormatter={(val) => val.slice(5)}
                        alwaysShowText={false}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        dot={false} 
                        name="收盘价"
                        isAnimationActive={false} 
                    />
                    <Line 
                        type="monotone" 
                        dataKey="buyPoint" 
                        stroke="none" 
                        isAnimationActive={false}
                        name="买入"
                        dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            if (!payload.buyPoint) return null;
                            return <circle cx={cx} cy={cy} r={4} fill="#22c55e" stroke="white" strokeWidth={1} />;
                        }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="sellPoint" 
                        stroke="none"
                        isAnimationActive={false}
                        name="卖出"
                        dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            if (!payload.sellPoint) return null;
                            return <circle cx={cx} cy={cy} r={4} fill="#ef4444" stroke="white" strokeWidth={1} />;
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>

        {/* Trade List */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-4 text-sm border-l-4 border-blue-500 pl-2">交易记录 ({trades.length})</h3>
            <div className="max-h-60 overflow-y-auto no-scrollbar">
                <table className="w-full text-sm">
                    <thead className="text-gray-500 text-xs bg-gray-50 sticky top-0">
                        <tr>
                            <th className="text-left py-2 px-2">日期</th>
                            <th className="text-center py-2 px-2">方向</th>
                            <th className="text-right py-2 px-2">价格</th>
                            <th className="text-right py-2 px-2">数量</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.slice().reverse().map((trade, idx) => (
                            <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="py-2 px-2 text-gray-600 text-xs whitespace-nowrap">{trade.date}</td>
                                <td className="py-2 px-2 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs ${trade.type === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {trade.type === 'BUY' ? '买入' : '卖出'}
                                    </span>
                                </td>
                                <td className="py-2 px-2 text-right font-mono text-gray-700">{trade.price.toFixed(3)}</td>
                                <td className="py-2 px-2 text-right text-gray-600">{trade.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {trades.length === 0 && (
                    <div className="text-center text-gray-400 py-4">无交易记录</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;