// src/components/PositionManagement/GridDetails.jsx
import React, { useState } from 'react';
import { X, ShieldPlus, Target, AlertOctagon, Info } from 'lucide-react';

const GridDetails = ({ grid, currentPrice, onClose, calculatePnL, closePosition }) => {
    if (!grid) return null;

    // 狀態管理：預留給修改功能
    const [marginAdd, setMarginAdd] = useState("");
    const [tpPrice, setTpPrice] = useState(grid.tp || "");
    const [slPrice, setSlPrice] = useState(grid.sl || "");

    const realized = grid.realizedProfit || 0;
    const unrealized = calculatePnL(grid, currentPrice);
    const totalProfit = realized + unrealized;
    const totalRate = grid.amount > 0 ? (totalProfit / grid.amount) * 100 : 0;

    // Handlers 預留
    const handleUpdateMargin = () => {
        if (!marginAdd || isNaN(marginAdd)) return alert("請輸入有效的金額");
        console.log(`增加保證金: ${marginAdd} for grid ${grid.id}`);
        alert("保證金已增加 (功能對接中)");
        setMarginAdd("");
    };

    const handleUpdateTPSL = () => {
        console.log(`更新止盈: ${tpPrice}, 止損: ${slPrice} for grid ${grid.id}`);
        alert("止盈止損已更新 (功能對接中)");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#1e2329] rounded-xl overflow-hidden shadow-2xl border border-[#2b3139] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-[#2b3139] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h2 className="text-md font-bold text-[#eaecef]">策略調整 - {grid.symbol}</h2>
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#2b3139] text-[#f0b90b] border border-[#f0b90b]/30 rounded">
                            {grid.mode === 'grid_spot' ? '現貨網格' : '合約網格'}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-[#848e9c] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {/* 盈虧摘要 */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-[#161a1e] p-3 rounded-lg border border-[#2b3139]">
                            <div className="text-[11px] text-[#848e9c] mb-1">網格利潤 (USDT)</div>
                            <div className="text-md font-bold text-[#089981]">+{realized.toFixed(4)}</div>
                        </div>
                        <div className="bg-[#161a1e] p-3 rounded-lg border border-[#2b3139]">
                            <div className="text-[11px] text-[#848e9c] mb-1">趨勢盈虧 (USDT)</div>
                            <div className={`text-md font-bold ${unrealized >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                {unrealized >= 0 ? '+' : ''}{unrealized.toFixed(4)}
                            </div>
                        </div>
                    </div>

                    {/* 調整模組 1: 增加保證金 */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-[#eaecef]">
                            <ShieldPlus size={16} className="text-[#f0b90b]"/> 調整投入金額 (保證金)
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="number" 
                                    value={marginAdd}
                                    onChange={(e) => setMarginAdd(e.target.value)}
                                    placeholder="增加金額..."
                                    className="w-full bg-[#0b0e11] border border-[#474d57] rounded px-3 py-2 text-sm focus:border-[#f0b90b] outline-none transition-all"
                                />
                                <span className="absolute right-3 top-2 text-[10px] text-[#848e9c]">USDT</span>
                            </div>
                            <button 
                                onClick={handleUpdateMargin}
                                className="bg-[#f0b90b] text-black px-4 py-2 rounded text-sm font-bold hover:bg-[#e0a808] transition-colors"
                            >
                                確認
                            </button>
                        </div>
                        <p className="mt-2 text-[10px] text-[#848e9c] flex items-center gap-1">
                            <Info size={10}/> 增加投入金額可降低強平風險，但不會改變網格價格間距。
                        </p>
                    </div>

                    {/* 調整模組 2: 止盈止損 */}
                    <div className="mb-2">
                        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-[#eaecef]">
                            <Target size={16} className="text-[#f0b90b]"/> 策略止盈止損
                        </div>
                        <div className="space-y-4 bg-[#161a1e] p-4 rounded-lg border border-[#2b3139]">
                            <div>
                                <label className="block text-[11px] text-[#848e9c] mb-1.5">止盈觸發價格 (USDT)</label>
                                <input 
                                    type="number" 
                                    value={tpPrice}
                                    onChange={(e) => setTpPrice(e.target.value)}
                                    placeholder="未設置"
                                    className="w-full bg-[#1e2329] border border-[#474d57] rounded px-3 py-2 text-sm focus:border-[#089981] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-[#848e9c] mb-1.5">止損觸發價格 (USDT)</label>
                                <input 
                                    type="number" 
                                    value={slPrice}
                                    onChange={(e) => setSlPrice(e.target.value)}
                                    placeholder="未設置"
                                    className="w-full bg-[#1e2329] border border-[#474d57] rounded px-3 py-2 text-sm focus:border-[#F23645] outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleUpdateTPSL}
                                className="w-full bg-[#2b3139] border border-[#474d57] text-[#eaecef] py-2 rounded text-sm font-bold hover:bg-[#363c45] transition-colors"
                            >
                                保存止盈止損設置
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Footer */}
                <div className="p-4 border-t border-[#2b3139] bg-[#161a1e]">
                    <button 
                        onClick={() => { closePosition(grid.id); onClose(); }}
                        className="w-full bg-[#F23645]/10 border border-[#F23645]/30 text-[#F23645] hover:bg-[#F23645] hover:text-white py-2.5 rounded text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <AlertOctagon size={16}/> 立即終止策略
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GridDetails;