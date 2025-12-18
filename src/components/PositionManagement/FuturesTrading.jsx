// src/components/TradingPanel/FuturesTrading.jsx
import React from 'react';
import { XCircle } from 'lucide-react';

const FuturesView = ({ subTab, data, currentPrice, cancelOrder, closePosition, calculatePnL, symbol }) => {

    // 1. 合約倉位
    const renderPositionsTable = (positions) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
             <thead className="bg-[#2b3139] text-[#848e9c]"><tr><th className="pl-4 py-1.5">合約</th><th>方向</th><th>持倉</th><th>開倉</th><th>標價</th><th>強平</th><th>保證金</th><th>盈虧</th><th>操作</th></tr></thead>
             <tbody>
                {positions.filter(p => p.mode === 'futures').map(pos => {
                    const isCurrent = pos.symbol === symbol;
                    const pnl = isCurrent ? calculatePnL(pos, currentPrice) : 0;
                    const roe = (pnl/pos.margin)*100;
                    return (
                        <tr key={pos.id} className={`border-b border-[#2b3139] ${!isCurrent?'opacity-50':''}`}>
                            <td className="pl-4 py-2 font-bold">{pos.symbol} <span className="bg-[#474d57] px-1 rounded text-[10px]">{pos.leverage}x</span></td>
                            <td className={pos.side==='long'?'text-[#089981]':'text-[#F23645]'}>{pos.side==='long'?'多':'空'}</td>
                            <td>{pos.size.toFixed(4)}</td><td>{pos.entryPrice.toFixed(2)}</td><td>{isCurrent?currentPrice.toFixed(2):'-'}</td><td className="text-[#f0b90b]">-</td><td>{pos.margin.toFixed(2)}</td>
                            <td className={pnl>=0?'text-[#089981]':'text-[#F23645]'}>{isCurrent ? `${pnl.toFixed(2)} (${roe.toFixed(2)}%)` : '切換查看'}</td>
                            <td><button onClick={()=>closePosition(pos.id)} className="bg-[#2b3139] border border-[#474d57] px-2 py-1 rounded text-[#eaecef]">平倉</button></td>
                        </tr>
                    )
                })}
                {positions.filter(p => p.mode === 'futures').length === 0 && <tr><td colSpan="9" className="text-center py-8 text-gray-600">無合約持倉</td></tr>}
             </tbody>
        </table>
    );

    // 2. 掛單
    const renderOrdersTable = (orders) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
             <thead className="bg-[#2b3139] text-[#848e9c]"><tr><th className="pl-4 py-1.5">合約</th><th>類型</th><th>方向</th><th>數量</th><th>操作</th></tr></thead>
             <tbody>{orders.filter(o => o.mode === 'futures').map(order => <tr key={order.id} className="border-b border-[#2b3139]"><td className="pl-4 py-2">{order.symbol}</td><td className="text-[#f0b90b]">{order.leverage}x</td><td className={order.side==='long'?'text-[#089981]':'text-[#F23645]'}>{order.side==='long'?'多':'空'}</td><td>{order.size}</td><td><button onClick={()=>cancelOrder(order.id)} className="text-[#848e9c] hover:text-white"><XCircle size={10}/></button></td></tr>)}</tbody>
        </table>
    );

    // 3. 歷史
    const renderHistoryTable = (history) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
             <thead className="bg-[#2b3139] text-[#848e9c]"><tr><th className="pl-4 py-1.5">合約</th><th>方向</th><th>開倉</th><th>平倉</th><th>盈虧</th><th>時間</th></tr></thead>
             <tbody>{history.filter(h => h.mode === 'futures').map((item,i) => <tr key={i} className="border-b border-[#2b3139] opacity-60"><td className="pl-4 py-2">{item.symbol}</td><td className={item.side==='long'?'text-[#089981]':'text-[#F23645]'}>{item.side==='long'?'多':'空'}</td><td>{item.entryPrice}</td><td>{item.closePrice}</td><td className={item.pnl>=0?'text-[#089981]':'text-[#F23645]'}>{item.pnl}</td><td>{item.exitTime}</td></tr>)}</tbody>
        </table>
    );

    return (
        <div>
            {subTab === 'positions' && renderPositionsTable(data?.pos || [])}
            {subTab === 'orders' && renderOrdersTable(data?.ord || [])}
            {subTab === 'history' && renderHistoryTable(data?.history || [])}
        </div>
    );
};

export default FuturesView;