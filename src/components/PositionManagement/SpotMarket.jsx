// src/components/PositionManagement/SpotMarket.jsx
import React from 'react';
import { XCircle } from 'lucide-react';

const SpotMarket = ({ subTab, data, currentPrice, closePosition, cancelOrder, symbol }) => {
    // 過濾出屬於現貨 (mode: 'spot') 的資料
    const orders = data?.ord?.filter(o => o.mode === 'spot') || [];
    const history = data?.history?.filter(h => h.mode === 'spot') || [];

    // 1️⃣ 已移除：if (subTab === 'positions') 相關的所有持倉顯示邏輯

    // 當前掛單分頁
    if (subTab === 'orders') {
        return (
            <table className="w-full text-left text-xs text-[#eaecef]">
                <thead className="bg-[#2b3139] text-[#848e9c]">
                    <tr>
                        <th className="pl-4 py-2">交易對</th>
                        <th>類型</th>
                        <th>方向</th>
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