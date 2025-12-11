import React from 'react';
import { ChevronDown, DollarSign, Coins } from 'lucide-react';
import { SYMBOLS } from '../constants'; // 引用設定

const TradingPanel = ({
    tradeMode, setTradeMode, symbol, setSymbol, side, setSide,
    orderType, setOrderType, priceInput, setPriceInput, currentPrice,
    amount, setAmount, amountType, setAmountType,
    leverage, setLeverage, balance, handleTrade,
    gridLevels, setGridLevels, gridDirection, setGridDirection,
    gridLowerPrice, setGridLowerPrice, gridUpperPrice, setGridUpperPrice,
    reserveMargin, setReserveMargin
}) => {
    return (
        <div className="w-72 bg-[#1e2329] border-l border-[#2b3139] flex flex-col p-3 gap-3 z-30" style={{ cursor: 'default' }}>
           <div className="flex bg-[#0b0e11] p-1 rounded-md">
            {['spot', 'futures', 'grid'].map(m => (
              <button key={m} onClick={() => setTradeMode(m)} className={`flex-1 py-1.5 text-xs capitalize rounded-sm transition-colors ${tradeMode === m ? 'bg-[#2b3139] text-[#eaecef] font-medium' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>{m === 'spot' ? '現貨' : m === 'futures' ? '合約' : '網格'}</button>
            ))}
          </div>

          {tradeMode !== 'grid' && (
            <div className="flex gap-2">
              <button onClick={() => setSide('long')} className={`flex-1 py-2 rounded-sm font-bold text-sm transition-all ${side === 'long' ? 'bg-[#089981] text-white' : 'bg-[#2b3139] text-[#848e9c]'}`}>{tradeMode === 'spot' ? '買入 (Buy)' : '做多 (Long)'}</button>
              <button onClick={() => setSide('short')} className={`flex-1 py-2 rounded-sm font-bold text-sm transition-all ${side === 'short' ? 'bg-[#F23645] text-white' : 'bg-[#2b3139] text-[#848e9c]'}`}>{tradeMode === 'spot' ? '賣出 (Sell)' : '做空 (Short)'}</button>
            </div>
          )}
          
          <div className="space-y-4 mt-2">
            {tradeMode !== 'grid' && (
                <>
                    <div className="flex bg-[#2b3139] rounded-sm p-0.5"><button onClick={() => setOrderType('limit')} className={`flex-1 py-1 text-xs rounded-sm ${orderType === 'limit' ? 'bg-[#474d57] text-white' : 'text-[#848e9c]'}`}>限價</button><button onClick={() => setOrderType('market')} className={`flex-1 py-1 text-xs rounded-sm ${orderType === 'market' ? 'bg-[#474d57] text-white' : 'text-[#848e9c]'}`}>市價</button></div>
                    <div>
                        <div className="flex justify-between text-xs text-[#848e9c] mb-1"><span>價格</span> <span className="cursor-pointer hover:text-white" onClick={() => setPriceInput(currentPrice.toFixed(2))}>最新: {currentPrice.toFixed(2)}</span></div>
                        <div className="relative"><input type="number" disabled={orderType === 'market'} value={orderType === 'market' ? currentPrice.toFixed(2) : priceInput} onChange={e => setPriceInput(e.target.value)} className={`w-full bg-[#2b3139] border border-[#474d57] rounded-sm p-2 text-right text-white text-sm focus:border-[#f0b90b] outline-none ${orderType === 'market' ? 'opacity-50 cursor-not-allowed' : ''}`} /><span className="absolute left-2 top-2 text-xs text-[#848e9c]">USDT</span></div>
                    </div>
                </>
            )}

            {tradeMode === 'grid' && (
              <div className="space-y-3">
                <div><div className="text-xs text-[#848e9c] mb-1">幣種選擇</div><div className="relative"><select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full bg-[#2b3139] border border-[#474d57] rounded-sm p-2 text-white text-sm focus:border-[#f0b90b] outline-none appearance-none">{SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown className="absolute right-2 top-2.5 text-[#848e9c] pointer-events-none" size={14}/></div></div>
                <div><div className="text-xs text-[#848e9c] mb-1">開單方向</div><select value={gridDirection} onChange={(e) => setGridDirection(e.target.value)} className="w-full bg-[#2b3139] border border-[#474d57] rounded-sm p-2 text-white text-sm focus:border-[#f0b90b] outline-none appearance-none"><option value="long">做多 (Long)</option><option value="short">做空 (Short)</option><option value="neutral">中性 (Neutral)</option></select></div>
                <div className="flex gap-2">
                    <div className="flex-1"><div className="text-xs text-[#848e9c] mb-1">最低價</div><input type="number" value={gridLowerPrice} onChange={e => setGridLowerPrice(e.target.value)} className="w-full bg-[#2b3139] border border-[#474d57] rounded-sm p-2 text-white text-sm outline-none focus:border-[#f0b90b]"/></div>
                    <div className="flex-1"><div className="text-xs text-[#848e9c] mb-1">最高價</div><input type="number" value={gridUpperPrice} onChange={e => setGridUpperPrice(e.target.value)} className="w-full bg-[#2b3139] border border-[#474d57] rounded-sm p-2 text-white text-sm outline-none focus:border-[#f0b90b]"/></div>
                </div>
                <div><div className="text-xs text-[#848e9c] mb-1">設定網格數量</div><input type="number" value={gridLevels} onChange={e => setGridLevels(Number(e.target.value))} className="w-full bg-[#2b3139] border border-[#474d57] rounded-sm p-2 text-white text-sm outline-none focus:border-[#f0b90b]" placeholder="輸入數量"/></div>
                <div>
                    <div className="text-xs text-[#848e9c] mb-1">調整槓桿倍數</div>
                    <div className="flex items-center gap-2"><input type="range" min="1" max="125" value={leverage} onChange={e => setLeverage(Number(e.target.value))} className="flex-1 h-1 bg-[#474d57] rounded-lg appearance-none cursor-pointer accent-[#f0b90b]" /><span className="text-[#f0b90b] text-sm font-bold w-8 text-right">{leverage}x</span></div>
                </div>
                <div>
                    <div className="text-xs text-[#848e9c] mb-1">輸入投資額</div>
                    <div className="relative"><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="總投資額" className="w-full bg-[#2b3139] border border-[#474d57] rounded-sm p-2 text-right text-white text-sm focus:border-[#f0b90b] outline-none" /><span className="absolute left-2 top-2 text-xs text-[#848e9c]">USDT</span></div>
                    <div className="flex items-center gap-2 mt-2"><input type="checkbox" id="reserveMargin" checked={reserveMargin} onChange={(e) => setReserveMargin(e.target.checked)} className="w-3 h-3 accent-[#f0b90b] cursor-pointer"/><label htmlFor="reserveMargin" className="text-xs text-[#848e9c] cursor-pointer select-none">預留保證金</label></div>
                </div>
              </div>
            )}

            {tradeMode !== 'grid' && (
                <div>
                <div className="flex justify-between items-center text-xs text-[#848e9c] mb-1"><span>數量</span><div className="flex gap-2 text-[10px]"><span onClick={() => setAmountType('usdt')} className={`cursor-pointer ${amountType === 'usdt' ? 'text-[#f0b90b] font-bold' : ''}`}>USDT</span>/<span onClick={() => setAmountType('coin')} className={`cursor-pointer ${amountType === 'coin' ? 'text-[#f0b90b] font-bold' : ''}`}>{symbol.replace('USDT', '')}</span></div></div>
                <div className="relative"><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={amountType === 'usdt' ? "成交額" : "數量"} className="w-full bg-[#2b3139] border border-[#474d57] rounded-sm p-2 text-right text-white text-sm focus:border-[#f0b90b] outline-none" /><span className="absolute left-2 top-2 text-xs text-[#848e9c]">{amountType === 'usdt' ? <DollarSign size={12}/> : <Coins size={12}/>}</span></div>
                </div>
            )}

            {tradeMode !== 'grid' && (<div className="text-right text-[10px] text-[#848e9c] mt-1">可用資金: {Math.floor(balance).toLocaleString()} USDT</div>)}

            {tradeMode === 'futures' && (<div><div className="flex justify-between text-xs text-[#848e9c] mb-1"><span>槓桿倍數</span> <span className="text-[#f0b90b]">{leverage}x</span></div><input type="range" min="1" max="125" value={leverage} onChange={e => setLeverage(Number(e.target.value))} className="w-full h-1 bg-[#474d57] rounded-lg appearance-none cursor-pointer accent-[#f0b90b]" /></div>)}

            <button onClick={handleTrade} className={`w-full py-3 rounded-sm font-bold text-sm shadow-md mt-4 transition-transform active:scale-95 ${tradeMode === 'grid' ? 'bg-[#f0b90b] hover:bg-[#d9a506] text-black' : (side === 'long' ? 'bg-[#089981] hover:bg-[#067a65] text-white' : 'bg-[#F23645] hover:bg-[#c92533] text-white')}`}>
              {tradeMode === 'grid' ? '創建網格策略 (Create Grid)' : tradeMode === 'spot' ? (side === 'long' ? '買入 (Buy)' : '賣出 (Sell)') : (side === 'long' ? '做多 (Long)' : '做空 (Short)')} {tradeMode !== 'grid' && ` (${orderType === 'limit' ? '限價' : '市價'})`}
            </button>
          </div>
        </div>
    );
};

export default TradingPanel;