// src/components/TradingPanel/SpotMarket.jsx
import React from 'react';
import { XCircle, Wallet, Clock, Coins } from 'lucide-react';

const SpotView = ({ subTab, data, currentPrice, cancelOrder, closePosition, symbol }) => {
    
    // 1. 現貨資產
    const renderAssetsTable = (positions) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
            <thead className="bg-[#2b3139] text-[#848e9c]"><tr><th className="pl-4 py-1.5">幣種</th><th>持有</th><th>價值</th><th>均價</th><th>盈虧</th><th>操作</th></tr></thead>
            <tbody>
                {positions.filter(p => p.mode === 'spot').map(pos => {
                    const isCurrent = pos.symbol === symbol;
                    const displayPrice = isCurrent ? currentPrice : pos.entryPrice;
                    const value = pos.size * displayPrice;
                    const pnl = (displayPrice - pos.entryPrice) * pos.size;
                    const pnlPercent = ((displayPrice - pos.entryPrice) / pos.entryPrice) * 100;
                    
                    return (
                        <tr key={pos.id} className={`border-b border-[#2b3139] hover:bg-[#2b3139] ${!isCurrent ? 'opacity-60' : ''}`}>
                            <td className="pl-4 py-2 font-bold flex items-center gap-2"><Wallet size={12} className="text-[#f0b90b]"/> {pos.symbol.replace('USDT', '')}</td>
                            <td>{pos.size.toFixed(4)}</td>
                            <td>{value.toFixed(2)} USDT</td>
                            <td>{pos.entryPrice.toFixed(2)}</td>
                            <td>{isCurrent ? <div className={pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>{pnl.toFixed(2)} <span className="text-[10px]">({pnlPercent.toFixed(2)}%)</span></div> : <div className="text-[#848e9c] text-[10px]">切換查看</div>}</td>
                            <td><button onClick={() => closePosition(pos.id)} className="bg-[#2b3139] border border-[#474d57] hover:bg-[#474d57] px-3 py-1 rounded text-[#F23645] hover:text-white">賣出</button></td>
                        </tr>
                    );
                })}
                {positions.filter(p => p.mode === 'spot').length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-600">無現貨資產</td></tr>}
            </tbody>
        </table>
    );

    // 2. 掛單 (🔥 修改重點：新增總額與時間欄位)
    const renderOrdersTable = (orders) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
             <thead className="bg-[#2b3139] text-[#848e9c]">
                <tr>
                    <th className="pl-4 py-1.5">交易對</th>
                    <th>方向</th>
                    <th>掛單價</th>
                    <th>數量</th>
                    <th>總額 (USDT)</th> {/* 新增 */}
                    <th>時間</th>       {/* 新增 */}
                    <th>操作</th>
                </tr>
             </thead>
             <tbody>
                {orders.filter(o => o.mode === 'spot').map(order => (
                    <tr key={order.id} className="border-b border-[#2b3139]">
                        <td className="pl-4 py-2 font-bold">{order.symbol}</td>
                        <td className={order.side==='long'?'text-[#089981]':'text-[#F23645]'}>
                            {order.side==='long'?'買入':'賣出'}
                        </td>
                        <td>{order.price}</td>
                        <td>{order.size.toFixed(4)}</td>
                        {/* 顯示總金額 */}
                        <td className="text-[#eaecef] font-mono">{order.amount.toFixed(2)}</td>
                        {/* 顯示時間 */}
                        <td className="text-[#848e9c] flex items-center gap-1">
                            <Clock size={10}/> {order.time}
                        </td>
                        <td>
                            <button onClick={() => cancelOrder(order.id)} className="text-[#848e9c] hover:text-white">
                                <XCircle size={12}/>
                            </button>
                        </td>
                    </tr>
                ))}
                {orders.filter(o => o.mode === 'spot').length === 0 && (
                    <tr><td colSpan="7" className="text-center py-8 text-gray-600">無現貨掛單</td></tr>
                )}
             </tbody>
        </table>
    );

    // 3. 歷史
    const renderHistoryTable = (history) => (
         <table className="w-full text-left text-xs text-[#eaecef]">
             <thead className="bg-[#2b3139] text-[#848e9c]"><tr><th className="pl-4 py-1.5">交易對</th><th>方向</th><th>成交均價</th><th>盈虧/狀態</th><th>時間</th></tr></thead>
             <tbody>{history.filter(h => h.mode === 'spot').map((item,i) => <tr key={i} className="border-b border-[#2b3139] opacity-70"><td className="pl-4 py-2">{item.symbol}</td><td className={item.side==='long'?'text-[#089981]':'text-[#F23645]'}>{item.side==='long'?'買入':'賣出'}</td><td>{item.entryPrice}</td><td className={item.pnl>=0?'text-[#089981]':'text-[#F23645]'}>{item.type === 'order_filled' ? '成交' : item.pnl?.toFixed(2)}</td><td>{item.exitTime}</td></tr>)}</tbody>
         </table>
    );

    return (
        <div>
            {subTab === 'positions' && renderAssetsTable(data?.pos || [])}
            {subTab === 'orders' && renderOrdersTable(data?.ord || [])}
            {subTab === 'history' && renderHistoryTable(data?.history || [])}
        </div>
    );
};

export default SpotView;