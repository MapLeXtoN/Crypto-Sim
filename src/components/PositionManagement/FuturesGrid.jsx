// src/components/PositionManagement/FuturesGrid.jsx
import React from 'react';
import { XCircle, Activity, Settings2 } from 'lucide-react';

const FuturesGrid = ({ data, currentPrice, closePosition, calculatePnL, symbol, onGridSelect, onGridSettings, activeGridId }) => {
    const positions = data?.pos || [];

    return (
        <div>
            <div className="bg-[#1e2329] px-4 py-2 text-xs text-[#f0b90b] font-bold border-b border-[#2b3139] flex items-center gap-2">
                <Activity size={14}/> 運行中 - 合約網格策略
            </div>
            <table className="w-full text-left text-xs text-[#eaecef]">
                <thead className="bg-[#2b3139] text-[#848e9c]">
                    <tr>
                        <th className="pl-4 py-2">策略類型</th>
                        <th>交易對</th>
                        <th>槓桿</th>
                        <th>投入金額</th>
                        <th>網格利潤</th>
                        <th>趨勢盈虧</th>
                        <th>操作</th>
                        <th className="pr-4 text-right">調整</th>
                    </tr>
                </thead>
                <tbody>
                    {positions.filter(p => p.mode === 'grid_futures').map(pos => {
                         const isCurrent = pos.symbol === symbol;
                         const floatingPnl = isCurrent ? calculatePnL(pos, currentPrice) : 0;
                         const isActive = activeGridId === pos.id;

                         let dirColor = 'text-[#848e9c]';
                         let dirText = '中性';
                         if (pos.gridDirection === 'long') { dirColor = 'text-[#089981]'; dirText = '做多'; }
                         if (pos.gridDirection === 'short') { dirColor = 'text-[#F23645]'; dirText = '做空'; }

                         return (
                            <tr 
                                key={pos.id} 
                                onClick={() => onGridSelect && onGridSelect(pos.id)}
                                className={`border-b border-[#2b3139] cursor-pointer transition-colors ${isActive ? 'bg-[#2b3139] border-l-2 border-l-[#f0b90b]' : 'hover:bg-[#2b3139]'}`}
                            >
                                <td className="pl-4 py-2 font-bold">
                                    <span className="text-[#f0b90b]">合約網格</span>
                                    <span className={`ml-2 text-[10px] bg-[#2b3139] border border-[#474d57] px-1 rounded ${dirColor}`}>{dirText}</span>
                                </td>
                                <td>{pos.symbol}</td>
                                <td className="text-[#f0b90b] font-bold">{pos.leverage}x</td>
                                <td>{pos.amount.toFixed(2)} USDT</td>
                                <td className="text-[#089981] font-mono">
                                    +{(pos.realizedProfit || 0).toFixed(4)}
                                </td>
                                <td className={`font-mono ${floatingPnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                    {isCurrent ? (floatingPnl >= 0 ? '+' : '') + floatingPnl.toFixed(2) : '-'}
                                </td>
                                <td>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closePosition(pos.id);
                                        }} 
                                        className="flex items-center gap-1 bg-[#2b3139] border border-[#474d57] px-3 py-1 rounded text-[#F23645] hover:text-white hover:bg-[#F23645]"
                                    >
                                        <XCircle size={12}/> 停止
                                    </button>
                                </td>
                                <td className="pr-4 text-right">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // [修正] 調用專門的設置回調
                                            if (onGridSettings) onGridSettings(pos.id);
                                        }}
                                        className="text-[#848e9c] hover:text-[#f0b90b] transition-colors"
                                    >
                                        <Settings2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                         )
                    })}
                    {positions.filter(p => p.mode === 'grid_futures').length === 0 && (
                        <tr><td colSpan="8" className="text-center py-12 text-gray-500">無運行中的合約網格策略</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default FuturesGrid;