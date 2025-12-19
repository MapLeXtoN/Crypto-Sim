// src/components/TradingPanel/FuturesTrading.jsx
import React, { useState } from 'react';
import { XCircle, Edit2, Settings, FileText, X } from 'lucide-react';

// 內部組件：合約持倉詳情彈窗
const PositionDetailsModal = ({ position, currentPrice, onClose, calculatePnL }) => {
    if (!position) return null;

    const pnl = calculatePnL(position, currentPrice);
    const value = position.size * currentPrice; // 倉位價值
    const roe = (position.margin && position.margin > 0) ? (pnl / position.margin) * 100 : 0;
    
    // 模擬止盈止損狀態 (實際專案需從 position 讀取或透過 API 更新)
    const [tpPrice, setTpPrice] = useState(position.tp || '');
    const [slPrice, setSlPrice] = useState(position.sl || '');
    const [margin, setMargin] = useState(position.margin);
    const [isEditingMargin, setIsEditingMargin] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#1e2329] rounded-xl overflow-hidden shadow-2xl border border-[#2b3139] flex flex-col">
                {/* 標題 */}
                <div className="p-4 border-b border-[#2b3139] flex justify-between items-center bg-[#2b3139]">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-[#eaecef]">{position.symbol} 持倉詳情</h2>
                        <span className={`text-xs px-1.5 py-0.5 border rounded ${position.side === 'long' ? 'text-[#089981] border-[#089981]' : 'text-[#F23645] border-[#F23645]'}`}>
                            {position.leverage}x {position.side === 'long' ? '做多' : '做空'}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-[#848e9c] hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* 內容區 */}
                <div className="p-5 space-y-5 text-sm">
                    {/* 第一排：盈虧大字 */}
                    <div className="text-center mb-2">
                        <div className="text-[#848e9c] text-xs mb-1">未實現盈虧 (ROE)</div>
                        <div className={`text-2xl font-bold ${pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                            {pnl > 0 ? '+' : ''}{pnl.toFixed(2)} 
                            <span className="text-sm ml-2">({roe.toFixed(2)}%)</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#161a1e] p-3 rounded border border-[#2b3139]">
                            <div className="text-[#848e9c] text-xs mb-1">持倉數量</div>
                            <div className="text-[#eaecef] font-bold">{position.size.toFixed(4)}</div>
                        </div>
                        <div className="bg-[#161a1e] p-3 rounded border border-[#2b3139]">
                            <div className="text-[#848e9c] text-xs mb-1">倉位價值 (USDT)</div>
                            <div className="text-[#eaecef] font-bold">{value.toFixed(2)}</div>
                        </div>
                        <div className="bg-[#161a1e] p-3 rounded border border-[#2b3139]">
                            <div className="text-[#848e9c] text-xs mb-1">開倉價格</div>
                            <div className="text-[#eaecef] font-bold">{position.entryPrice.toFixed(2)}</div>
                        </div>
                        <div className="bg-[#161a1e] p-3 rounded border border-[#2b3139]">
                            <div className="text-[#848e9c] text-xs mb-1">標記價格</div>
                            <div className="text-[#eaecef] font-bold">{currentPrice.toFixed(2)}</div>
                        </div>
                    </div>

                    {/* 保證金調整 */}
                    <div className="bg-[#161a1e] p-3 rounded border border-[#2b3139] flex justify-between items-center">
                        <div>
                            <div className="text-[#848e9c] text-xs mb-1">保證金 (USDT)</div>
                            {isEditingMargin ? (
                                <input 
                                    type="number" 
                                    value={margin}
                                    onChange={(e) => setMargin(e.target.value)}
                                    className="bg-[#2b3139] text-[#eaecef] text-sm px-2 py-1 rounded w-24 outline-none border border-[#474d57]"
                                />
                            ) : (
                                <div className="text-[#eaecef] font-bold">{Number(margin).toFixed(2)}</div>
                            )}
                        </div>
                        <button 
                            onClick={() => setIsEditingMargin(!isEditingMargin)}
                            className="text-[#f0b90b] hover:text-[#ffe251] p-1"
                        >
                            {isEditingMargin ? '確定' : <Edit2 size={16} />}
                        </button>
                    </div>

                    {/* 止盈止損設定 */}
                    <div className="space-y-3 pt-2 border-t border-[#2b3139]">
                        <div className="flex items-center gap-2 text-[#eaecef] font-bold">
                            <Settings size={14} /> 止盈止損設置
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[#848e9c] text-xs block mb-1">止盈價格 (TP)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        placeholder="未設置"
                                        value={tpPrice}
                                        onChange={(e) => setTpPrice(e.target.value)}
                                        className="w-full bg-[#2b3139] text-[#eaecef] px-3 py-2 rounded text-xs border border-[#474d57] focus:border-[#f0b90b] outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[#848e9c] text-xs block mb-1">止損價格 (SL)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        placeholder="未設置"
                                        value={slPrice}
                                        onChange={(e) => setSlPrice(e.target.value)}
                                        className="w-full bg-[#2b3139] text-[#eaecef] px-3 py-2 rounded text-xs border border-[#474d57] focus:border-[#f0b90b] outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-[#2b3139] flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-[#474d57] hover:bg-[#575e6a] text-[#eaecef] py-2 rounded text-sm font-bold transition-colors">
                        取消
                    </button>
                    <button onClick={onClose} className="flex-1 bg-[#f0b90b] hover:bg-[#ffe251] text-black py-2 rounded text-sm font-bold transition-colors">
                        確認修改
                    </button>
                </div>
            </div>
        </div>
    );
};

const FuturesView = ({ subTab, data, currentPrice, cancelOrder, closePosition, calculatePnL, symbol }) => {

    const [selectedPosition, setSelectedPosition] = useState(null);

    // 1. 合約倉位
    const renderPositionsTable = (positions) => (
        <>
            <table className="w-full text-left text-xs text-[#eaecef]">
                <thead className="bg-[#2b3139] text-[#848e9c]">
                    <tr>
                        <th className="pl-4 py-1.5">合約</th>
                        <th>方向</th>
                        <th>持倉數量</th>
                        <th>開倉價格</th>
                        <th>標記價格</th>
                        <th>保證金</th>
                        <th>盈虧</th>
                        <th>操作</th>
                        <th className="pr-4 text-right">詳情</th> {/* 新增詳情欄位 */}
                    </tr>
                </thead>
                <tbody>
                    {positions.filter(p => p.mode === 'futures').map(pos => {
                        const isCurrent = pos.symbol === symbol;
                        const pnl = isCurrent ? calculatePnL(pos, currentPrice) : 0;
                        const roe = (pos.margin && pos.margin > 0) ? (pnl / pos.margin) * 100 : 0;
                        return (
                            <tr key={pos.id} className={`border-b border-[#2b3139] ${!isCurrent ? 'opacity-50' : ''}`}>
                                <td className="pl-4 py-2 font-bold">{pos.symbol} <span className="bg-[#474d57] px-1 rounded text-[10px]">{pos.leverage}x</span></td>
                                <td className={pos.side === 'long' ? 'text-[#089981]' : 'text-[#F23645]'}>{pos.side === 'long' ? '多' : '空'}</td>
                                <td>{pos.size.toFixed(4)}</td>
                                <td>{pos.entryPrice.toFixed(2)}</td>
                                <td>{isCurrent ? currentPrice.toFixed(2) : '-'}</td>
                                <td>{pos.margin.toFixed(2)}</td>
                                <td className={pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                                    {isCurrent ? `${pnl.toFixed(2)} (${roe.toFixed(2)}%)` : '切換查看'}
                                </td>
                                <td>
                                    <button onClick={() => closePosition(pos.id)} className="bg-[#2b3139] border border-[#474d57] px-2 py-1 rounded text-[#eaecef] hover:bg-[#474d57]">
                                        平倉
                                    </button>
                                </td>
                                <td className="pr-4 text-right">
                                    <button 
                                        onClick={() => setSelectedPosition(pos)}
                                        className="text-[#848e9c] hover:text-[#f0b90b] transition-colors"
                                    >
                                        <FileText size={16} />
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                    {positions.filter(p => p.mode === 'futures').length === 0 && <tr><td colSpan="9" className="text-center py-8 text-gray-600">無合約持倉</td></tr>}
                </tbody>
            </table>

            {/* 詳情彈窗 */}
            {selectedPosition && (
                <PositionDetailsModal 
                    position={selectedPosition} 
                    currentPrice={currentPrice}
                    calculatePnL={calculatePnL}
                    onClose={() => setSelectedPosition(null)}
                />
            )}
        </>
    );

    // 2. 掛單 (修改重點：新增 總額 與 時間)
    const renderOrdersTable = (orders) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
            <thead className="bg-[#2b3139] text-[#848e9c]">
                <tr>
                    <th className="pl-4 py-1.5">合約</th>
                    <th>類型</th>
                    <th>方向</th>
                    <th>數量</th>
                    <th>下單金額 (USDT)</th> {/* 新增 */}
                    <th>下單時間</th>       {/* 新增 */}
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                {orders.filter(o => o.mode === 'futures').map(order => {
                    // 計算下單金額 (若是限價單: 價格 * 數量)
                    const orderAmount = (order.price * order.size).toFixed(2);
                    // 格式化時間 (假設 order.time 是 timestamp 或 ISO string)
                    const orderTime = order.time ? new Date(order.time).toLocaleString() : '--';
                    
                    return (
                        <tr key={order.id} className="border-b border-[#2b3139]">
                            <td className="pl-4 py-2 font-bold">{order.symbol}</td>
                            <td className="text-[#f0b90b]">{order.leverage}x 限價</td>
                            <td className={order.side === 'long' ? 'text-[#089981]' : 'text-[#F23645]'}>{order.side === 'long' ? '做多' : '做空'}</td>
                            <td>{order.size}</td>
                            
                            {/* 顯示下單金額 */}
                            <td className="text-[#eaecef] font-mono">{orderAmount}</td>
                            
                            {/* 顯示下單時間 */}
                            <td className="text-[#848e9c] text-[10px]">{orderTime}</td>
                            
                            <td>
                                <button onClick={() => cancelOrder(order.id)} className="text-[#848e9c] hover:text-white">
                                    <XCircle size={12} />
                                </button>
                            </td>
                        </tr>
                    )
                })}
                {orders.filter(o => o.mode === 'futures').length === 0 && <tr><td colSpan="7" className="text-center py-8 text-gray-600">無合約掛單</td></tr>}
            </tbody>
        </table>
    );

    // 3. 歷史
    const renderHistoryTable = (history) => (
        <table className="w-full text-left text-xs text-[#eaecef]">
            <thead className="bg-[#2b3139] text-[#848e9c]"><tr><th className="pl-4 py-1.5">合約</th><th>方向</th><th>開倉</th><th>平倉</th><th>盈虧</th><th>時間</th></tr></thead>
            <tbody>{history.filter(h => h.mode === 'futures').map((item, i) => <tr key={i} className="border-b border-[#2b3139] opacity-60"><td className="pl-4 py-2">{item.symbol}</td><td className={item.side === 'long' ? 'text-[#089981]' : 'text-[#F23645]'}>{item.side === 'long' ? '多' : '空'}</td><td>{item.entryPrice}</td><td>{item.closePrice}</td><td className={item.pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>{item.pnl}</td><td>{item.exitTime}</td></tr>)}</tbody>
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