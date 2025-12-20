// src/components/PositionManagement/GridDetails.jsx
import React from 'react';
import { X, Share2, MoreHorizontal, AlertCircle } from 'lucide-react';

const GridDetails = ({ grid, currentPrice, onClose, calculatePnL, closePosition }) => {
    if (!grid) return null;

    const startTime = grid.id;
    const now = Date.now();
    const diff = now - startTime;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const durationStr = `${days}日 ${hours}時 ${minutes}分`;
    const createTimeStr = new Date(startTime).toLocaleString();

    const realized = grid.realizedProfit || 0;
    const unrealized = calculatePnL(grid, currentPrice);
    const totalProfit = realized + unrealized;
    // 總利潤率
    const totalRate = grid.amount > 0 ? (totalProfit / grid.amount) * 100 : 0;
    // 網格利潤率 (獨立計算)
    const gridRate = grid.amount > 0 ? (realized / grid.amount) * 100 : 0;

    const isProfit = totalProfit >= 0;
    const bgColor = isProfit ? 'bg-[#089981]' : 'bg-[#F23645]';
    
    let dirTagColor = 'text-[#848e9c] border-[#848e9c]';
    let dirText = '中性';
    if (grid.gridDirection === 'long') { dirTagColor = 'text-[#089981] border-[#089981]'; dirText = '做多'; }
    if (grid.gridDirection === 'short') { dirTagColor = 'text-[#F23645] border-[#F23645]'; dirText = '做空'; }

    const matchedCount = grid.matchedCount || 0; 
    // 防止除以0，設定最小天數為 0.0001
    const daysFloat = Math.max(diff / (1000 * 60 * 60 * 24), 0.0001); 
    
    // 🔥 計算年化
    const gridApr = (gridRate / daysFloat * 365).toFixed(2);
    const totalApr = (totalRate / daysFloat * 365).toFixed(2);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#1e2329] rounded-xl overflow-hidden shadow-2xl border border-[#2b3139] flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-[#2b3139] flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-[10px] text-white">
                                {grid.symbol.substring(0,1)}
                            </div>
                            <h2 className="text-lg font-bold text-[#eaecef]">{grid.symbol} {grid.mode === 'grid_spot' ? '現貨網格' : '合約網格'}</h2>
                            {grid.mode === 'grid_futures' && (
                            <span className={`text-xs px-1.5 py-0.5 border rounded ${dirTagColor}`}>
                                {grid.leverage}x {dirText}
                            </span>
                        )}
                    </div>
                        <div className="text-xs text-[#848e9c]">
                            運行時長 {durationStr} &nbsp; {createTimeStr} 創建
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#848e9c] hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar">
                    <div className="p-4 flex gap-2">
                        <div className="flex-1 bg-[#2b3139] rounded p-3 flex flex-col justify-center">
                            <div className="text-xs text-[#848e9c] mb-1">實際投資額(USDT)</div>
                            <div className="text-lg font-bold text-[#eaecef]">{grid.amount.toFixed(2)}</div>
                        </div>
                        <div className={`flex-[1.5] ${bgColor} rounded p-3 flex flex-col justify-center text-white`}>
                            <div className="text-xs opacity-90 mb-1">總利潤(USDT)</div>
                            <div className="text-xl font-bold flex items-baseline gap-1">
                                {totalProfit > 0 ? '+' : ''}{totalProfit.toFixed(2)}
                                <span className="text-sm font-normal">({totalRate > 0 ? '+' : ''}{totalRate.toFixed(2)}%)</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-y-6 gap-x-2 px-4 pb-6">
                        <div>
                            <div className="flex items-center gap-1 text-xs text-[#848e9c] mb-1">網格利潤(USDT) <AlertCircle size={10}/></div>
                            <div className="text-sm font-bold text-[#089981]">+{realized.toFixed(4)}</div>
                            <div className="text-xs text-[#089981]">+{gridRate.toFixed(2)}%</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1 text-xs text-[#848e9c] mb-1">趨勢盈虧(USDT) <AlertCircle size={10}/></div>
                            <div className={`text-sm font-bold ${unrealized >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                {unrealized > 0 ? '+' : ''}{unrealized.toFixed(2)}
                            </div>
                            <div className={`text-xs ${unrealized >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                {grid.amount > 0 ? ((unrealized/grid.amount)*100).toFixed(2) : '0.00'}%
                            </div>
                        </div>
                        {/* 🔥 修正年化顯示 */}
                        <div>
                            <div className="text-xs text-[#848e9c] mb-1">網格年化/總年化</div>
                            <div className="text-sm font-bold text-[#089981]">{gridApr}%</div>
                            <div className={`text-xs ${totalRate >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                {totalApr}%
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-[#848e9c] mb-1">最新價格/資金費率</div>
                            <div className="text-sm font-bold text-[#eaecef]">{currentPrice.toFixed(2)}</div>
                            <div className="text-xs text-[#f0b90b]">+0.0100%</div>
                        </div>
                        <div>
                            <div className="text-xs text-[#848e9c] mb-1">價格區間(USDT)</div>
                            <div className="text-sm font-bold text-[#eaecef]">{grid.gridLower} - {grid.gridUpper}</div>
                            <div className="text-xs text-[#eaecef]">({grid.gridLevels} 格)</div>
                        </div>
                        <div>
                            <div className="text-xs text-[#848e9c] mb-1">24h/總套利次數</div>
                            <div className="text-sm font-bold text-[#eaecef]">{matchedCount}次 <span className="text-[#848e9c] font-normal">({matchedCount}次)</span></div>
                        </div>
                        <div>
                            <div className="text-xs text-[#848e9c] mb-1">開單時價格(USDT)</div>
                            <div className="text-sm font-bold text-[#eaecef]">{grid.entryPrice.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[#2b3139] flex gap-3 bg-[#1e2329]">
                    <button 
                        onClick={() => { closePosition(grid.id); onClose(); }}
                        className="flex-1 bg-[#2b3139] hover:bg-[#363c45] text-[#848e9c] hover:text-[#eaecef] py-2.5 rounded text-sm font-medium transition-colors border border-[#474d57]"
                    >
                        關閉策略
                    </button>
                    <button className="flex-1 bg-[#2b3139] hover:bg-[#363c45] text-[#848e9c] hover:text-[#eaecef] py-2.5 rounded text-sm font-medium transition-colors border border-[#474d57] flex items-center justify-center gap-1">
                        更多 <MoreHorizontal size={16}/>
                    </button>
                    <button className="flex-1 bg-[#2b3139] hover:bg-[#363c45] text-[#848e9c] hover:text-[#eaecef] py-2.5 rounded text-sm font-medium transition-colors border border-[#474d57] flex items-center justify-center gap-1">
                        分享 <Share2 size={16}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GridDetails;