// src/components/PositionManagement/GridStrategyDetails.jsx
import React from 'react';
import { ArrowLeft } from 'lucide-react';
// 🔥 修改：改用專用的 GridChart，而不是通用的 ChartContainer
import GridChart from './GridChart'; 

const GridStrategyDetails = ({ grid, currentPrice, onBack, calculatePnL, klineData, timeframe, setTimeframe }) => {

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

            <div className="flex flex-1 overflow-hidden">
                {/* 左側數據面板 */}
                <div className="w-[400px] border-r border-[#2b3139] flex flex-col overflow-y-auto bg-[#161a1e] shrink-0">
                    <div className="p-4 border-b border-[#2b3139]">
                        <div className="text-xs text-[#848e9c] mb-2">總利潤 (USDT)</div>
                        <div className={`text-3xl font-bold mb-1 ${textColor}`}>
                            {totalProfit > 0 ? '+' : ''}{totalProfit.toFixed(2)}
                        </div>
                        <div className={`text-sm ${textColor}`}>
                            {totalRate > 0 ? '+' : ''}{totalRate.toFixed(2)}%
                        </div>
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-y-6 gap-x-4">
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
                        <div>
                            <div className="text-xs text-[#848e9c] mb-1">方向</div>
                            <div className="text-sm text-[#f0b90b] uppercase">{grid.gridDirection}</div>
                        </div>
                    </div>
                </div>

                {/* 右側圖表區域 */}
                <div className="flex-1 bg-[#0b0e11] relative flex flex-col min-h-0">
                    
                    {/* 🔥 自定義的時間週期切換列 (取代 ChartUI) */}
                    <div className="h-10 border-b border-[#2b3139] flex items-center px-4 gap-2 bg-[#1e2329] shrink-0">
                        {['15m', '1h', '4h', '1d'].map(tf => (
                            <button 
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`text-xs font-bold px-3 py-1 rounded transition-all ${
                                    timeframe === tf 
                                    ? 'bg-[#2b3139] text-[#f0b90b] shadow-sm' 
                                    : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139]'
                                }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    {/* 純淨的網格圖表 */}
                    <div className="flex-1 w-full h-full min-h-0">
                        <GridChart 
                            klineData={klineData}
                            grid={grid} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GridStrategyDetails;