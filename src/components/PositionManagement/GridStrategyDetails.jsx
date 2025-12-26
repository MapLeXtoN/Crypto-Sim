// src/components/PositionManagement/GridStrategyDetails.jsx
import React, { useMemo, useState } from 'react';
import { ArrowLeft, ShieldPlus, Target, Settings } from 'lucide-react';

const GridStrategyDetails = ({ grid, currentPrice, onBack, calculatePnL, onUpdateStrategy }) => {

    if (!grid) return null;

    const isFutures = grid.mode === 'grid_futures';

    const [marginAdd, setMarginAdd] = useState("");
    const [tp, setTp] = useState(grid.tp || "");
    const [sl, setSl] = useState(grid.sl || "");

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

    const liqPrice = useMemo(() => {
        if (!isFutures || !grid.entryPrice || !grid.size) return "--";
        const entry = parseFloat(grid.entryPrice);
        const margin = parseFloat(grid.margin); 
        const size = parseFloat(grid.size);
        const maintMargin = 0.005;

        if (grid.gridDirection === 'long') {
            const liq = entry - (margin / size) + (entry * maintMargin);
            return liq > 0 ? liq.toFixed(2) : "0.00";
        } else if (grid.gridDirection === 'short') {
            const liq = entry + (margin / size) - (entry * maintMargin);
            return liq.toFixed(2);
        }
        return "--";
    }, [grid, isFutures]);

    const { rows, buyCount, sellCount } = useMemo(() => {
        if (!grid.gridLower || !grid.gridUpper || !grid.gridLevels || !currentPrice) 
            return { rows: [], buyCount: 0, sellCount: 0 };
        
        const lower = parseFloat(grid.gridLower);
        const upper = parseFloat(grid.gridUpper);
        const levels = parseInt(grid.gridLevels);
        
        // 🔥 [修正] 使用 (levels - 1) 作為區間數，確保線數正確
        const actualLevels = levels > 1 ? levels : 2; 
        const step = (upper - lower) / (actualLevels - 1);
        
        const buys = [];
        const sells = [];

        // 🔥 [修正] 迴圈次數 = 線數，確保不顯示多餘的線
        for (let i = 0; i < actualLevels; i++) {
            const price = lower + (i * step);
            if (price < currentPrice) {
                const diff = ((price - currentPrice) / currentPrice) * 100;
                buys.push({ price, diff });
            } else if (price > currentPrice) {
                const diff = ((price - currentPrice) / currentPrice) * 100;
                sells.push({ price, diff });
            }
        }

        buys.sort((a, b) => b.price - a.price);
        sells.sort((a, b) => a.price - b.price);

        const maxLen = Math.max(buys.length, sells.length);
        const resultRows = [];
        for(let i = 0; i < maxLen; i++) {
            resultRows.push({
                index: i + 1,
                buy: buys[i] || null,
                sell: sells[i] || null
            });
        }

        return { rows: resultRows, buyCount: buys.length, sellCount: sells.length };
    }, [grid, currentPrice]);

    const priceDecimals = (grid.symbol.includes('BTC') || grid.symbol.includes('ETH')) ? 2 : 4;

    const handleSaveSettings = () => {
        onUpdateStrategy(grid.id, { marginAdd, tp, sl });
        setMarginAdd(""); 
    };

    return (
        <div className="flex flex-col h-screen bg-[#0b0e11] text-[#eaecef] overflow-hidden">
            
            <div className="h-14 border-b border-[#2b3139] flex items-center px-4 bg-[#1e2329] shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-[#848e9c] hover:text-[#f0b90b] transition-colors">
                    <ArrowLeft size={20} />
                    <span className="font-bold text-sm">返回交易面板</span>
                </button>
                <div className="ml-6 flex items-center gap-3">
                    <h1 className="text-lg font-bold">{grid.symbol} {isFutures ? '合約網格' : '現貨網格'}</h1>
                    <span className="text-xs bg-[#2b3139] border border-[#474d57] px-2 py-0.5 rounded text-[#848e9c]">運行中</span>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                
                <div className="w-full md:w-1/3 flex flex-col overflow-y-auto bg-[#161a1e] shrink-0 border-r border-[#2b3139]">
                    <div className="p-6 border-b border-[#2b3139]">
                        <div className="text-xs text-[#848e9c] mb-2">總利潤 (USDT)</div>
                        <div className={`text-4xl font-bold mb-2 ${textColor}`}>{totalProfit > 0 ? '+' : ''}{totalProfit.toFixed(2)}</div>
                        <div className={`text-sm ${textColor}`}>{totalRate > 0 ? '+' : ''}{totalRate.toFixed(2)}%</div>
                    </div>

                    <div className="p-6 grid grid-cols-2 gap-y-8 gap-x-4 border-b border-[#2b3139]">
                        <div><div className="text-xs text-[#848e9c] mb-1">網格利潤</div><div className="text-sm font-bold text-[#089981]">+{realized.toFixed(4)}</div></div>
                        <div><div className="text-xs text-[#848e9c] mb-1">浮動盈虧</div><div className={`text-sm font-bold ${textColor}`}>{unrealized.toFixed(4)}</div></div>
                        
                        {isFutures && (
                            <div><div className="text-xs text-[#848e9c] mb-1">當前強平價</div><div className="text-sm font-bold text-[#f0b90b]">{liqPrice}</div></div>
                        )}
                        
                        <div><div className="text-xs text-[#848e9c] mb-1">運行時長</div><div className="text-sm text-[#eaecef]">{durationStr}</div></div>
                        <div><div className="text-xs text-[#848e9c] mb-1">套利次數</div><div className="text-sm text-[#eaecef]">{grid.matchedCount || 0} 次</div></div>
                        <div><div className="text-xs text-[#848e9c] mb-1">掛單分佈 (買/賣)</div><div className="text-sm text-[#eaecef]"><span className="text-[#089981]">{buyCount}</span> / <span className="text-[#F23645]">{sellCount}</span> (共{buyCount+sellCount}格)</div></div>
                        <div><div className="text-xs text-[#848e9c] mb-1">投資額</div><div className="text-sm text-[#eaecef]">{grid.amount} USDT</div></div>
                    </div>

                    <div className="p-6">
                        <div className="text-sm font-bold text-[#f0b90b] mb-4 flex items-center gap-2">
                            {isFutures ? <ShieldPlus size={16}/> : <Settings size={16}/>}
                            {isFutures ? "調整保證金 (降低強平價)" : "策略設定 (止盈/止損)"}
                        </div>
                        
                        <div className="space-y-4">
                            {isFutures && (
                                <div>
                                    <label className="text-xs text-[#848e9c] mb-1 block">增加保證金 (USDT)</label>
                                    <input type="number" placeholder="輸入金額..." value={marginAdd} onChange={e=>setMarginAdd(e.target.value)} className="w-full bg-[#0b0e11] border border-[#474d57] rounded px-3 py-2 text-sm text-[#eaecef] outline-none focus:border-[#f0b90b]"/>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-xs text-[#848e9c] mb-1 block">止盈價格 (TP)</label><input type="number" placeholder="未設定" value={tp} onChange={e=>setTp(e.target.value)} className="w-full bg-[#0b0e11] border border-[#474d57] rounded px-3 py-2 text-sm text-[#eaecef] outline-none focus:border-[#089981]"/></div>
                                <div><label className="text-xs text-[#848e9c] mb-1 block">止損價格 (SL)</label><input type="number" placeholder="未設定" value={sl} onChange={e=>setSl(e.target.value)} className="w-full bg-[#0b0e11] border border-[#474d57] rounded px-3 py-2 text-sm text-[#eaecef] outline-none focus:border-[#F23645]"/></div>
                            </div>
                            <button onClick={handleSaveSettings} className="w-full bg-[#2b3139] hover:bg-[#363c45] text-[#eaecef] py-2 rounded text-xs font-bold border border-[#474d57] transition-colors">確認修改</button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-[#0b0e11] flex flex-col overflow-hidden">
                    <div className="p-4 bg-[#1e2329] border-b border-[#2b3139]">
                        <div className="bg-[#0b0e11] rounded-lg p-4 flex flex-col items-center justify-center border border-[#2b3139] shadow-sm">
                            <div className="text-xs text-[#eaecef] mb-1 font-bold">每格買賣數量 {grid.unitPerGrid ? grid.unitPerGrid.toFixed(4) : '--'} {grid.symbol.replace('USDT','')}</div>
                            <div className="flex items-center gap-2"><span className="text-xs text-[#848e9c]">當前價格</span><span className="text-sm font-mono font-bold text-[#f0b90b]">{grid.symbol} = {currentPrice.toFixed(2)}</span><span className="w-1.5 h-1.5 bg-[#f0b90b] rounded-full animate-pulse"></span></div>
                        </div>
                    </div>
                    <div className="flex h-1.5 w-full"><div className="flex-1 bg-[#089981]"></div><div className="flex-1 bg-[#F23645]"></div></div>
                    <div className="flex text-xs text-[#848e9c] px-4 py-2 border-b border-[#2b3139] bg-[#161a1e]"><div className="w-[30%] text-left">買入價格</div><div className="w-[40%] text-center">跌漲多少後成交</div><div className="w-[30%] text-right">賣出價格</div></div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {rows.map((row) => (
                            <div key={row.index} className="flex items-center px-4 py-2.5 border-b border-[#2b3139] hover:bg-[#1e2329] transition-colors text-xs">
                                <div className="w-[30%] flex items-center gap-2">{row.buy ? <><span className="flex items-center justify-center min-w-[20px] h-5 bg-[#089981] text-white font-bold rounded text-[10px]">{row.index}</span><span className="text-[#089981] font-mono font-medium">{row.buy.price.toFixed(priceDecimals)}</span></> : <span className="text-[#2b3139]">--</span>}</div>
                                <div className="w-[40%] flex justify-center gap-4 font-mono"><span className="text-[#089981] w-1/2 text-right">{row.buy ? `${row.buy.diff.toFixed(2)}%` : ''}</span><span className="text-[#F23645] w-1/2 text-left">{row.sell ? `+${row.sell.diff.toFixed(2)}%` : ''}</span></div>
                                <div className="w-[30%] flex items-center justify-end gap-2">{row.sell ? <><span className="text-[#F23645] font-mono font-medium">{row.sell.price.toFixed(priceDecimals)}</span><span className="flex items-center justify-center min-w-[20px] h-5 bg-[#F23645] text-white font-bold rounded text-[10px]">{row.index}</span></> : <span className="text-[#2b3139]">--</span>}</div>
                            </div>
                        ))}
                        <div className="h-10"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GridStrategyDetails;