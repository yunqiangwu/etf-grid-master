import React, { useEffect, useState } from 'react';
import { GridConfig, HistoryRecord } from '../types';
import { getHistory, deleteHistoryItem } from '../services/storage';

interface Props {
  onLoad: (config: GridConfig) => void;
  onBack: () => void;
}

const HistoryView: React.FC<Props> = ({ onLoad, onBack }) => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setRecords(getHistory());
  }, []);

  const onRequestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      const updated = deleteHistoryItem(deletingId);
      setRecords(updated);
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 animate-in slide-in-from-right duration-300 relative">
      <div className="bg-white sticky top-0 z-10 border-b border-gray-200 px-4 py-3 flex items-center space-x-3 shadow-sm">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="font-bold text-gray-800">回测历史记录</span>
      </div>

      <div className="p-4 space-y-4">
        {records.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>暂无回测记录</p>
          </div>
        ) : (
          records.map(record => (
            <div 
                key={record.id} 
                onClick={() => onLoad(record.config)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer relative group"
            >
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <span className="text-lg font-bold text-gray-800 mr-2">{record.config.symbol}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">ETF</span>
                    </div>
                    <div className="text-xs text-gray-400">
                        {new Date(record.timestamp).toLocaleString('zh-CN', {month:'numeric', day:'numeric', hour:'numeric', minute:'numeric'})}
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                    <div>
                        <div className="text-xs text-gray-500">总收益率</div>
                        <div className={`font-bold ${record.summary.totalReturnRate >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {record.summary.totalReturnRate > 0 ? '+' : ''}{record.summary.totalReturnRate.toFixed(2)}%
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">交易次数</div>
                        <div className="font-medium text-gray-700">{record.summary.tradeCount}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">总收益</div>
                        <div className={`font-medium ${record.summary.totalReturn >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                             {record.summary.totalReturn > 0 ? '+' : ''}{Math.round(record.summary.totalReturn)}
                        </div>
                    </div>
                </div>

                <div className="text-xs text-gray-400 flex justify-between items-center pt-2 border-t border-gray-50">
                    <span>{record.config.startDate} ~ {record.config.endDate}</span>
                    <button 
                        type="button"
                        onClick={(e) => onRequestDelete(record.id, e)}
                        className="text-gray-300 hover:text-red-500 p-2 -m-2 transition-colors z-10"
                    >
                        删除
                    </button>
                </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">确认删除</h3>
            <p className="text-gray-600 mb-6">
              确定要删除这条回测记录吗？删除后无法恢复。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-md shadow-red-500/30"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;