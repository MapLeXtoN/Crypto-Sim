// src/components/PositionManagement/SpotGrid.jsx
import React from 'react';
import { XCircle, Activity } from 'lucide-react';

const SpotGrid = ({ data, currentPrice, closePosition, calculatePnL, symbol }) => {
    const positions = data?.pos || [];

    return (
        <div>
            <div className="bg-[#1e2329] px-4 py-2 text-xs text-[#f0b90b] font-bold border-b border-[#2b3139] flex items-center gap-2">
                <Activity size={14}/> 運行中 - 現貨網格策略
            </div>
            <table className="w-full text-left text-xs text-[#eaecef]">
                <thead className="bg-[#2b3139] text-[#848e9c]">
                    <tr>
                        <th className="pl-4 py-2">策略類型</th>
                        <th>交易對</th>
                        <th>投入金額</th>
                        <th>網格利潤 (已實現)</th>
                        <th>浮動盈虧</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {positions.filter(p => p.mode === 'grid_spot').map(pos => {
                         const isCurrent = pos.symbol === symbol;
                         const floatPnl = isCurrent ? calculatePnL(pos, currentPrice) : 0;
                         
                         return (
                            <tr key={pos.id} className="border-b border-[#2b3139] hover:bg-[#2b3139]">
                                {/* 這裡只顯示「現貨網格」，乾淨俐落 */}
                                <td className="pl-4 py-2 text-[#f0b90b] font-bold">現貨網格</td>
                                <td>{pos.symbol}</td>
                                <td>{pos.amount.toFixed(2)} USDT</td>
                                <td className="text-[#089981] font-mono">+{(pos.realizedProfit || 0).toFixed(4)}</td>
                                <td className={floatPnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                                    {isCurrent && !isNaN(floatPnl) ? floatPnl.toFixed(2) : '-'}
                                </td>
                                <td>
                                    <button 
                                        onClick={() => closePosition(pos.id)} 
                                        className="flex items-center gap-1 bg-[#2b3139] border border-[#474d57] px-3 py-1 rounded text-[#F23645] hover:text-white hover:bg-[#F23645]"
                                    >
                                        <XCircle size={12}/> 停止
                                    </button>
                                </td>
                            </tr>
                         )
                    })}
                    {positions.filter(p => p.mode === 'grid_spot').length === 0 && (
                        <tr><td colSpan="6" className="text-center py-12 text-gray-500">無運行中的現貨網格策略</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SpotGrid;