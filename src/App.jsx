// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { INITIAL_BALANCE } from "./constants";

import LoginView from "./components/LoginView";
import Header from "./components/TOP/Header";
import ChartContainer from "./components/chart/ChartContainer";
import TransactionDetails from "./components/PositionManagement/PositionManagement";
import TradingPanel from "./components/Tradingpanel/TradingPanel";
import GridStrategyDetails from "./components/PositionManagement/GridStrategyDetails";
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

  const currentCoinSymbol = symbol.replace("USDT", "");
  const currentHolding = heldCoins.find(c => c.symbol === currentCoinSymbol)?.quantity || 0;

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
                    setBalance(isNaN(data.balance) ? INITIAL_BALANCE : (data.balance || INITIAL_BALANCE));
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
                const safeBalance = isNaN(balance) ? INITIAL_BALANCE : balance;
                await updateDoc(doc(db, "users", user.uid), { 
                    balance: safeBalance, positions, orders, history: history.slice(0, 100), favorites, feeSettings, selectedExchange
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
  // 🔥 [核心修正 1] 切換幣種時，重置價格追蹤器
  // 這能防止 "BTC 90000 -> ETH 3000" 被誤判為暴跌，導致開單瞬間產生巨額利潤
  // =================================================================
  useEffect(() => {
      lastPriceRef.current = 0;
  }, [symbol]);

  // =================================================================
  // 網格策略撮合引擎
  // =================================================================
  useEffect(() => {
    // 🔥 確保 currentPrice 有效且大於 0
    if (!currentPrice || currentPrice <= 0 || positions.length === 0) return;

    const prevPrice = lastPriceRef.current;
    
    // 如果是第一次加載，或價格沒變，只更新 ref 並退出
    if (prevPrice === 0 || prevPrice === currentPrice) {
        lastPriceRef.current = currentPrice;
        return;
    }

    let hasUpdates = false;
    const newHistoryRecords = [];

    const updatedPositions = positions.map(pos => {
        if (pos.mode !== 'grid_spot' && pos.mode !== 'grid_futures') return pos;

        // 🔥 [核心修正 2] 嚴格檢查：只處理「當前幣種」的網格
        // 防止看 ETH 圖表時，錯誤地去撮合 BTC 的網格
        if (pos.symbol !== symbol) return pos;

        const lower = parseFloat(pos.gridLower);
        const upper = parseFloat(pos.gridUpper);
        const levels = parseInt(pos.gridLevels);
        
        if (currentPrice < lower || currentPrice > upper) return pos;

        const step = (upper - lower) / levels;
        const unitSize = pos.unitPerGrid || (pos.size / levels); 
        const profitPerOneMatch = unitSize * step; 

        let crossedLines = 0;
        
        for (let i = 1; i < levels; i++) {
            const gridLine = lower + (i * step);
            // 判斷價格是否穿過網格線
            if (
                (prevPrice < gridLine && currentPrice >= gridLine) || 
                (prevPrice > gridLine && currentPrice <= gridLine)    
            ) {
                crossedLines++;
            }
        }

        if (crossedLines > 0) {
            hasUpdates = true;
            const matchProfit = profitPerOneMatch * crossedLines;
            
            newHistoryRecords.push({
                id: Date.now() + Math.random(),
                time: new Date().toLocaleString(),
                exitTime: new Date().toLocaleString(),
                symbol: pos.symbol,
                mode: pos.mode,       
                gridType: pos.gridType,
                side: pos.gridDirection === 'long' ? 'long' : 'short',
                type: 'grid_match',   
                entryPrice: currentPrice - step, 
                price: currentPrice,             
                size: unitSize * crossedLines,
                amount: (unitSize * crossedLines) * currentPrice,
                pnl: matchProfit,    
                feeRate: 0,
                entryFee: 0,
                status: 'filled'
            });

            return {
                ...pos,
                matchedCount: (pos.matchedCount || 0) + crossedLines,
                realizedProfit: (pos.realizedProfit || 0) + matchProfit
            };
        }

        return pos;
    });

    if (hasUpdates) {
        setPositions(updatedPositions);
        setHistory(prev => [...newHistoryRecords, ...prev]);
    }

    lastPriceRef.current = currentPrice;
  }, [currentPrice, positions, symbol]); // 🔥 加入 symbol 依賴

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

  const toFixed4 = (num) => {
      return Math.floor(num * 10000) / 10000;
  };

  const handleTrade = (advancedParams = {}) => {
    if (!currentPrice) return alert("價格載入中...");
    const { takeProfit, stopLoss } = advancedParams;
    
    // --- 網格交易 ---
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
            margin: inv, 
            size: calculatedSize,
            unitPerGrid: unitPerGrid, 
            pricePerGrid: pricePerGrid, 
            leverage: gridType === "futures" ? leverage : 1,
            matchedCount: 0,
            realizedProfit: 0,
            status: "running",
            time: new Date().toLocaleString(),
            exchange: selectedExchange,
            gridLines: []
        };

        setPositions(prev => [newGridPos, ...prev]);
        setBalance(p => p - inv);
        setAmount("");
        alert(`成功啟動 ${gridType === "spot" ? "現貨" : "合約"} 網格策略`);
        return;
    }
    
    // --- 合約交易 ---
    if (tradeMode === "futures") {
        const success = handleFuturesTrade({ side, amount, amountType, orderType, priceInput, leverage, futuresInputMode, takeProfit, stopLoss });
        if (success) setAmount("");
        return;
    }

    // --- 現貨交易 (Spot) ---
    let executionPrice = currentPrice;
    if (orderType === "limit") {
        executionPrice = parseFloat(priceInput);
        if (!executionPrice || isNaN(executionPrice) || executionPrice <= 0) {
            return alert("請輸入有效的限價單價格！");
        }
    }

    const val = parseFloat(amount);
    if (!val || val <= 0) return alert("數量無效");

    const currentRate = orderType === "limit" ? feeSettings.spotMaker : feeSettings.spotTaker;
    const commonData = { exchange: selectedExchange, feeRate: currentRate };

    if (side === "long") {
        let coinSize = 0;
        let usdtValue = 0;

        if (amountType === "usdt") {
            let rawSize = val / executionPrice;
            coinSize = toFixed4(rawSize);
            usdtValue = coinSize * executionPrice;
        } else {
            coinSize = toFixed4(val);
            usdtValue = coinSize * executionPrice;
        }

        if (coinSize <= 0) return alert("購買數量過小 (需大於 0.0001)");

        const entryFee = (usdtValue * currentRate) / 100;

        if (isNaN(usdtValue) || isNaN(entryFee)) {
            return alert("金額計算錯誤，請檢查輸入數值");
        }

        if (usdtValue + entryFee > balance) return alert(`資金不足！需要 ${usdtValue + entryFee} USDT`);

        if (orderType === "limit") {
            setOrders(prev => [{ ...commonData, id: Date.now(), symbol, mode: "spot", type: "limit", side, price: executionPrice, amount: usdtValue, size: coinSize, status: "pending", time: new Date().toLocaleString(), triggerCondition: executionPrice >= currentPrice ? "gte" : "lte", entryFee }, ...prev]);
        } else {
            const newSpotPos = { ...commonData, id: Date.now(), symbol, mode: "spot", side, entryPrice: executionPrice, amount: usdtValue, size: coinSize, margin: usdtValue, time: new Date().toLocaleString(), entryFee };
            setPositions(prev => [newSpotPos, ...prev]);
            setHistory(prev => [{
                ...newSpotPos, 
                status: "filled", 
                exitTime: new Date().toLocaleString(), 
                type: "market_filled", 
                pnl: 0 
            }, ...prev]);
        }
        
        setBalance(p => p - (usdtValue + entryFee)); 
        setAmount("");
        alert(`買入成功: ${coinSize} ${symbol.replace("USDT","")}`);
    }
    else if (side === "short") {
        let sellSize = toFixed4(val);
        
        const heldPositions = positions.filter(p => p.mode === "spot" && p.symbol === symbol).sort((a, b) => a.id - b.id);
        const totalHeld = heldPositions.reduce((sum, p) => sum + p.size, 0);

        if (sellSize > totalHeld) {
            if (sellSize - totalHeld < 0.001) {
                sellSize = totalHeld; 
            } else {
                const coinName = symbol.replace("USDT", "");
                return alert(`持倉不足！您的 ${coinName} 餘額為: ${toFixed4(totalHeld)}, 欲賣出: ${sellSize}`);
            }
        }

        if (orderType === "limit") {
             const usdtValue = sellSize * executionPrice;
             if (isNaN(usdtValue)) return alert("金額計算錯誤");

             setOrders(prev => [{ ...commonData, id: Date.now(), symbol, mode: "spot", type: "limit", side: 'short', price: executionPrice, amount: usdtValue, size: sellSize, status: "pending", time: new Date().toLocaleString(), triggerCondition: executionPrice <= currentPrice ? "lte" : "gte" }, ...prev]);
             alert("限價賣單已掛出");
             setAmount("");
             return;
        }

        let remainingToSell = sellSize;
        let totalGetUSDT = 0;
        let newPositions = [...positions];
        let newHistory = [];

        for (let pos of heldPositions) {
            if (remainingToSell <= 0) break;
            
            let tradeSize = Math.min(pos.size, remainingToSell);
            
            if (Math.abs(pos.size - remainingToSell) < 0.00001) {
                tradeSize = pos.size;
            }

            const tradeVal = tradeSize * executionPrice;
            const tradeFee = tradeVal * currentRate / 100;
            const pnl = (executionPrice - pos.entryPrice) * tradeSize;

            totalGetUSDT += (tradeVal - tradeFee);

            newHistory.push({
                 ...pos,
                 id: Date.now() + Math.random(),
                 type: 'spot_sell',
                 status: 'filled',
                 exitTime: new Date().toLocaleString(),
                 price: executionPrice,
                 size: tradeSize,
                 amount: tradeVal,
                 pnl: pnl - tradeFee, 
                 fee: tradeFee,
                 side: 'sell' 
            });

            if (Math.abs(pos.size - tradeSize) < 0.0001) {
                newPositions = newPositions.filter(p => p.id !== pos.id);
            } else {
                newPositions = newPositions.map(p => p.id === pos.id ? {
                    ...p, 
                    size: p.size - tradeSize, 
                    amount: (p.size - tradeSize) * p.entryPrice 
                } : p);
            }

            remainingToSell -= tradeSize;
        }

        newPositions = newPositions.filter(p => p.size > 0.0001);

        setPositions(newPositions);
        setBalance(prev => prev + totalGetUSDT); 
        setHistory(prev => [...newHistory, ...prev]);
        setAmount("");
        alert(`賣出成功，獲得 ${totalGetUSDT.toFixed(2)} USDT`);
    }
  };

  const updateGridStrategy = useCallback((id, updates) => {
      const { marginAdd, tp, sl } = updates;
      const marginToAdd = parseFloat(marginAdd) || 0;

      if (marginToAdd > 0) {
          if (marginToAdd > balance) return alert("餘額不足以支付增加的保證金");
          setBalance(prev => prev - marginToAdd); 
      }

      setPositions(prev => prev.map(p => {
          if (p.id === id) {
              return {
                  ...p,
                  margin: (p.margin || 0) + marginToAdd, 
                  tp: tp || p.tp,
                  sl: sl || p.sl
              };
          }
          return p;
      }));
      alert("策略已更新！");
  }, [balance]);

  const closePosition = (id) => {
    const pos = positions.find(p => p.id === id); if (!pos) return;

    if (pos.mode === "futures") { 
        closeFuturesPosition(pos); 
        return; 
    }

    if (pos.mode === "grid_spot" || pos.mode === "grid_futures") {
        const isFutures = pos.mode === "grid_futures";
        
        let trendPnl = 0;
        if (isFutures) {
            trendPnl = calculateFuturesPnL(pos, currentPrice);
        } else {
            trendPnl = (currentPrice - pos.entryPrice) * pos.size;
        }

        const totalPnl = (pos.realizedProfit || 0) + trendPnl;
        const safeMargin = pos.margin || pos.amount || 0;

        if (isFutures) {
            setBalance(p => p + safeMargin + totalPnl);
        } else {
            const sellValue = pos.size * currentPrice;
            setBalance(p => p + sellValue + (pos.realizedProfit || 0)); 
        }

        setHistory(prev => [{
            ...pos,
            closePrice: currentPrice,
            pnl: totalPnl, 
            realizedGridProfit: pos.realizedProfit, 
            exitTime: new Date().toLocaleString(),
            type: "grid_stopped",
            status: "closed"
        }, ...prev]);

        setPositions(p => p.filter(x => x.id !== id));
        return;
    }
    
    const exitFee = (pos.size * currentPrice * (pos.feeRate || 0.1)) / 100;
    const sellValue = pos.size * currentPrice;
    const pnl = sellValue - pos.amount; 
    
    setBalance(p => p + sellValue - exitFee);
    
    setHistory(prev => [{ 
        ...pos, 
        closePrice: currentPrice, 
        pnl: pnl - (pos.entryFee || 0) - exitFee, 
        exitTime: new Date().toLocaleString(), 
        type: "position_closed" 
    }, ...prev]);

    setPositions(p => p.filter(x => x.id !== id));
  };

  const cancelOrder = (id) => {
    const order = orders.find(o => o.id === id); if (!order) return;
    
    if (order.mode === 'futures') {
        setBalance(p => p + (order.margin + (order.entryFee || 0)));
    } else if (order.mode === 'spot' && order.side === 'short') {
    } else {
        setBalance(p => p + (order.amount + (order.entryFee || 0)));
    }
    
    setOrders(p => p.filter(x => x.id !== id));
  };

  const calculatePnL = (pos, price) => {
    if (pos.symbol !== symbol) return 0; 

    const safePrice = parseFloat(price) || 0;
    if (pos.mode === "futures" || pos.mode === "grid_futures") return calculateFuturesPnL(pos, safePrice) || 0;
    const entry = parseFloat(pos.entryPrice) || 0;
    const size = parseFloat(pos.size) || 0;
    return (safePrice - entry) * size;
  };

  const equity = balance + positions.reduce((acc, pos) => {
      const margin = parseFloat(pos.margin) || parseFloat(pos.amount) || 0;
      const pnl = parseFloat(calculatePnL(pos, currentPrice)) || 0;
      return acc + margin + pnl;
  }, 0);

  if (authLoading) return <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center text-white font-bold">同步中...</div>;
  if (!user) return <LoginView onLoginSuccess={setUser} />;

  return (
    <div className="flex flex-col h-screen bg-[#0b0e11] text-[#eaecef] overflow-hidden select-none">
      <Header symbol={symbol} setSymbol={setSymbol} currentPrice={currentPrice} equity={equity} balance={balance} user={user} setUser={setUser} resetAccount={resetAccount} history={history} positions={positions} feeSettings={feeSettings} setFeeSettings={setFeeSettings} selectedExchange={selectedExchange} setSelectedExchange={setSelectedExchange} heldCoins={heldCoins} />
      <div className="flex flex-1 overflow-hidden">
        <ChartContainer symbol={symbol} timeframe={timeframe} setTimeframe={setTimeframe} klineData={klineData} currentPrice={currentPrice} loading={loading} apiError={apiError} showTimeMenu={showTimeMenu} setShowTimeMenu={setShowTimeMenu} favorites={favorites} toggleFavorite={toggleFavorite} activeGrid={activeGrid} />
        <div className="w-1 bg-[#2b3139] hover:bg-[#f0b90b] cursor-col-resize z-50 transition-colors" onMouseDown={startResizing}></div>
        <div ref={panelRef} style={{ width: `${panelWidth}px`, flexShrink: 0 }}>
            <TradingPanel 
                tradeMode={tradeMode} 
                setTradeMode={setTradeMode} 
                symbol={symbol} 
                setSymbol={setSymbol} 
                side={side} 
                setSide={setSide} 
                orderType={orderType} 
                setOrderType={setOrderType} 
                priceInput={priceInput} 
                setPriceInput={setPriceInput} 
                currentPrice={currentPrice} 
                amount={amount} 
                setAmount={setAmount} 
                amountType={amountType} 
                setAmountType={setAmountType} 
                leverage={leverage} 
                setLeverage={setLeverage} 
                balance={balance} 
                availableCoinBalance={currentHolding}
                handleTrade={handleTrade} 
                futuresInputMode={futuresInputMode} 
                setFuturesInputMode={setFuturesInputMode} 
                gridType={gridType} 
                setGridType={setGridType} 
                gridLevels={gridLevels} 
                setGridLevels={setGridLevels} 
                gridDirection={gridDirection} 
                setGridDirection={setGridDirection} 
                gridLowerPrice={gridLowerPrice} 
                setGridLowerPrice={setGridLowerPrice} 
                gridUpperPrice={gridUpperPrice} 
                setGridUpperPrice={setGridUpperPrice} 
                reserveMargin={reserveMargin} 
                setReserveMargin={setReserveMargin} 
                feeSettings={feeSettings} 
                selectedExchange={selectedExchange} 
            />
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
          activeGridId={activeGridId} 
          onUpdateFuturesOrder={updateFuturesOrder} 
      />

      {currentView === "grid_details" && activeGrid && (
          <div className="fixed inset-0 z-50 bg-[#0b0e11]">
               <GridStrategyDetails 
                   grid={activeGrid} 
                   currentPrice={currentPrice} 
                   onBack={() => setCurrentView("dashboard")} 
                   calculatePnL={calculatePnL} 
                   onUpdateStrategy={updateGridStrategy}
               />
          </div>
      )}
    </div>
  );
}