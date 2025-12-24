// src/components/PositionManagement/GridStrategyDetails.jsx
import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';

const GridStrategyDetails = ({ grid, currentPrice, onBack, calculatePnL }) => {

    if (!grid) return null;

    const startTime = grid.id;
    const now = Date.now();
    const diff = now - startTime;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const durationStr = `${days}日 ${Math.floor((diff / (1000 * 60 * 60)) % 24)}時`;
    
    const realized = grid.realizedProfit || 0;
    const unrealized = calculatePnL(grid, currentPrice);
    const totalProfit = realized + unrealized;
    const totalRate = grid.amount > 0 ? (totalProfit / grid.amount) * 100 : 0;
    const isProfit = totalProfit >= 0;
    const textColor = isProfit ? 'text-[#089981]' : 'text-[#F23645]';

    // --- 新增：網格掛單計算邏輯 ---
    const gridOrders = useMemo(() => {
        if (!grid.gridLower || !grid.gridUpper || !grid.gridLevels) return [];
        
        const lower = parseFloat(grid.gridLower);
        const upper = parseFloat(grid.gridUpper);
        const levels = parseInt(grid.gridLevels);
        
        // 計算網格間距 (等差網格)
        const step = (upper - lower) / levels;
        
        const orders = [];
        // 從最接近上限的價格開始往下生成 (模擬圖片排序：價格由高到低)
        for (let i = levels - 1; i >= 0; i--) {
            const buyPrice = lower + (i * step);
            const sellPrice = buyPrice + step;
            
            // 計算該價格與當前價格的差距百分比
            const diffPercent = ((buyPrice - currentPrice) / currentPrice) * 100;
            const sellDiffPercent = ((sellPrice - currentPrice) / currentPrice) * 100;

            orders.push({
                index: levels - i, // 序號
                buyPrice: buyPrice,
                sellPrice: sellPrice,
                diffPercent: diffPercent,
                sellDiffPercent: sellDiffPercent
            });
        }
        return orders;
    }, [grid, currentPrice]);
    // ---------------------------

    return (
        <div className="flex flex-col h-screen bg-[#0b0e11] text-[#eaecef] overflow-hidden">
            
            {/* 頂部導航列 */}
            <div className="h-14 border-b border-[#2b3139] flex items-center px-4 bg-[#1e2329] shrink-0">
                <button 
                    onClick={onBack} 
                    className="flex items-center gap-2 text-[#848e9c] hover:text-[#f0b90b] transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-bold text-sm">返回交易面板</span>
                </button>
                <div className="ml-6 flex items-center gap-3">
                    <h1 className="text-lg font-bold">{grid.symbol} {grid.mode === 'grid_spot' ? '現貨網格' : '合約網格'}</h1>
                    <span className="text-xs bg-[#2b3139] border border-[#474d57] px-2 py-0.5 rounded text-[#848e9c]">
                        運行中
                    </span>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                
                {/* 左側：總覽數據 (保留原本樣式，加上 shrink-0 防止被壓縮) */}
                <div className="w-full md:w-1/3 flex flex-col overflow-y-auto bg-[#161a1e] shrink-0 border-r border-[#2b3139]">
                    <div className="p-6 border-b border-[#2b3139]">
                        <div className="text-xs text-[#848e9c] mb-2">總利潤 (USDT)</div>
                        <div className={`text-4xl font-bold mb-2 ${textColor}`}>
                            {totalProfit > 0 ? '+' : ''}{totalProfit.toFixed(2)}
                        </div>
                        <div className={`text-sm ${textColor}`}>
                            {totalRate > 0 ? '+' : ''}{totalRate.toFixed(2)}%
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-2 gap-y-8 gap-x-4">
                        <div>
                            <div className="text-xs text-[#848e9c] mb-1">網格利潤</div>
                            <div className="text-sm font-bold text-[#089981]">+{realized.toFixed(4)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-[#848e9c] mb-1">浮動盈虧</div>
                            <div className={`text-sm font-bold ${textColor}`}>{unrealized.toFixed(4)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-[#848e9c] mb-1">運行時長</div>
                            <div className="text-sm text-[#eaecef]">{durationStr}</div>
                        </div>
                        <div>
                            <div className="text-xs text-[#848e9c] mb-1">套利次數</div>
                            <div className="text-sm text-[#eaecef]">{grid.matchedCount || 0} 次</div>
                        </div>
                        <div>
                            <div className="text-xs text-[#848e9c] mb-1">區間上限</div>
                            <div className="text-sm text-[#eaecef]">{grid.gridUpper}</div>
                        </div>
                        <div>
                            <div className="text-xs text-[#848e9c] mb-1">區間下限</div>
                            <div className="text-sm text-[#eaecef]">{grid.gridLower}</div>
                        </div>
                        <div>
                            <div className="text-xs text-[#848e9c] mb-1">投資額</div>
                            <div className="text-sm text-[#eaecef]">{grid.amount} USDT</div>
                        </div>
                    </div>
                </div>

                {/* 右側 (或下方)：網格掛單詳情 (仿照您的圖片) */}
                <div className="flex-1 bg-[#0b0e11] flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#2b3139] bg-[#1e2329] text-sm font-bold text-[#eaecef]">
                        網格掛單詳情
                    </div>
                    
                    {/* 表頭 */}
                    <div className="flex text-xs text-[#848e9c] px-4 py-2 border-b border-[#2b3139] bg-[#161a1e]">
                        <div className="w-1/3 text-left">買入價格 (Buy)</div>
                        <div className="w-1/3 text-center">當前差距</div>
                        <div className="w-1/3 text-right">賣出價格 (Sell)</div>
                    </div>

                    {/* 列表內容 */}
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {gridOrders.map((item) => (
                            <div key={item.index} className="flex items-center px-4 py-3 border-b border-[#2b3139] hover:bg-[#1e2329] transition-colors text-xs">
                                
                                {/* 左側：買入價格 */}
                                <div className="w-1/3 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 bg-[#089981] text-white font-bold rounded text-[10px]">
                                        {item.index}
                                    </span>
                                    <span className="text-[#089981] font-mono font-medium text-sm">
                                        {item.buyPrice.toFixed(grid.symbol.includes('BTC') || grid.symbol.includes('ETH') ? 2 : 4)}
                                    </span>
                                </div>

                                {/* 中間：漲跌幅 (顯示買入價與現價的距離) */}
                                <div className="w-1/3 text-center flex flex-col justify-center">
                                    <span className={`${item.diffPercent >= 0 ? 'text-[#089981]' : 'text-[#F23645]'} font-mono`}>
                                        {item.diffPercent > 0 ? '+' : ''}{item.diffPercent.toFixed(2)}%
                                    </span>
                                </div>

                                {/* 右側：賣出價格 */}
                                <div className="w-1/3 flex items-center justify-end gap-2">
                                    <span className="text-[#F23645] font-mono font-medium text-sm">
                                        {item.sellPrice.toFixed(grid.symbol.includes('BTC') || grid.symbol.includes('ETH') ? 2 : 4)}
                                    </span>
                                    <span className="flex items-center justify-center w-5 h-5 bg-[#F23645] text-white font-bold rounded text-[10px]">
                                        {item.index}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GridStrategyDetails;