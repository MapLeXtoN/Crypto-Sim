// src/components/Tradingpanel/Transactiondetails.jsx
import React from 'react';
import SpotMarket from "./SpotMarket";
import FuturesTrading from './FuturesTrading';

const Transactiondetails = ({ 
    mainTab, setMainTab, subTab, setSubTab, 
    filteredData, currentPrice, closePosition, cancelOrder, calculatePnL, 
    // 🔥 接收 marketPrices
    marketPrices = {} 
}) => {

    return (
        <div className="h-72 bg-[#1e2329] flex flex-col border-t border-[#2b3139]">
            {/* 切換模式 */}
            <div className="flex items-center px-4 py-2 border-b border-[#2b3139] bg-[#161a1e]">
                <div className="flex bg-[#0b0e11] p-1 rounded">
                    <button 
                        onClick={() => { setMainTab('spot'); setSubTab('positions'); }} 
                        className={`px-4 py-1 text-xs rounded transition-all ${mainTab === 'spot' ? 'bg-[#f0b90b] text-black font-bold' : 'text-[#848e9c] hover:text-[#eaecef]'}`}
                    >
                        現貨帳戶 (Spot)
                    </button>
                    <button 
                        onClick={() => { setMainTab('futures'); setSubTab('positions'); }} 
                        className={`px-4 py-1 text-xs rounded transition-all ${mainTab === 'futures' ? 'bg-[#f0b90b] text-black font-bold' : 'text-[#848e9c] hover:text-[#eaecef]'}`}
                    >
                        合約帳戶 (Futures)
                    </button>
                </div>
            </div>

            {/* 功能頁籤 */}
            <div className="flex items-center gap-6 px-4 border-b border-[#2b3139] bg-[#1e2329]">
                <button onClick={() => setSubTab('positions')} className={`py-2 text-sm font-bold border-b-2 transition-colors ${subTab === 'positions' ? 'text-[#f0b90b] border-[#f0b90b]' : 'text-[#848e9c] border-transparent hover:text-[#eaecef]'}`}>{mainTab === 'spot' ? '持有資產 (Assets)' : '當前倉位 (Positions)'}</button>
                <button onClick={() => setSubTab('orders')} className={`py-2 text-sm font-bold border-b-2 transition-colors ${subTab === 'orders' ? 'text-[#f0b90b] border-[#f0b90b]' : 'text-[#848e9c] border-transparent hover:text-[#eaecef]'}`}>當前掛單 (Open Orders)</button>
                <button onClick={() => setSubTab('history')} className={`py-2 text-sm font-bold border-b-2 transition-colors ${subTab === 'history' ? 'text-[#f0b90b] border-[#f0b90b]' : 'text-[#848e9c] border-transparent hover:text-[#eaecef]'}`}>歷史紀錄 (History)</button>
                <button onClick={() => setSubTab('bot')} className={`py-2 text-sm font-bold border-b-2 transition-colors ${subTab === 'bot' ? 'text-[#f0b90b] border-[#f0b90b]' : 'text-[#848e9c] border-transparent hover:text-[#eaecef]'}`}>機器人 (Bot)</button>
            </div>

            {/* 內容顯示區 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {mainTab === 'spot' ? (
                    <SpotMarket 
                        subTab={subTab} 
                        data={filteredData.data} 
                        currentPrice={currentPrice}
                        cancelOrder={cancelOrder}
                        closePosition={closePosition}
                        calculatePnL={calculatePnL}
                        // 🔥 傳下去
                        marketPrices={marketPrices}
                    />
                ) : (
                    <FuturesTrading 
                        subTab={subTab} 
                        data={filteredData.data} 
                        currentPrice={currentPrice}
                        cancelOrder={cancelOrder}
                        closePosition={closePosition}
                        calculatePnL={calculatePnL}
                        // 🔥 傳下去
                        marketPrices={marketPrices}
                    />
                )}
            </div>
        </div>
    );
};

export default Transactiondetails;