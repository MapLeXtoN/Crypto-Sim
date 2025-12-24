// src/components/TradingPanel/FuturesTrading.jsx
import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const FuturesView = ({ subTab, data, currentPrice, cancelOrder, closePosition, calculatePnL, symbol }) => {
    const [confirmingId, setConfirmingId] = useState(null); 

    const safeNum = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };

    const renderPositionsTable = (positions) => (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#eaecef] min-w-[700px]">
                <thead className="bg-[#2b3139] text-[#848e9c]">
                    <tr>
                        <th className="pl-4 py-2">合約</th>
                        {/* 🔥 [新增] 方向標題 */}
                        <th>方向</th>
                        <th>投資額</th>
                        <th>開倉價格 (Open Price)</th>
                        <th>盈虧</th>
                        <th>交易所/費率</th>
                        <th>已扣開倉費</th>
                        <th className="pr-4 text-right">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {positions.filter(p => p.mode === 'futures').map(pos => {
                        const isCurrent = pos.symbol === symbol;
                        const pnl = isCurrent ? (calculatePnL(pos, currentPrice) || 0) : 0;
                        
                        return (
                            <tr key={pos.id} className={`border-b border-[#2b3139] ${!isCurrent ? 'opacity-50' : ''}`}>
                                <td className="pl-4 py-2 font-bold">
                                    {pos.symbol} 
                                    <span className="text-[#848e9c] ml-1">{safeNum(pos.leverage).toFixed(1)}x</span>
                                </td>
                                {/* 🔥 [新增] 顯示做多/做空 */}
                                <td className={`font-bold ${pos.side === 'long' ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                    {pos.side === 'long' ? '做多' : '做空'}
                                </td>
                                <td className="font-mono">{safeNum(pos.amount).toFixed(2)}</td>
                                <td className="font-mono text-[#f0b90b]">{safeNum(pos.entryPrice).toFixed(2)}</td>
                                <td className={pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>{pnl.toFixed(2)}</td>
                                <td className="text-[#848e9c]">{pos.exchange || 'Binance'} ({safeNum(pos.feeRate || 0.05)}%)</td>
                                <td className="text-[#848e9c]">{safeNum(pos.entryFee).toFixed(2)} USDT</td>
                                <td className="pr-4 text-right">
                                    <button onClick={() => closePosition(pos.id)} className="text-[#F23645] text-[10px] border border-[#474d57] px-2 py-1 rounded bg-[#2b3139] hover:bg-[#cf2d3a] hover:text-white transition-all">平倉</button>
                                </td>
                            </tr>
                        );
                    })}
                    {positions.filter(p => p.mode === 'futures').length === 0 && (
                        <tr><td colSpan="8" className="text-center py-8 text-gray-500">無合約持倉</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderOrdersTable = (orders) => (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#eaecef] min-w-[600px]">
                <thead className="bg-[#2b3139] text-[#848e9c]">
                    <tr>
                        <th className="pl-4 py-2">幣種</th>
                        {/* 🔥 [新增] 方向標題 */}
                        <th>方向</th>
                        <th>掛單價格 (Order Price)</th>
                        <th>預扣手續費</th>
                        <th>交易所/費率</th>
                        <th className="pr-4 text-right">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.filter(o => o.mode === 'futures').map(order => (
                        <tr key={order.id} className="border-b border-[#2b3139]">
                            <td className="pl-4 py-2 font-bold">{order.symbol}</td>
                            {/* 🔥 [新增] 顯示做多/做空 */}
                            <td className={`font-bold ${order.side === 'long' ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                {order.side === 'long' ? '做多' : '做空'}
                            </td>
                            <td className="font-mono text-[#f0b90b]">{safeNum(order.price).toFixed(2)}</td>
                            <td className="text-[#848e9c]">{safeNum(order.entryFee).toFixed(2)} USDT</td>
                            <td className="text-[#848e9c]">{order.exchange} ({order.feeRate}%)</td>
                            <td className="pr-4 py-2 text-right">
                                <button onClick={() => setConfirmingId(order.id)} className="text-[#F23645] text-[10px] border border-[#474d57] px-2 py-1 rounded bg-[#2b3139] transition-colors">取消</button>
                            </td>
                        </tr>
                    ))}
                    {orders.filter(o => o.mode === 'futures').length === 0 && (
                        <tr><td colSpan="6" className="text-center py-8 text-gray-500">無合約掛單</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderHistoryTable = (history) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
            <thead className="bg-[#2b3139] text-[#848e9c]"><tr><th className="pl-4 py-1.5">合約</th><th>盈虧(扣除來回費)</th><th>交易所/費率</th><th>時間</th></tr></thead>
            <tbody>{history.filter(h => h.mode === 'futures').map((item, i) => <tr key={i} className="border-b border-[#2b3139] opacity-60"><td className="pl-4 py-2">{item.symbol}</td><td className={item.pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>{safeNum(item.pnl).toFixed(2)} USDT</td><td className="text-[#848e9c]">{item.exchange} ({item.feeRate}%)</td><td>{item.exitTime}</td></tr>)}</tbody>
        </table>
    );

    return (
        <div className="relative h-full">
            {subTab === 'positions' && renderPositionsTable(data?.pos || [])}
            {subTab === 'orders' && renderOrdersTable(data?.ord || [])}
            {subTab === 'history' && renderHistoryTable(data?.history || [])}
            {confirmingId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1e2329] border border-[#2b3139] rounded-lg p-6 w-80 shadow-2xl">
                        <div className="flex items-center gap-2 text-[#f0b90b] mb-4"><AlertTriangle size={20}/><span className="font-bold">撤銷掛單</span></div>
                        <p className="text-[#848e9c] text-sm mb-6">確定撤銷此合約掛單？</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmingId(null)} className="flex-1 py-2 bg-[#2b3139] rounded text-sm text-[#eaecef]">取消</button>
                            <button onClick={() => { cancelOrder(confirmingId); setConfirmingId(null); }} className="flex-1 py-2 bg-[#F23645] rounded text-sm font-bold text-white">確認撤銷</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FuturesView;