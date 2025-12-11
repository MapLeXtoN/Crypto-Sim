import React from 'react';
import { XCircle, Info, Wallet } from 'lucide-react';

const SpotView = ({ subTab, data, currentPrice, cancelOrder, closePosition, calculatePnL }) => {
    
    // 1. 現貨資產表格 (原本缺少的)
    const renderAssetsTable = (positions) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
            <thead className="bg-[#2b3139] text-[#848e9c]">
                <tr>
                    <th className="pl-4 py-1.5">幣種 (Coin)</th>
                    <th>持有數量 (Amount)</th>
                    <th>當前價值 (Value)</th>
                    <th>買入均價 (Avg Buy)</th>
                    <th>盈虧 (PnL)</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                {positions.filter(p => p.mode === 'spot').map(pos => {
                    const value = pos.size * currentPrice;
                    const pnl = (currentPrice - pos.entryPrice) * pos.size;
                    const pnlPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
                    
                    return (
                        <tr key={pos.id} className="border-b border-[#2b3139] hover:bg-[#2b3139]">
                            <td className="pl-4 py-2 font-bold flex items-center gap-2">
                                <Wallet size={12} className="text-[#f0b90b]"/> {pos.symbol.replace('USDT', '')}
                            </td>
                            <td>{pos.size.toFixed(4)}</td>
                            <td>{value.toFixed(2)} USDT</td>
                            <td>{pos.entryPrice.toFixed(2)}</td>
                            <td>
                                <div className={pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                                    {pnl.toFixed(2)} <span className="text-[10px] opacity-80">({pnlPercent.toFixed(2)}%)</span>
                                </div>
                            </td>
                            <td>
                                <button onClick={() => closePosition(pos.id)} className="bg-[#2b3139] border border-[#474d57] hover:bg-[#474d57] px-3 py-1 rounded text-[#F23645] hover:text-white transition-colors">
                                    賣出 (Sell)
                                </button>
                            </td>
                        </tr>
                    );
                })}
                {positions.filter(p => p.mode === 'spot').length === 0 && (
                    <tr><td colSpan="6" className="text-center py-8 text-gray-600">無持有現貨資產 (No Assets)</td></tr>
                )}
            </tbody>
        </table>
    );

    // 2. 現貨掛單表格
    const renderOrdersTable = (orders) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
            <thead className="bg-[#2b3139] text-[#848e9c]">
                <tr>
                    <th className="pl-4 py-1.5">交易對</th>
                    <th>方向</th>
                    <th>掛單價格</th>
                    <th>數量</th>
                    <th>總金額</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                {orders.filter(o => o.mode === 'spot').map(order => (
                    <tr key={order.id} className="border-b border-[#2b3139] hover:bg-[#2b3139]">
                        <td className="pl-4 py-2 font-bold">{order.symbol}</td>
                        <td className={order.side === 'long' ? 'text-[#089981]' : 'text-[#F23645]'}>
                            {order.side === 'long' ? '買入 (Buy)' : '賣出 (Sell)'}
                        </td>
                        <td>{order.price.toFixed(2)}</td>
                        <td>{order.size.toFixed(4)}</td>
                        <td>{(order.price * order.size).toFixed(2)} USDT</td>
                        <td>
                            <button onClick={() => cancelOrder(order.id)} className="flex items-center gap-1 text-[#848e9c] hover:text-[#eaecef] bg-[#2b3139] px-2 py-1 rounded">
                                <XCircle size={12} /> 取消
                            </button>
                        </td>
                    </tr>
                ))}
                {orders.filter(o => o.mode === 'spot').length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-600">無現貨掛單</td></tr>}
            </tbody>
        </table>
    );

    // 3. 現貨歷史紀錄
    const renderHistoryTable = (history) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
            <thead className="bg-[#2b3139] text-[#848e9c]">
                <tr>
                    <th className="pl-4 py-1.5">交易對</th>
                    <th>方向</th>
                    <th>成交均價</th>
                    <th>成交數量</th>
                    <th>已實現盈虧</th>
                    <th>時間</th>
                </tr>
            </thead>
            <tbody>
                {history.filter(h => h.mode === 'spot').map((item, idx) => (
                    <tr key={idx} className="border-b border-[#2b3139] hover:bg-[#2b3139] opacity-70">
                        <td className="pl-4 py-2 font-bold">{item.symbol}</td>
                        <td className={item.side === 'long' ? 'text-[#089981]' : 'text-[#F23645]'}>
                            {item.side === 'long' ? '買入' : '賣出'}
                        </td>
                        <td>{item.entryPrice ? item.entryPrice.toFixed(2) : '-'}</td>
                        <td>{item.size ? item.size.toFixed(4) : '-'}</td>
                        <td className={item.pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                            {item.pnl ? item.pnl.toFixed(2) : '-'}
                        </td>
                        <td>{item.exitTime}</td>
                    </tr>
                ))}
                {history.filter(h => h.mode === 'spot').length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-600">無歷史紀錄</td></tr>}
            </tbody>
        </table>
    );

    // 4. 機器人狀態 (如果有的話)
    const renderBotTable = (positions) => (
        <div>
            <div className="bg-[#1e2329] px-4 py-1 text-xs text-[#f0b90b] font-bold border-b border-[#2b3139]">運行中機器人</div>
            <table className="w-full text-left text-xs text-[#eaecef]">
                <thead className="bg-[#2b3139] text-[#848e9c]"><tr><th className="pl-4 py-1.5">策略名稱</th><th>幣種</th><th>投入金額</th><th>利潤</th><th>操作</th></tr></thead>
                <tbody>
                    {positions.filter(p => p.mode === 'grid').map(pos => {
                         const profit = calculatePnL(pos, currentPrice);
                         return (
                            <tr key={pos.id} className="border-b border-[#2b3139] hover:bg-[#2b3139]">
                                <td className="pl-4 py-2 text-[#f0b90b]">現貨網格</td>
                                <td>{pos.symbol}</td>
                                <td>{pos.amount.toFixed(2)} USDT</td>
                                <td className={profit >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>{profit.toFixed(2)}</td>
                                <td><button onClick={() => closePosition(pos.id)} className="flex items-center gap-1 bg-[#2b3139] border border-[#474d57] px-2 py-1 rounded"><XCircle size={10}/> 停止</button></td>
                            </tr>
                         )
                    })}
                    {positions.filter(p => p.mode === 'grid').length === 0 && <tr><td colSpan="5" className="text-center py-4 text-gray-600">無運行中機器人</td></tr>}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>
            {subTab === 'positions' && renderAssetsTable(data?.pos || [])}
            {subTab === 'orders' && renderOrdersTable(data?.ord || [])}
            {subTab === 'history' && renderHistoryTable(data?.history || [])}
            {subTab === 'bot' && renderBotTable(data?.pos || [])}
        </div>
    );
};

export default SpotView;