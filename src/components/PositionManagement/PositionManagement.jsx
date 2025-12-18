// src/components/PositionManagement/PositionManagement.jsx
import React, { useState } from 'react';
import { LayoutList, BarChart2, Grid3X3 } from 'lucide-react';

// 🔥 修正引用路徑：
// 假設 SpotGrid 和 FuturesGrid 都在同一個 PositionManagement 資料夾內
import SpotGrid from './SpotGrid'; 
import FuturesGrid from './FuturesGrid'; // 修改這裡：從 '../TradingPanel/FuturesGrid' 改為 './FuturesGrid'

// 假設 SpotView 和 FuturesView 仍在 TradingPanel 資料夾內
import SpotView from './SpotMarket'; 
import FuturesView from './FuturesTrading'; 

const TransactionDetails = ({ 
    filteredData, currentPrice, closePosition, cancelOrder, calculatePnL, symbol
}) => {
    
    // --- 以下邏輯保持不變 ---
    const [category, setCategory] = useState('spot'); 
    const [gridType, setGridType] = useState('spot'); 
    const [subTab, setSubTab] = useState('positions'); 

    const safeData = filteredData?.data || { pos: [], ord: [], history: [] };

    const getTabClass = (active) => 
        `flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer border-b-2 transition-colors ${
            active 
            ? 'text-[#f0b90b] border-[#f0b90b] bg-[#1e2329]' 
            : 'text-[#848e9c] border-transparent hover:text-[#eaecef] bg-[#161a1e]'
        }`;

    return (
        <div className="h-64 bg-[#1e2329] border-t border-[#2b3139] flex flex-col">
            
            {/* 1. 頂部主導航 */}
            <div className="flex items-center border-b border-[#2b3139]">
                <div onClick={() => setCategory('spot')} className={getTabClass(category === 'spot')}>
                    <LayoutList size={16}/> 交易 (現貨)
                </div>
                <div onClick={() => setCategory('futures')} className={getTabClass(category === 'futures')}>
                    <BarChart2 size={16}/> 合約
                </div>
                <div onClick={() => setCategory('grid')} className={getTabClass(category === 'grid')}>
                    <Grid3X3 size={16}/> 網格策略
                </div>
            </div>

            {/* 2. 次級控制列 */}
            <div className="px-4 py-2 border-b border-[#2b3139] bg-[#1e2329] flex items-center justify-between min-h-[40px]">
                {category === 'grid' ? (
                    <div className="flex bg-[#0b0e11] rounded p-0.5">
                        <button 
                            onClick={() => setGridType('spot')}
                            className={`px-4 py-1 text-xs rounded transition-all ${gridType === 'spot' ? 'bg-[#2b3139] text-[#eaecef] font-bold shadow' : 'text-[#848e9c] hover:text-[#eaecef]'}`}
                        >
                            現貨網格
                        </button>
                        <button 
                            onClick={() => setGridType('futures')}
                            className={`px-4 py-1 text-xs rounded transition-all ${gridType === 'futures' ? 'bg-[#2b3139] text-[#eaecef] font-bold shadow' : 'text-[#848e9c] hover:text-[#eaecef]'}`}
                        >
                            合約網格
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-6">
                        <button onClick={() => setSubTab('positions')} className={`text-xs font-bold transition-colors ${subTab === 'positions' ? 'text-[#f0b90b]' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>當前持倉</button>
                        <button onClick={() => setSubTab('orders')} className={`text-xs font-bold transition-colors ${subTab === 'orders' ? 'text-[#f0b90b]' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>當前掛單</button>
                        <button onClick={() => setSubTab('history')} className={`text-xs font-bold transition-colors ${subTab === 'history' ? 'text-[#f0b90b]' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>歷史紀錄</button>
                    </div>
                )}
            </div>

            {/* 3. 內容區域 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {category === 'spot' && (
                    <SpotView 
                        subTab={subTab} data={safeData} currentPrice={currentPrice} 
                        cancelOrder={cancelOrder} closePosition={closePosition} symbol={symbol} 
                    />
                )}

                {category === 'futures' && (
                    <FuturesView 
                        subTab={subTab} data={safeData} currentPrice={currentPrice} 
                        cancelOrder={cancelOrder} closePosition={closePosition} calculatePnL={calculatePnL} symbol={symbol} 
                    />
                )}

                {category === 'grid' && (
                    <>
                        {gridType === 'spot' ? (
                            <SpotGrid 
                                data={safeData} currentPrice={currentPrice} 
                                closePosition={closePosition} calculatePnL={calculatePnL} symbol={symbol} 
                            />
                        ) : (
                            <FuturesGrid 
                                data={safeData} currentPrice={currentPrice} 
                                closePosition={closePosition} calculatePnL={calculatePnL} symbol={symbol} 
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TransactionDetails;