import React from 'react';
import { XCircle } from 'lucide-react';

const FuturesView = ({ subTab, data, currentPrice, cancelOrder, closePosition, calculatePnL }) => {

    // 1. 合約倉位表格 (包含槓桿、強平、保證金)
    const renderPositionsTable = (positions) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
            <thead className="bg-[#2b3139] text-[#848e9c]">
                <tr>
                    <th className="pl-4 py-1.5">合約 (Symbol)</th>
                    <th>方向 (Side)</th>
                    <th>持倉量 (Size)</th>
                    <th>開倉價格 (Entry)</th>
                    <th>標記價格 (Mark)</th>
                    <th>強平價格 (Liq)</th>
                    <th>保證金 (Margin)</th>
                    <th>未實現盈虧 (PnL)</th>
                    <th>操作 (Action)</th>
                </tr>
            </thead>
            <tbody>
                {positions.filter(p => p.mode === 'futures').map(pos => {
                    const pnl = calculatePnL(pos, currentPrice);
                    const roe = (pnl / pos.margin) * 100;
                    // 簡單的強平價格估算
                    const liqPrice = pos.side === 'long' 
                        ? pos.entryPrice * (1 - 1/pos.leverage) 
                        : pos.entryPrice * (1 + 1/pos.leverage);

                    return (
                        <tr key={pos.id} className="border-b border-[#2b3139] hover:bg-[#2b3139]">
                            <td className="pl-4 py-2 font-bold flex items-center gap-1">
                                {pos.symbol}
                                <span className="bg-[#474d57] text-[#eaecef] px-1 rounded text-[10px]">{pos.leverage}x</span>
                            </td>
                            <td className={`font-bold ${pos.side === 'long' ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                {pos.side === 'long' ? '做多 (Long)' : '做空 (Short)'}
                            </td>
                            <td>{pos.size.toFixed(4)}</td>
                            <td>{pos.entryPrice.toFixed(2)}</td>
                            <td>{currentPrice.toFixed(2)}</td>
                            <td className="text-[#f0b90b]">{liqPrice > 0 ? liqPrice.toFixed(2) : '-'}</td>
                            <td>{pos.margin.toFixed(2)}</td>
                            <td>
                                <div className={pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                                    {pnl.toFixed(2)} <span className="text-[10px] opacity-80">({roe.toFixed(2)}%)</span>
                                </div>
                            </td>
                            <td className="flex gap-1 py-2">
                                <button onClick={() => closePosition(pos.id)} className="bg-[#2b3139] border border-[#474d57] hover:bg-[#474d57] px-2 py-1 rounded text-[#eaecef]">
                                    市價全平
                                </button>
                            </td>
                        </tr>
                    );
                })}
                {positions.filter(p => p.mode === 'futures').length === 0 && (
                    <tr><td colSpan="9" className="text-center py-8 text-gray-600 italic">無合約持倉 (No Positions)</td></tr>
                )}
            </tbody>
        </table>
    );

    // 2. 合約掛單表格
    const renderOrdersTable = (orders) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
            <thead className="bg-[#2b3139] text-[#848e9c]">
                <tr>
                    <th className="pl-4 py-1.5">合約</th>
                    <th>類型</th>
                    <th>方向</th>
                    <th>數量</th>
                    <th>掛單價</th>
                    <th>狀態</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                {orders.filter(o => o.mode === 'futures').map(order => (
                    <tr key={order.id} className="border-b border-[#2b3139] hover:bg-[#2b3139] opacity-80">
                        <td className="pl-4 py-2 font-bold">{order.symbol}</td>
                        <td className="text-[#f0b90b]">{order.leverage}x 限價</td>
                        <td className={order.side === 'long' ? 'text-[#089981]' : 'text-[#F23645]'}>
                            {order.side === 'long' ? '做多' : '做空'}
                        </td>
                        <td>{order.size.toFixed(4)}</td>
                        <td>{order.price.toFixed(2)}</td>
                        <td className="text-[#848e9c]">掛單中</td>
                        <td>
                            <button onClick={() => cancelOrder(order.id)} className="flex items-center gap-1 bg-[#2b3139] border border-[#474d57] hover:bg-[#474d57] px-2 py-1 rounded text-[#eaecef]">
                                <XCircle size={10} /> 取消
                            </button>
                        </td>
                    </tr>
                ))}
                {orders.filter(o => o.mode === 'futures').length === 0 && <tr><td colSpan="7" className="text-center py-8 text-gray-600">無合約掛單</td></tr>}
            </tbody>
        </table>
    );

    // 3. 合約歷史表格
    const renderHistoryTable = (history) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
            <thead className="bg-[#2b3139] text-[#848e9c]">
                <tr>
                    <th className="pl-4 py-1.5">合約</th>
                    <th>方向</th>
                    <th>開倉價</th>
                    <th>平倉價</th>
                    <th>盈虧 (PnL)</th>
                    <th>平倉時間</th>
                </tr>
            </thead>
            <tbody>
                {history.filter(h => h.mode === 'futures').map((item, idx) => (
                    <tr key={idx} className="border-b border-[#2b3139] hover:bg-[#2b3139] opacity-60">
                        <td className="pl-4 py-2 font-bold">{item.symbol}</td>
                        <td className={item.side === 'long' ? 'text-[#089981]' : 'text-[#F23645]'}>
                            {item.side === 'long' ? '做多' : '做空'}
                        </td>
                        <td>{item.entryPrice ? item.entryPrice.toFixed(2) : '-'}</td>
                        <td>{item.closePrice ? item.closePrice.toFixed(2) : '-'}</td>
                        <td className={item.pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                            {item.pnl ? item.pnl.toFixed(2) : item.status}
                        </td>
                        <td>{item.exitTime}</td>
                    </tr>
                ))}
                {history.filter(h => h.mode === 'futures').length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-600">無合約歷史紀錄</td></tr>}
            </tbody>
        </table>
    );

    return (
        <div>
            {subTab === 'positions' && renderPositionsTable(data?.pos || [])}
            {subTab === 'orders' && renderOrdersTable(data?.ord || [])}
            {subTab === 'history' && renderHistoryTable(data?.history || [])}
            {subTab === 'bot' && (
                <div className="p-4 text-center text-gray-500">合約網格功能開發中...</div>
            )}
        </div>
    );
};

export default FuturesView;