// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { INITIAL_BALANCE } from "./constants";
// import { generateMockData } from "./utils"; // 暫時沒用到

import LoginView from "./components/LoginView";
import Header from "./components/TOP/Header";
import ChartContainer from "./components/chart/ChartContainer";
import TransactionDetails from "./components/PositionManagement/PositionManagement";
import TradingPanel from "./components/Tradingpanel/TradingPanel";
import GridStrategyDetails from "./components/PositionManagement/GridStrategyDetails";
import GridDetails from "./components/PositionManagement/Griddetails"; 
import { useFuturesTradingLogic } from "./components/PositionManagement/FuturesTradingLogic";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1d"); 
  const [currentPrice, setCurrentPrice] = useState(0);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  
  const [positions, setPositions] = useState([]); 
  const [orders, setOrders] = useState([]);       
  const [history, setHistory] = useState([]);     
  const [klineData, setKlineData] = useState([]);
  
  const [currentView, setCurrentView] = useState("dashboard");
  const [activeGridId, setActiveGridId] = useState(null);
  const [showGridSettings, setShowGridSettings] = useState(false);
  
  const lastPriceRef = useRef(0);

  const [feeSettings, setFeeSettings] = useState({
      vipLevel: "VIP0", 
      spotMaker: 0.1, 
      spotTaker: 0.1, 
      futuresMaker: 0.02, 
      futuresTaker: 0.05, 
      fundingRate: 0.01
  });

  const [selectedExchange, setSelectedExchange] = useState("Binance");

  const [tradeMode, setTradeMode] = useState("spot");
  const [side, setSide] = useState("long");
  const [amount, setAmount] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [futuresInputMode, setFuturesInputMode] = useState("value");

  const [gridType, setGridType] = useState("spot"); 
  const [gridLevels, setGridLevels] = useState(10);
  const [gridDirection, setGridDirection] = useState("neutral"); 
  const [reserveMargin, setReserveMargin] = useState(false);
  const [gridLowerPrice, setGridLowerPrice] = useState("");
  const [gridUpperPrice, setGridUpperPrice] = useState("");
  const [orderType, setOrderType] = useState("limit"); 
  const [amountType, setAmountType] = useState("usdt"); 
  const [priceInput, setPriceInput] = useState("");
  
  const [mainTab, setMainTab] = useState("spot"); 
  const [subTab, setSubTab] = useState("orders");
  
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [favorites, setFavorites] = useState(["15m", "1h", "4h", "1d"]);
  const [apiError, setApiError] = useState(false);
  const [loading, setLoading] = useState(true);

  const { 
    handleFuturesTrade, 
    calculateFuturesPnL, 
    closeFuturesPosition, 
    cancelFuturesOrder,
    updateFuturesOrder 
  } = useFuturesTradingLogic({
    currentPrice, balance, setBalance, positions, setPositions, orders, setOrders, history, setHistory, symbol,
    feeSettings, selectedExchange 
  });

  const activeGrid = positions.find(p => p.id === activeGridId) || null;

  const spotPositions = positions.filter(p => p.mode === "spot");
  const groupedCoins = spotPositions.reduce((acc, p) => {
    const sym = p.symbol.replace("USDT", "");
    if (!acc[sym]) acc[sym] = { symbol: sym, totalSize: 0, totalAmount: 0 };
    acc[sym].totalSize += p.size;
    acc[sym].totalAmount += p.amount;
    return acc;
  }, {});

  const heldCoins = Object.values(groupedCoins).map(item => ({
    symbol: item.symbol,
    quantity: item.totalSize,
    avgPrice: item.totalAmount / item.totalSize
  }));

  const [panelWidth, setPanelWidth] = useState(320);
  const panelRef = useRef(null);
  const isResizing = useRef(false);

  const startResizing = useCallback(() => {
      isResizing.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.body.classList.add("resizing"); 
  }, []);

  const stopResizing = useCallback(() => {
      if (isResizing.current) {
          isResizing.current = false;
          document.body.style.cursor = "default";
          document.body.style.userSelect = "auto";
          document.body.classList.remove("resizing");
          if (panelRef.current) setPanelWidth(panelRef.current.clientWidth);
      }
  }, []);

  const resize = useCallback((e) => {
      if (isResizing.current && panelRef.current) {
          requestAnimationFrame(() => {
              const newWidth = window.innerWidth - e.clientX;
              if (newWidth > 250 && newWidth < 800) {
                  panelRef.current.style.width = `${newWidth}px`;
              }
          });
      }
  }, []);

  useEffect(() => {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      return () => {
          window.removeEventListener("mousemove", resize);
          window.removeEventListener("mouseup", stopResizing);
      };
  }, [resize, stopResizing]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
        if (user) {
            try {
                const docSnap = await getDoc(doc(db, "users", user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setBalance(data.balance || INITIAL_BALANCE);
                    setPositions((data.positions || []).filter(p => p && p.id));
                    setOrders(data.orders || []);
                    setHistory((data.history || []).slice(0, 100));
                    if (data.favorites) setFavorites(data.favorites);
                    if (data.feeSettings) setFeeSettings(data.feeSettings);
                    if (data.selectedExchange) setSelectedExchange(data.selectedExchange);
                }
            } catch (err) {}
        }
    };
    loadUserData();
  }, [user]);

  useEffect(() => {
    if (user && !authLoading) {
        const timer = setTimeout(async () => {
            try {
                await updateDoc(doc(db, "users", user.uid), { 
                    balance, positions, orders, history: history.slice(0, 100), favorites, feeSettings, selectedExchange
                });
            } catch (err) {}
        }, 2000); 
        return () => clearTimeout(timer);
    }
  }, [balance, positions, orders, history, favorites, feeSettings, user, authLoading, selectedExchange]);

  const toggleFavorite = (interval) => {
      setFavorites(prev => prev.includes(interval) ? prev.filter(i => i !== interval) : [...prev, interval]);
  };

  const resetAccount = async (resetBalance = true, clearHistory = true) => {
      if (resetBalance) setBalance(INITIAL_BALANCE);
      if (clearHistory) { setPositions([]); setOrders([]); setHistory([]); setActiveGridId(null); }
      if (user) {
          try {
              await updateDoc(doc(db, "users", user.uid), {
                  balance: resetBalance ? INITIAL_BALANCE : balance,
                  positions: clearHistory ? [] : positions,
                  orders: clearHistory ? [] : orders,
                  history: clearHistory ? [] : history
              });
          } catch (e) {}
      }
  };

  useEffect(() => {
    if (!currentPrice || orders.length === 0) return;
    let hasChanges = false;
    const filledOrders = [];
    const remainingOrders = [];

    orders.forEach(order => {
        if (order.status !== "pending" || order.mode === "futures") {
            remainingOrders.push(order);
            return;
        }
        let isFilled = false;
        const pCurrent = parseFloat(currentPrice);
        const pOrder = parseFloat(order.price);
        if (order.triggerCondition === "gte" && pCurrent >= pOrder) isFilled = true;
        else if (order.triggerCondition === "lte" && pCurrent <= pOrder) isFilled = true;

        if (isFilled) { hasChanges = true; filledOrders.push(order); } 
        else remainingOrders.push(order);
    });

    if (hasChanges) {
        setOrders(remainingOrders);
        const newPositions = filledOrders.map(o => ({
            id: Date.now() + Math.random(),
            symbol: o.symbol, mode: o.mode, side: o.side, entryPrice: parseFloat(o.price),
            amount: o.amount, size: o.size, leverage: 1, margin: o.amount,
            tp: o.tp || null, sl: o.sl || null, time: new Date().toLocaleString(),
            exchange: o.exchange, feeRate: o.feeRate, entryFee: o.entryFee 
        }));
        setPositions(prev => [...newPositions, ...prev]);
        setHistory(prev => [...filledOrders.map(o => ({ ...o, status: "filled", exitTime: new Date().toLocaleString(), type: "order_filled", pnl: 0 })), ...prev]);
    }
  }, [currentPrice, orders]);

  // =================================================================
  // 🔥 [修正] 網格策略撮合引擎 (Grid Matching Engine)
  // =================================================================
  useEffect(() => {
    if (!currentPrice || positions.length === 0) return;

    const prevPrice = lastPriceRef.current;
    
    if (prevPrice === 0 || prevPrice === currentPrice) {
        lastPriceRef.current = currentPrice;
        return;
    }

    let hasUpdates = false;
    
    const updatedPositions = positions.map(pos => {
        if (pos.mode !== 'grid_spot' && pos.mode !== 'grid_futures') return pos;

        const lower = parseFloat(pos.gridLower);
        const upper = parseFloat(pos.gridUpper);
        const levels = parseInt(pos.gridLevels);
        
        if (currentPrice < lower || currentPrice > upper) return pos;

        const step = (upper - lower) / levels;
        
        // 🔥 [修正] 利潤計算邏輯：改為 (每格幣數 x 網格間距)
        // 這樣利潤才會是恆定的，不會因為現價變動而忽大忽小
        // 如果是舊的單沒有 unitPerGrid，使用後備算法
        const unitSize = pos.unitPerGrid || (pos.size / levels); 
        const profitPerOneMatch = unitSize * step; 

        let crossedLines = 0;
        
        for (let i = 1; i < levels; i++) {
            const gridLine = lower + (i * step);
            if (
                (prevPrice < gridLine && currentPrice >= gridLine) || 
                (prevPrice > gridLine && currentPrice <= gridLine)    
            ) {
                crossedLines++;
            }
        }

        if (crossedLines > 0) {
            hasUpdates = true;
            return {
                ...pos,
                matchedCount: (pos.matchedCount || 0) + crossedLines,
                realizedProfit: (pos.realizedProfit || 0) + (profitPerOneMatch * crossedLines)
            };
        }

        return pos;
    });

    if (hasUpdates) {
        setPositions(updatedPositions);
    }

    lastPriceRef.current = currentPrice;
  }, [currentPrice, positions]);
  // =================================================================

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const res = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=500`, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const rawData = await res.json();
        if (Array.isArray(rawData) && isMounted) {
            const formatted = rawData.map(d => ({ timestamp: parseInt(d[0]), open: parseFloat(d[1]), high: parseFloat(d[2]), low: parseFloat(d[3]), close: parseFloat(d[4]), volume: parseFloat(d[5]) }));
            setKlineData(formatted);
            const newPrice = formatted[formatted.length - 1].close;
            setCurrentPrice(newPrice);
            setLoading(false);
        }
      } catch (err) { if (isMounted) setApiError(true); }
    };
    fetchData(); const timer = setInterval(fetchData, 5000); 
    return () => { isMounted = false; clearInterval(timer); controller.abort(); };
  }, [symbol, timeframe]);

  const handleTrade = (advancedParams = {}) => {
    if (!currentPrice) return alert("價格載入中...");
    const { takeProfit, stopLoss } = advancedParams;
    
    if (tradeMode === "grid") {
        const lower = parseFloat(gridLowerPrice);
        const upper = parseFloat(gridUpperPrice);
        const levels = parseInt(gridLevels);
        const inv = parseFloat(amount);

        if (!lower || !upper || !levels || !inv || lower >= upper) {
            return alert("請填寫完整的網格參數 (價格區間、數量、投資額)");
        }
        if (inv > balance) return alert("可用餘額不足");

        const calculatedSize = gridType === "spot" 
            ? inv / currentPrice 
            : (inv * leverage) / currentPrice;
        
        // 🔥 [修正] 計算並儲存每格的幣數 (unitPerGrid) 和金額 (pricePerGrid)
        // 這是為了解決你說的「看不到網格掛單金額」以及「利潤計算錯誤」的問題
        const unitPerGrid = calculatedSize / levels;
        const pricePerGrid = inv / levels;

        const newGridPos = {
            id: Date.now(),
            symbol,
            mode: gridType === "spot" ? "grid_spot" : "grid_futures",
            gridType,
            gridDirection,
            entryPrice: currentPrice,
            gridLower: lower,
            gridUpper: upper,
            gridLevels: levels,
            amount: inv,
            size: calculatedSize,
            unitPerGrid: unitPerGrid, // 🔥 存入每格幣數 (Quant運算用)
            pricePerGrid: pricePerGrid, // 🔥 存入每格USDT (顯示用)
            leverage: gridType === "futures" ? leverage : 1,
            matchedCount: 0,
            realizedProfit: 0,
            status: "running",
            time: new Date().toLocaleString(), // 這裡已經是正確的格式
            exchange: selectedExchange,
            gridLines: []
        };

        setPositions(prev => [newGridPos, ...prev]);
        setBalance(p => p - inv);
        setAmount("");
        alert(`成功啟動 ${gridType === "spot" ? "現貨" : "合約"} 網格策略`);
        return;
    }
    
    if (tradeMode === "futures") {
        const success = handleFuturesTrade({ side, amount, amountType, orderType, priceInput, leverage, futuresInputMode, takeProfit, stopLoss });
        if (success) setAmount("");
        return;
    }

    const executionPrice = orderType === "limit" ? parseFloat(priceInput) : currentPrice;
    const val = parseFloat(amount);
    if (!val || val <= 0) return alert("數量無效");

    const currentRate = orderType === "limit" ? feeSettings.spotMaker : feeSettings.spotTaker;
    let usdtValue = amountType === "usdt" ? val : val * executionPrice;
    let coinSize = amountType === "usdt" ? val / executionPrice : val;
    const entryFee = (usdtValue * currentRate) / 100;

    if (usdtValue + entryFee > balance) return alert("資金不足支付手續費！");

    const commonData = { exchange: selectedExchange, feeRate: currentRate };

    if (orderType === "limit") {
        setOrders(prev => [{ ...commonData, id: Date.now(), symbol, mode: "spot", type: "limit", side, price: executionPrice, amount: usdtValue, size: coinSize, status: "pending", time: new Date().toLocaleString(), triggerCondition: executionPrice >= currentPrice ? "gte" : "lte", entryFee }, ...prev]);
    } else {
        setPositions(prev => [{ ...commonData, id: Date.now(), symbol, mode: "spot", side, entryPrice: executionPrice, amount: usdtValue, size: coinSize, margin: usdtValue, time: new Date().toLocaleString(), entryFee }, ...prev]);
    }
    
    setBalance(p => p - (usdtValue + entryFee)); 
    setAmount("");
    if (side === "long") alert("買入成功");
  };

  const closePosition = (id) => {
    const pos = positions.find(p => p.id === id); if (!pos) return;
    if (pos.mode === "futures" || pos.mode === "grid_futures") { 
        if (pos.mode === "grid_futures") {
            setPositions(p => p.filter(x => x.id !== id));
            setBalance(p => p + pos.amount + (pos.realizedProfit || 0)); // 🔥 平倉時返還本金+網格利潤
            return;
        }
        closeFuturesPosition(pos); 
        return; 
    }
    
    const exitFee = (pos.size * currentPrice * (pos.feeRate || 0.1)) / 100;
    const pnl = (currentPrice - pos.entryPrice) * pos.size;
    
    setBalance(p => p + pos.margin + pnl - exitFee);
    
    // 🔥 [修正] 使用 toLocaleString() 包含日期
    // 這樣交易紀錄報表才不會只有時間
    setHistory(prev => [{ ...pos, closePrice: currentPrice, pnl: pnl - (pos.entryFee || 0) - exitFee, exitTime: new Date().toLocaleString(), type: "position" }, ...prev]);
    setPositions(p => p.filter(x => x.id !== id));
  };

  const cancelOrder = (id) => {
    const order = orders.find(o => o.id === id); if (!order) return;
    setBalance(p => p + (order.amount + (order.entryFee || 0)));
    setOrders(p => p.filter(x => x.id !== id));
  };

  const calculatePnL = (pos, price) => {
    if (pos.mode === "futures" || pos.mode === "grid_futures") return calculateFuturesPnL(pos, price);
    return (price - pos.entryPrice) * (pos.size || 0);
  };

  const equity = balance + positions.reduce((acc, pos) => acc + (pos.margin || 0) + calculatePnL(pos, currentPrice), 0);

  if (authLoading) return <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center text-white font-bold">同步中...</div>;
  if (!user) return <LoginView onLoginSuccess={setUser} />;

  return (
    <div className="flex flex-col h-screen bg-[#0b0e11] text-[#eaecef] overflow-hidden select-none">
      <Header symbol={symbol} setSymbol={setSymbol} currentPrice={currentPrice} equity={equity} balance={balance} user={user} setUser={setUser} resetAccount={resetAccount} history={history} positions={positions} feeSettings={feeSettings} setFeeSettings={setFeeSettings} selectedExchange={selectedExchange} setSelectedExchange={setSelectedExchange} heldCoins={heldCoins} />
      <div className="flex flex-1 overflow-hidden">
        <ChartContainer symbol={symbol} timeframe={timeframe} setTimeframe={setTimeframe} klineData={klineData} currentPrice={currentPrice} loading={loading} apiError={apiError} showTimeMenu={showTimeMenu} setShowTimeMenu={setShowTimeMenu} favorites={favorites} toggleFavorite={toggleFavorite} activeGrid={activeGrid} />
        <div className="w-1 bg-[#2b3139] hover:bg-[#f0b90b] cursor-col-resize z-50 transition-colors" onMouseDown={startResizing}></div>
        <div ref={panelRef} style={{ width: `${panelWidth}px`, flexShrink: 0 }}>
            <TradingPanel tradeMode={tradeMode} setTradeMode={setTradeMode} symbol={symbol} setSymbol={setSymbol} side={side} setSide={setSide} orderType={orderType} setOrderType={setOrderType} priceInput={priceInput} setPriceInput={setPriceInput} currentPrice={currentPrice} amount={amount} setAmount={setAmount} amountType={amountType} setAmountType={setAmountType} leverage={leverage} setLeverage={setLeverage} balance={balance} handleTrade={handleTrade} futuresInputMode={futuresInputMode} setFuturesInputMode={setFuturesInputMode} gridType={gridType} setGridType={setGridType} gridLevels={gridLevels} setGridLevels={setGridLevels} gridDirection={gridDirection} setGridDirection={setGridDirection} gridLowerPrice={gridLowerPrice} setGridLowerPrice={setGridLowerPrice} gridUpperPrice={gridUpperPrice} setGridUpperPrice={setGridUpperPrice} reserveMargin={reserveMargin} setReserveMargin={setReserveMargin} feeSettings={feeSettings} selectedExchange={selectedExchange} />
        </div>
      </div>
      
      <TransactionDetails 
          mainTab={mainTab} 
          setMainTab={setMainTab} 
          subTab={subTab} 
          setSubTab={setSubTab} 
          filteredData={{data:{pos:positions, ord:orders, history}}} 
          currentPrice={currentPrice} 
          closePosition={closePosition} 
          cancelOrder={cancelOrder} 
          calculatePnL={calculatePnL} 
          symbol={symbol} 
          onGridSelect={(id)=>{
              setActiveGridId(id); 
              setCurrentView("grid_details");
          }} 
          onGridSettings={(id) => {
              setActiveGridId(id);
              setShowGridSettings(true);
          }}
          activeGridId={activeGridId} 
          onUpdateFuturesOrder={updateFuturesOrder} 
      />

      {showGridSettings && activeGrid && (
          <GridDetails 
              grid={activeGrid}
              currentPrice={currentPrice}
              calculatePnL={calculatePnL}
              closePosition={closePosition}
              onClose={() => setShowGridSettings(false)}
          />
      )}

      {currentView === "grid_details" && activeGrid && (
          <div className="fixed inset-0 z-50 bg-[#0b0e11]">
               <GridStrategyDetails 
                   grid={activeGrid} 
                   currentPrice={currentPrice} 
                   onBack={() => setCurrentView("dashboard")} 
                   calculatePnL={calculatePnL} 
               />
          </div>
      )}
    </div>
  );
}