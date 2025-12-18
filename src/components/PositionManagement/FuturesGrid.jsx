// src/components/TradingPanel/FuturesGrid.jsx
import React from 'react';
import { XCircle, Activity } from 'lucide-react';

const FuturesGrid = ({ data, currentPrice, closePosition, calculatePnL, symbol }) => {
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
                        <th>槓桿倍數</th>
                        <th>投入金額</th>
                        <th>當前利潤</th>
                        <th>狀態</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {positions.filter(p => p.mode === 'grid_futures').map(pos => {
                         const isCurrent = pos.symbol === symbol;
                         const profit = isCurrent ? calculatePnL(pos, currentPrice) : 0;
                         return (
                            <tr key={pos.id} className="border-b border-[#2b3139] hover:bg-[#2b3139]">
                                <td className="pl-4 py-2 text-[#f0b90b] font-bold">合約網格</td>
                                <td>{pos.symbol}</td>
                                <td className="text-[#f0b90b] font-bold">{pos.leverage}x</td>
                                <td>{pos.amount.toFixed(2)} USDT</td>
                                <td className={profit >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                                    {isCurrent ? profit.toFixed(2) : '-'}
                                </td>
                                <td className="text-[#089981]">運行中</td>
                                <td>
                                    <button 
                                        onClick={() => closePosition(pos.id)} 
                                        className="flex items-center gap-1 bg-[#2b3139] border border-[#474d57] px-3 py-1.5 rounded text-[#F23645] hover:text-white hover:bg-[#F23645]"
                                    >
                                        <XCircle size={12}/> 停止策略
                                    </button>
                                </td>
                            </tr>
                         )
                    })}
                    {positions.filter(p => p.mode === 'grid_futures').length === 0 && (
                        <tr><td colSpan="7" className="text-center py-12 text-gray-500">無運行中的合約網格策略</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default FuturesGrid;