// src/components/TradingPanel/TradingPanel.jsx
import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Settings2, Info } from 'lucide-react';

const TradingPanel = ({
    tradeMode, setTradeMode,
    symbol,
    side, setSide,
    orderType, setOrderType,
    priceInput, setPriceInput,
    amount, setAmount,
    amountType, setAmountType,
    leverage, setLeverage,
    balance,
    handleTrade,
    currentPrice,
    // Grid specific props
    gridType, setGridType,
    gridLevels, setGridLevels,
    gridDirection, setGridDirection,
    gridLowerPrice, setGridLowerPrice,
    gridUpperPrice, setGridUpperPrice,
    reserveMargin, setReserveMargin
}) => {
    // --- 內部 UI 狀態 ---
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [gridSpacingType, setGridSpacingType] = useState('arithmetic');
    const [previewGrid, setPreviewGrid] = useState(false);
    
    // 進階參數
    const [triggerPrice, setTriggerPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [slippage, setSlippage] = useState('0.1%');

    // --- 計算邏輯 ---

    // 1. 預估每次套利利潤率
    const estimatedProfitRate = useMemo(() => {
        const lower = parseFloat(gridLowerPrice);
        const upper = parseFloat(gridUpperPrice);
        const count = parseInt(gridLevels);
        if (!lower || !upper || !count || lower >= upper || count < 2) return '--';
        
        if (gridSpacingType === 'arithmetic') {
            const priceDiff = upper - lower;
            const step = priceDiff / count;
            const avgPrice = (lower + upper) / 2;
            const rate = (step / avgPrice) * 100;
            const maxRate = (step / lower) * 100;
            const minRate = (step / upper) * 100;
            return `${minRate.toFixed(2)}% ~ ${maxRate.toFixed(2)}%`;
        } else {
            const ratio = Math.pow(upper / lower, 1 / count);
            const rate = (ratio - 1) * 100;
            return `${rate.toFixed(2)}%`;
        }
    }, [gridLowerPrice, gridUpperPrice, gridLevels, gridSpacingType]);

    // 2. 預估強平價
    const estimatedLiqPrice = useMemo(() => {
        if (gridType === 'spot' || !currentPrice || !leverage) return '--';
        const entry = currentPrice;
        const lev = parseFloat(leverage);
        const maintMargin = 0.005;
        
        if (gridDirection === 'long') {
            const liq = entry * (1 - (1 / lev) + maintMargin);
            return liq > 0 ? liq.toFixed(2) : '0.00';
        } else if (gridDirection === 'short') {
            const liq = entry * (1 + (1 / lev) - maintMargin);
            return liq.toFixed(2);
        }
        return '--';
    }, [currentPrice, leverage, gridDirection, gridType]);

    // 3. 計算 實際投資 與 額外保證金 (當開啟預留保證金時)
    // 這裡採用模擬邏輯：假設系統自動預留 15% 作為緩衝
    const investmentSplit = useMemo(() => {
        if (!amount || isNaN(amount)) return { invest: '--', margin: '--' };
        const total = parseFloat(amount);
        const marginPart = total * 0.15; // 15% 預留
        const investPart = total - marginPart; // 85% 實際投資
        return { 
            invest: investPart.toFixed(2), 
            margin: marginPart.toFixed(2) 
        };
    }, [amount]);

    // --- 提交處理 ---
    const onSubmit = () => {
        const advancedParams = {
            gridSpacingType,
            triggerPrice,
            stopLoss,
            takeProfit,
            previewGrid
        };
        handleTrade(advancedParams);
    };

    // --- UI Helpers ---
    const renderDirectionBtn = (dir, label, colorClass) => {
        const isActive = gridDirection === dir;
        return (
            <button
                onClick={() => setGridDirection(dir)}
                className={`flex-1 py-1.5 rounded text-sm font-bold transition-all ${
                    isActive 
                    ? `${colorClass} text-white shadow-md ring-1 ring-white/20` 
                    : 'bg-[#2b3139] text-[#848e9c] hover:bg-[#363c45]'
                }`}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="h-full bg-[#1e2329] border-l border-[#2b3139] flex flex-col select-none">
            
            {/* 1. 頂部模式分頁 */}
            <div className="flex bg-[#0b0e11] p-1 shrink-0 m-2 rounded">
                {['spot', 'futures', 'grid'].map(mode => (
                    <button
                        key={mode}
                        onClick={() => {
                            setTradeMode(mode);
                            if (mode === 'grid') {
                                setGridType('futures');
                                setGridDirection('long');
                            }
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
                            tradeMode === mode 
                            ? 'bg-[#2b3139] text-[#eaecef] shadow-sm' 
                            : 'text-[#848e9c] hover:text-[#eaecef]'
                        }`}
                    >
                        {mode === 'spot' ? '現貨' : mode === 'futures' ? '合約' : '網格策略'}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                
                {tradeMode === 'grid' ? (
                    // ================= 網格交易介面 =================
                    <div className="flex flex-col gap-5 mt-1">
                        
                        {/* 網格類型 */}
                        <div className="flex bg-[#2b3139] rounded p-0.5">
                            <button onClick={()=>setGridType('spot')} className={`flex-1 py-1 text-xs rounded ${gridType==='spot'?'bg-[#474d57] text-white font-bold':'text-[#848e9c]'}`}>現貨網格</button>
                            <button onClick={()=>setGridType('futures')} className={`flex-1 py-1 text-xs rounded ${gridType==='futures'?'bg-[#474d57] text-white font-bold':'text-[#848e9c]'}`}>合約網格</button>
                        </div>

                        {/* 方向選擇 */}
                        <div className="flex gap-2">
                            {renderDirectionBtn('long', '做多', 'bg-[#089981]')}
                            {renderDirectionBtn('short', '做空', 'bg-[#F23645]')}
                            {renderDirectionBtn('neutral', '中性', 'bg-[#848e9c]')}
                        </div>

                        {/* 1. 設定價格範圍 */}
                        <div>
                            <div className="text-xs font-bold text-[#eaecef] mb-2 border-b border-dashed border-[#474d57] inline-block pb-0.5 cursor-help">1.設定價格範圍</div>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <input 
                                        type="number" 
                                        placeholder="最低價"
                                        value={gridLowerPrice}
                                        onChange={(e) => setGridLowerPrice(e.target.value)}
                                        className="w-full bg-[#0b0e11] border border-[#474d57] rounded px-3 py-2.5 text-sm text-[#eaecef] placeholder-[#5e6673] focus:border-[#f0b90b] outline-none text-center"
                                    />
                                    <span className="absolute right-2 top-3 text-[10px] text-[#5e6673]">USDT</span>
                                </div>
                                <div className="flex-1 relative">
                                    <input 
                                        type="number" 
                                        placeholder="最高價"
                                        value={gridUpperPrice}
                                        onChange={(e) => setGridUpperPrice(e.target.value)}
                                        className="w-full bg-[#0b0e11] border border-[#474d57] rounded px-3 py-2.5 text-sm text-[#eaecef] placeholder-[#5e6673] focus:border-[#f0b90b] outline-none text-center"
                                    />
                                    <span className="absolute right-2 top-3 text-[10px] text-[#5e6673]">USDT</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. 設定網格數量 */}
                        <div>
                            <div className="text-xs font-bold text-[#eaecef] mb-2 border-b border-dashed border-[#474d57] inline-block pb-0.5 cursor-help">2.設定網格數量 <span className="text-[#848e9c] font-normal">(2-200)</span></div>
                            <div className="relative mb-2">
                                <input 
                                    type="number" 
                                    placeholder="網格個數"
                                    value={gridLevels}
                                    onChange={(e) => setGridLevels(e.target.value)}
                                    className="w-full bg-[#0b0e11] border border-[#474d57] rounded px-3 py-2.5 text-sm text-[#eaecef] placeholder-[#5e6673] focus:border-[#f0b90b] outline-none"
                                />
                                <div className="absolute right-2 top-2 bg-[#2b3139] px-1.5 py-0.5 rounded text-[10px] text-[#eaecef] border border-[#474d57] cursor-pointer hover:bg-[#474d57]">推薦</div>
                            </div>
                            <div className="text-[10px] text-[#848e9c] flex justify-between">
                                <span>預估每次套利利潤率 :</span>
                                <span className="text-[#f0b90b]">{estimatedProfitRate}</span>
                            </div>
                        </div>

                        {/* 預覽網格 */}
                        <div className="flex justify-end items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="preview" 
                                checked={previewGrid}
                                onChange={(e) => setPreviewGrid(e.target.checked)}
                                className="w-3 h-3 accent-[#f0b90b] cursor-pointer" 
                            />
                            <label htmlFor="preview" className="text-xs text-[#f0b90b] cursor-pointer select-none">預覽網格</label>
                        </div>

                        {/* 3. 輸入投資額 (更新重點區塊) */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-xs font-bold text-[#eaecef] border-b border-dashed border-[#474d57] inline-block pb-0.5 cursor-help">3.輸入投資額</div>
                                <div className="flex items-center gap-1.5">
                                    <input 
                                        type="checkbox" 
                                        id="reserve" 
                                        checked={reserveMargin}
                                        onChange={(e) => setReserveMargin(e.target.checked)} // 🔥 修正：使用 checked
                                        className="w-3 h-3 accent-[#f0b90b] cursor-pointer"
                                    />
                                    <label htmlFor="reserve" className="text-[10px] text-[#eaecef] cursor-pointer select-none">自動預留保證金</label>
                                </div>
                            </div>

                            <div className="relative mb-4">
                                <input 
                                    type="number" 
                                    placeholder="投資額 (USDT)"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    // 🔥 修改：增加 pb-6 給底部文字留空間，如果有開啟預留保證金的話
                                    className={`w-full bg-[#0b0e11] border border-[#474d57] rounded px-3 py-3 text-sm text-[#eaecef] placeholder-[#5e6673] focus:border-[#f0b90b] outline-none pr-12 ${reserveMargin ? 'pb-7' : ''}`}
                                />
                                
                                {/* 槓桿倍數標籤 */}
                                <div className="absolute right-2 top-2 bg-[#2b3139] px-2 py-1 rounded text-xs text-[#eaecef] font-bold border border-[#474d57] flex items-center gap-1">
                                    {leverage}x
                                </div>

                                {/* 🔥 新增：預留保證金分配顯示 */}
                                {reserveMargin && (
                                    <div className="absolute bottom-1.5 left-3 text-[10px] text-[#5e6673] font-mono whitespace-nowrap overflow-hidden text-ellipsis w-[90%]">
                                        實際投資 ({investmentSplit.invest}) + 額外保證金 ({investmentSplit.margin}) USDT
                                    </div>
                                )}
                            </div>
                            
                            {/* 槓桿滑桿 */}
                            {gridType === 'futures' && (
                                <div className="px-1 mb-2">
                                    <input 
                                        type="range" 
                                        min="1" max="125" step="1"
                                        value={leverage} 
                                        onChange={(e) => setLeverage(e.target.value)} 
                                        className="w-full h-1 bg-[#474d57] rounded-lg appearance-none cursor-pointer accent-[#848e9c]" 
                                    />
                                    <div className="flex justify-between text-[10px] text-[#5e6673] mt-1">
                                        <span>1x</span><span>20x</span><span>50x</span><span>100x</span><span>125x</span>
                                    </div>
                                </div>
                            )}

                            <div className="text-[10px] text-[#848e9c] space-y-1 mt-3 pb-3 border-b border-[#2b3139]">
                                <div className="flex justify-between"><span>可用資金:</span><span className="text-[#eaecef] font-bold">{balance.toFixed(2)} USDT</span></div>
                                <div className="flex justify-between"><span>槓桿後實際投資額:</span><span className="text-[#eaecef]">{amount ? (parseFloat(amount) * leverage).toFixed(2) : '0'} USDT</span></div>
                                <div className="flex justify-between"><span>預估強平價:</span><span className="text-[#f0b90b]">{estimatedLiqPrice} USDT</span></div>
                            </div>
                        </div>

                        {/* 進階設定 */}
                        <div>
                            <div 
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center gap-1 text-xs font-bold text-[#f0b90b] cursor-pointer mb-3 select-none hover:text-[#e0a800]"
                            >
                                {showAdvanced ? '進階 收起' : '進階 展開'} 
                                {showAdvanced ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                            </div>

                            {showAdvanced && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="relative">
                                        <input type="number" placeholder="觸發價格 (USDT,選填)" value={triggerPrice} onChange={e=>setTriggerPrice(e.target.value)} className="w-full bg-[#0b0e11] border border-[#474d57] rounded px-3 py-2 text-xs text-[#eaecef] focus:border-[#f0b90b] outline-none" />
                                        <span className="absolute right-2 top-2 text-[10px] text-[#5e6673]">USDT</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center py-1 border-b border-[#2b3139]">
                                        <div className="flex items-center gap-1 text-xs text-[#eaecef]"><Settings2 size={10}/> 滑點控制</div>
                                        <div className="text-xs text-[#eaecef] flex items-center gap-1 cursor-pointer">{slippage} (AI推薦) <ChevronDown size={10}/></div>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-[#2b3139]">
                                        <div className="flex items-center gap-1 text-xs text-[#eaecef]">止盈設定</div>
                                        <input type="number" placeholder="未設定" value={takeProfit} onChange={e=>setTakeProfit(e.target.value)} className="text-xs text-right bg-transparent outline-none text-[#eaecef] placeholder-[#5e6673] w-20"/>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-[#2b3139]">
                                        <div className="flex items-center gap-1 text-xs text-[#eaecef]">止損設定</div>
                                        <input type="number" placeholder="未設定" value={stopLoss} onChange={e=>setStopLoss(e.target.value)} className="text-xs text-right bg-transparent outline-none text-[#eaecef] placeholder-[#5e6673] w-20"/>
                                    </div>

                                    <div className="flex justify-between items-center py-1">
                                        <div className="text-xs text-[#eaecef]">網格掛單模式</div>
                                        <div className="flex bg-[#0b0e11] rounded p-0.5 border border-[#474d57]">
                                            <button onClick={()=>setGridSpacingType('arithmetic')} className={`px-2 py-0.5 text-[10px] rounded ${gridSpacingType==='arithmetic'?'bg-[#2b3139] text-[#eaecef]':'text-[#5e6673]'}`}>等差間隔</button>
                                            <button onClick={()=>setGridSpacingType('geometric')} className={`px-2 py-0.5 text-[10px] rounded ${gridSpacingType==='geometric'?'bg-[#2b3139] text-[#eaecef]':'text-[#5e6673]'}`}>等比間隔</button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center py-1">
                                         <div className="text-xs text-[#eaecef]">移動網格</div>
                                         <div className="text-xs text-[#eaecef] flex items-center gap-1 cursor-pointer">未設定 <ChevronDown size={10}/></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 創建按鈕 */}
                        <button 
                            onClick={onSubmit}
                            className={`w-full py-3 rounded font-bold text-white text-sm shadow-lg transition-colors
                                ${gridDirection === 'long' ? 'bg-[#089981] hover:bg-[#067a65]' : 
                                  gridDirection === 'short' ? 'bg-[#F23645] hover:bg-[#c22b37]' : 
                                  'bg-[#f0b90b] hover:bg-[#d9a506] text-black'}
                            `}
                        >
                            {gridDirection === 'long' ? '創建做多網格' : 
                             gridDirection === 'short' ? '創建做空網格' : 
                             '創建中性網格'}
                        </button>

                    </div>
                ) : (
                    // ================= 一般交易介面 (保留原始功能) =================
                    <div className="flex flex-col gap-4 mt-2">
                        {/* 買賣切換 */}
                        <div className="flex bg-[#2b3139] rounded p-1">
                            <button onClick={() => setSide('long')} className={`flex-1 py-2 rounded text-sm font-bold transition-all ${side === 'long' ? (tradeMode === 'futures' ? 'bg-[#089981] text-white' : 'bg-[#089981] text-white') : 'text-[#848e9c]'}`}>
                                {tradeMode === 'futures' ? '做多 (Long)' : '買入 (Buy)'}
                            </button>
                            <button onClick={() => setSide('short')} className={`flex-1 py-2 rounded text-sm font-bold transition-all ${side === 'short' ? (tradeMode === 'futures' ? 'bg-[#F23645] text-white' : 'bg-[#F23645] text-white') : 'text-[#848e9c]'}`}>
                                {tradeMode === 'futures' ? '做空 (Short)' : '賣出 (Sell)'}
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex bg-[#2b3139] rounded p-0.5">
                                <button onClick={()=>setOrderType('limit')} className={`flex-1 py-1 text-xs rounded ${orderType==='limit'?'bg-[#474d57] text-white':'text-[#848e9c]'}`}>限價單</button>
                                <button onClick={()=>setOrderType('market')} className={`flex-1 py-1 text-xs rounded ${orderType==='market'?'bg-[#474d57] text-white':'text-[#848e9c]'}`}>市價單</button>
                            </div>

                            <div>
                                <div className="text-xs text-[#848e9c] mb-1 flex justify-between">
                                    <span>價格</span>
                                    <span className="cursor-pointer hover:text-white" onClick={()=>setPriceInput(currentPrice.toFixed(2))}>最新: {currentPrice.toFixed(2)}</span>
                                </div>
                                <div className="relative">
                                    <input type="number" disabled={orderType==='market'} value={orderType==='market'?currentPrice:priceInput} onChange={e=>setPriceInput(e.target.value)} className={`w-full bg-[#0b0e11] border border-[#474d57] rounded px-3 py-2 text-sm text-[#eaecef] outline-none ${orderType==='market'?'opacity-50':''}`} />
                                    <span className="absolute right-3 top-2 text-xs text-[#848e9c]">USDT</span>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-[#848e9c] mb-1 flex justify-between">
                                    <span>數量</span>
                                    <span onClick={()=>setAmountType(amountType==='usdt'?'coin':'usdt')} className="cursor-pointer text-[#f0b90b]">{amountType.toUpperCase()} 切換</span>
                                </div>
                                <div className="relative">
                                    <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full bg-[#0b0e11] border border-[#474d57] rounded px-3 py-2 text-sm text-[#eaecef] outline-none" />
                                    <span className="absolute right-3 top-2 text-xs text-[#848e9c]">{amountType === 'usdt' ? 'USDT' : symbol.replace('USDT','')}</span>
                                </div>
                            </div>

                            {tradeMode === 'futures' && (
                                <div>
                                    <div className="text-xs text-[#848e9c] mb-1">槓桿倍數</div>
                                    <div className="flex items-center gap-2 bg-[#0b0e11] border border-[#474d57] rounded px-2 py-1">
                                        <input type="range" min="1" max="125" value={leverage} onChange={e=>setLeverage(e.target.value)} className="flex-1 h-1 bg-[#474d57] rounded-lg appearance-none cursor-pointer accent-[#f0b90b]" />
                                        <span className="text-sm w-8 text-right font-mono text-[#f0b90b]">{leverage}x</span>
                                    </div>
                                </div>
                            )}

                            <button onClick={()=>handleTrade()} className={`w-full py-3 rounded font-bold text-white mt-2 ${side === 'long' ? 'bg-[#089981] hover:bg-[#067a65]' : 'bg-[#F23645] hover:bg-[#c22b37]'}`}>
                                {side === 'long' ? (tradeMode==='futures'?'開倉做多':'買入') : (tradeMode==='futures'?'開倉做空':'賣出')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TradingPanel;