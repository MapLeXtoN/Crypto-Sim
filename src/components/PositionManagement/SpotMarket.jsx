// src/components/PositionManagement/SpotMarket.jsx
import React from 'react';
import { XCircle } from 'lucide-react';

const SpotMarket = ({ subTab, data, currentPrice, closePosition, cancelOrder, symbol }) => {
    // 過濾出屬於現貨 (mode: 'spot') 的資料
    const positions = data?.pos?.filter(p => p.mode === 'spot') || [];
    const orders = data?.ord?.filter(o => o.mode === 'spot') || [];
    const history = data?.history?.filter(h => h.mode === 'spot') || [];

    // 當前持倉分頁
    if (subTab === 'positions') {
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#eaecef]">
                    <thead className="bg-[#2b3139] text-[#848e9c]">
                        <tr>
                            <th className="pl-4 py-2">交易對</th>
                            <th>方向</th>
                            <th>開倉價格</th>
                            <th>當前價格</th>
                            <th>開倉金額</th>
                            <th>開倉時間</th>
                            <th>未實現盈虧</th>
                            <th className="pr-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.map(pos => {
                            const isCurrent = pos.symbol === symbol;
                            const pnl = isCurrent ? (currentPrice - pos.entryPrice) * pos.size : 0;
                            const pnlPercentage = pos.amount > 0 ? (pnl / pos.amount) * 100 : 0;

                            return (
                                <tr key={pos.id} className="border-b border-[#2b3139] hover:bg-[#2b3139] transition-colors">
                                    <td className="pl-4 py-3 font-bold">{pos.symbol}</td>
                                    <td className={pos.side === 'long' ? 'text-[#089981]' : 'text-[#F23645]'}>
                                        {pos.side === 'long' ? '買入' : '賣出'}
                                    </td>
                                    <td className="font-mono">{pos.entryPrice.toFixed(2)}</td>
                                    <td className="font-mono">{isCurrent ? currentPrice.toFixed(2) : '-'}</td>
                                    <td className="font-mono">{pos.amount.toFixed(2)} USDT</td>
                                    <td className="text-[#848e9c]">{pos.time}</td>
                                    <td className={`font-mono ${pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                        {isCurrent ? (
                                            <>
                                                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} 
                                                <span className="ml-1 text-[10px]">({pnlPercentage.toFixed(2)}%)</span>
                                            </>
                                        ) : '-'}
                                    </td>
                                    <td className="pr-4 text-right">
                                        <button 
                                            onClick={() => closePosition(pos.id)}
                                            className="text-[#848e9c] hover:text-[#F23645] transition-colors"
                                            title="平倉"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {positions.length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center py-12 text-[#848e9c]">無運行中的持倉</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    }

    // 當前掛單分頁 (修改區塊)
    if (subTab === 'orders') {
        return (
            <table className="w-full text-left text-xs text-[#eaecef]">
                <thead className="bg-[#2b3139] text-[#848e9c]">
                    <tr>
                        <th className="pl-4 py-2">交易對</th>
                        <th>類型</th>
                        <th>方向</th>
                        {/* 1️⃣ 新增標頭 */}
                        <th>投資額</th>
                        <th>價格</th>
                        <th>數量</th>
                        <th>時間</th>
                        <th className="pr-4 text-right">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id} className="border-b border-[#2b3139] hover:bg-[#2b3139]">
                            <td className="pl-4 py-3 font-bold">{order.symbol}</td>
                            <td>{order.type === 'limit' ? '限價' : '市價'}</td>
                            <td className={order.side === 'long' ? 'text-[#089981]' : 'text-[#F23645]'}>
                                {order.side === 'long' ? '買入' : '賣出'}
                            </td>
                            {/* 2️⃣ 新增數據顯示 */}
                            <td className="font-mono">{order.amount.toFixed(2)} USDT</td>
                            <td className="font-mono">{order.price}</td>
                            <td className="font-mono">{order.size.toFixed(4)}</td>
                            <td className="text-[#848e9c]">{order.time}</td>
                            <td className="pr-4 text-right">
                                <button onClick={() => cancelOrder(order.id)} className="text-[#f0b90b] hover:underline">取消</button>
                            </td>
                        </tr>
                    ))}
                    {orders.length === 0 && (
                        <tr><td colSpan="8" className="text-center py-12 text-[#848e9c]">無掛單紀錄</td></tr>
                    )}
                </tbody>
            </table>
        );
    }

    // 歷史紀錄分頁
    if (subTab === 'history') {
        return (
            <table className="w-full text-left text-xs text-[#eaecef]">
                <thead className="bg-[#2b3139] text-[#848e9c]">
                    <tr>
                        <th className="pl-4 py-2">時間</th>
                        <th>交易對</th>
                        <th>方向</th>
                        <th>成交價格</th>
                        <th>數量</th>
                        <th>盈虧</th>
                        <th className="pr-4 text-right">狀態</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map(h => (
                        <tr key={h.id} className="border-b border-[#2b3139] hover:bg-[#2b3139]">
                            <td className="pl-4 py-3 text-[#848e9c]">{h.exitTime || h.time}</td>
                            <td className="font-bold">{h.symbol}</td>
                            <td className={h.side === 'long' ? 'text-[#089981]' : 'text-[#F23645]'}>
                                {h.side === 'long' ? '買入' : '賣出'}
                            </td>
                            <td className="font-mono">{h.entryPrice?.toFixed(2) || h.price}</td>
                            <td className="font-mono">{h.size?.toFixed(4)}</td>
                            <td className={`font-mono ${h.pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                {h.pnl ? `${h.pnl > 0 ? '+' : ''}${h.pnl.toFixed(2)}` : '0.00'}
                            </td>
                            <td className="pr-4 text-right text-[#848e9c]">已完成</td>
                        </tr>
                    ))}
                    {history.length === 0 && (
                        <tr><td colSpan="7" className="text-center py-12 text-[#848e9c]">無歷史紀錄</td></tr>
                    )}
                </tbody>
            </table>
        );
    }

    return null;
};

export default SpotMarket;