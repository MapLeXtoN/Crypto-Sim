// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { INITIAL_BALANCE } from './constants';
import { generateMockData } from './utils';

import LoginView from './components/LoginView';
import Header from './components/TOP/Header';
import ChartContainer from './components/chart/ChartContainer';
import TransactionDetails from './components/PositionManagement/PositionManagement';
import TradingPanel from './components/Tradingpanel/TradingPanel';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global State
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1d');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  
  const [positions, setPositions] = useState([]); 
  const [orders, setOrders] = useState([]);       
  const [history, setHistory] = useState([]);     
  const [klineData, setKlineData] = useState([]);
  
  const [activeGridId, setActiveGridId] = useState(null);
  const activeGrid = positions.find(p => p.id === activeGridId) || null;
  
  const [feeSettings, setFeeSettings] = useState({
      vipLevel: 'VIP0', spotMaker: 0.1, spotTaker: 0.1, futuresMaker: 0.02, futuresTaker: 0.05, fundingRate: 0.01
  });

  const [tradeMode, setTradeMode] = useState('spot');
  const [side, setSide] = useState('long');
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [futuresInputMode, setFuturesInputMode] = useState('value');

  const [gridType, setGridType] = useState('spot'); 
  const [gridLevels, setGridLevels] = useState(10);
  const [gridDirection, setGridDirection] = useState('neutral'); 
  const [reserveMargin, setReserveMargin] = useState(false);
  const [gridLowerPrice, setGridLowerPrice] = useState('');
  const [gridUpperPrice, setGridUpperPrice] = useState('');
  const [orderType, setOrderType] = useState('limit'); 
  const [amountType, setAmountType] = useState('usdt'); 
  const [priceInput, setPriceInput] = useState('');
  
  const [mainTab, setMainTab] = useState('spot'); 
  const [subTab, setSubTab] = useState('positions');
  
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [favorites, setFavorites] = useState(['15m', '1h', '4h', '1d']);
  const [apiError, setApiError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Resize Logic
  const [panelWidth, setPanelWidth] = useState(320);
  const panelRef = useRef(null);
  const isResizing = useRef(false);

  const startResizing = useCallback(() => {
      isResizing.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.classList.add('resizing'); 
  }, []);

  const stopResizing = useCallback(() => {
      if (isResizing.current) {
          isResizing.current = false;
          document.body.style.cursor = 'default';
          document.body.style.userSelect = 'auto';
          document.body.classList.remove('resizing');
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
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      return () => {
          window.removeEventListener('mousemove', resize);
          window.removeEventListener('mouseup', stopResizing);
      };
  }, [resize, stopResizing]);

  // Auth & Data
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
                    const safePositions = (data.positions || []).filter(p => p && p.id);
                    setPositions(safePositions);
                    setOrders(data.orders || []);
                    setHistory((data.history || []).slice(0, 100));
                    if (data.favorites) setFavorites(data.favorites);
                    if (data.feeSettings) setFeeSettings(data.feeSettings);
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
                    balance, positions, orders, history: history.slice(0, 100), favorites, feeSettings
                });
            } catch (err) {}
        }, 2000); 
        return () => clearTimeout(timer);
    }
  }, [balance, positions, orders, history, favorites, feeSettings, user, authLoading]);

  const toggleFavorite = (interval) => {
      setFavorites(prev => {
          if (prev.includes(interval)) return prev.filter(item => item !== interval);
          return [...prev, interval];
      });
  };

  const resetAccount = async (resetBalance = true, clearHistory = true) => {
      if (resetBalance) setBalance(INITIAL_BALANCE);
      if (clearHistory) {
          setPositions([]);
          setOrders([]);
          setHistory([]);
          setActiveGridId(null);
      }
      if (user) {
          try {
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, {
                  balance: resetBalance ? INITIAL_BALANCE : balance,
                  positions: clearHistory ? [] : positions,
                  orders: clearHistory ? [] : orders,
                  history: clearHistory ? [] : history
              });
          } catch (e) { console.error("Reset failed:", e); }
      }
  };

  // 🔥 核心修改：網格更新邏輯，加入套利次數(matchedCount)計算
  const updateGridPositions = (price) => {
      if (!price || isNaN(price)) return;

      setPositions(prevPositions => {
          let hasChanges = false;
          let newPositions = prevPositions.map(pos => {
              if ((pos.mode !== 'grid_spot' && pos.mode !== 'grid_futures') || pos.symbol !== symbol) return pos;
              if (price < pos.gridLower || price > pos.gridUpper) return pos;

              let newGridLines = [...pos.gridLines];
              let newRealizedProfit = pos.realizedProfit || 0;
              let newMatchedCount = pos.matchedCount || 0; // 🔥 確保有初始值
              let triggered = false;
              
              const direction = pos.gridDirection || 'neutral';
              const step = pos.gridStep;

              newGridLines = newGridLines.map(line => {
                  // --- LONG LOGIC ---
                  if (direction === 'long') {
                      if (line.type === 'buy' && price <= line.price) {
                          triggered = true;
                          return { ...line, type: 'sell', price: line.price + step };
                      }
                      else if (line.type === 'sell' && price >= line.price) {
                          triggered = true;
                          // 🔥 賣出獲利：增加利潤與次數
                          const profit = (pos.amount / pos.gridLevels) * (step / line.price); 
                          newRealizedProfit += profit;
                          newMatchedCount += 1; // 增加套利次數
                          return { ...line, type: 'buy', price: line.price - step };
                      }
                  }
                  // --- SHORT LOGIC ---
                  else if (direction === 'short') {
                      if (line.type === 'sell' && price >= line.price) {
                          triggered = true;
                          return { ...line, type: 'buy', price: line.price - step };
                      }
                      else if (line.type === 'buy' && price <= line.price) {
                          triggered = true;
                          // 🔥 買入回補獲利：增加利潤與次數
                          const profit = (pos.amount / pos.gridLevels) * (step / line.price);
                          newRealizedProfit += profit;
                          newMatchedCount += 1; // 增加套利次數
                          return { ...line, type: 'sell', price: line.price + step };
                      }
                  }
                  // --- NEUTRAL LOGIC ---
                  else {
                      if (line.type === 'buy' && price <= line.price) {
                          triggered = true;
                          return { ...line, type: 'sell', price: line.price + step };
                      }
                      else if (line.type === 'sell' && price >= line.price) {
                          triggered = true;
                          // 🔥 中性網格獲利
                          const profit = (pos.amount / pos.gridLevels) * (step / line.price);
                          newRealizedProfit += profit;
                          newMatchedCount += 1; // 增加套利次數
                          return { ...line, type: 'buy', price: line.price - step };
                      }
                  }
                  return line;
              });

              if (triggered) {
                  hasChanges = true;
                  return { 
                      ...pos, 
                      gridLines: newGridLines, 
                      realizedProfit: newRealizedProfit,
                      matchedCount: newMatchedCount // 🔥 更新狀態
                  };
              }
              return pos;
          });

          // 強平檢查
          const totalEquity = balance + calculateTotalUnrealizedPnL(newPositions, price);
          if (totalEquity <= 0) {
              setOrders([]);
              setHistory(prev => [...prev, { time: new Date().toLocaleTimeString(), symbol: 'ALL', type: 'LIQUIDATION', pnl: -balance, status: 'liquidated' }]);
              setBalance(0);
              return [];
          }

          return hasChanges ? newPositions : prevPositions;
      });
  };

  const calculateTotalUnrealizedPnL = (currentPositions, currentPrice) => {
    return currentPositions.reduce((acc, pos) => {
        let pnl = 0;
        if (pos.mode === 'grid_spot' || pos.mode === 'grid_futures') {
            pnl = calculatePnL(pos, currentPrice);
        } else {
             const diff = pos.side === 'long' ? (currentPrice - pos.entryPrice) : (pos.entryPrice - currentPrice);
             pnl = (pos.mode === 'spot') ? (currentPrice - pos.entryPrice) * pos.size : diff * pos.size;
        }
        return acc + (isNaN(pnl) ? 0 : pnl);
    }, 0);
  };

  const handleTrade = () => {
    if (!currentPrice || currentPrice <= 0) return alert('價格載入中...');
    const executionPrice = orderType === 'limit' ? parseFloat(priceInput) : currentPrice;
    const val = parseFloat(amount);
    if (!val || val <= 0) return alert('請輸入有效數量');

    if (tradeMode === 'grid') {
        const totalInvestment = val;
        if (totalInvestment > balance) return alert('資金不足');
        const min = parseFloat(gridLowerPrice); 
        const max = parseFloat(gridUpperPrice);
        const levels = parseInt(gridLevels);

        if (!min || !max || min >= max || levels < 2) return alert('無效範圍或格數');
        
        const priceDiff = max - min;
        const step = priceDiff / levels;
        const profitPerGrid = step / min;

        const gridLines = [];
        for (let i = 1; i < levels; i++) {
            const linePrice = min + (i * step);
            let type = 'buy';
            
            if (gridDirection === 'long') {
                type = 'buy';
            } else if (gridDirection === 'short') {
                type = 'sell';
            } else {
                type = linePrice < currentPrice ? 'buy' : 'sell';
            }

            gridLines.push({
                price: linePrice,
                type: type
            });
        }

        const gridMode = gridType === 'spot' ? 'grid_spot' : 'grid_futures';
        const newOrder = { 
            id: Date.now(), symbol, mode: gridMode, status: 'active', 
            amount: totalInvestment, leverage: gridType === 'futures' ? leverage : 1,
            gridLower: min, gridUpper: max, gridLevels: levels, gridStep: step, gridDirection,
            gridLines: gridLines, profitPerGrid: profitPerGrid, 
            realizedProfit: 0, // 🔥 初始利潤為 0
            matchedCount: 0,   // 🔥 初始套利次數為 0
            entryPrice: currentPrice
        };

        setPositions(prev => [newOrder, ...prev]);
        setBalance(p => p - totalInvestment);
        alert(`${gridType === 'spot' ? '現貨' : '合約'}網格 (${gridDirection}) 已建立`);
        return;
    }

    // 一般交易
    let usdtValue, coinSize, margin;
    if (tradeMode === 'spot') {
        usdtValue = amountType === 'usdt' ? val : val * executionPrice;
        coinSize = amountType === 'usdt' ? val / executionPrice : val;
        margin = usdtValue;
    } else {
        if (amountType === 'coin') {
            coinSize = val; usdtValue = val * executionPrice; margin = usdtValue / leverage;
        } else {
            if (futuresInputMode === 'cost') {
                margin = val; usdtValue = margin * leverage; coinSize = usdtValue / executionPrice;
            } else {
                usdtValue = val; margin = usdtValue / leverage; coinSize = usdtValue / executionPrice;
            }
        }
    }
    if (margin > balance) return alert(`資金不足！需要保證金: ${margin.toFixed(2)} USDT`);
    if (orderType === 'limit') {
          const newOrder = { id: Date.now(), symbol, mode: tradeMode, type: 'limit', side, price: executionPrice, amount: usdtValue, size: coinSize, leverage: tradeMode === 'futures' ? leverage : 1, status: 'pending', time: new Date().toLocaleTimeString(), isBot: false };
          setOrders(prev => [newOrder, ...prev]);
    } else {
          const newPos = { id: Date.now(), symbol, mode: tradeMode, side, entryPrice: executionPrice, amount: usdtValue, size: coinSize, leverage: tradeMode === 'futures' ? leverage : 1, margin, isBot: false };
          setPositions(prev => [newPos, ...prev]);
    }
    setBalance(p => p - margin); setAmount('');
  };

  const closePosition = (id) => {
    const pos = positions.find(p => p.id === id); if (!pos) return;
    const diff = pos.side === 'long' ? (currentPrice - pos.entryPrice) : (pos.entryPrice - currentPrice);
    let pnl = (pos.mode === 'spot') ? (currentPrice - pos.entryPrice) * pos.size : diff * pos.size;
    
    if (pos.mode === 'grid_spot' || pos.mode === 'grid_futures') {
        const floatPnL = calculatePnL(pos, currentPrice);
        setBalance(p => p + pos.amount + (pos.realizedProfit || 0) + floatPnL); 
        if (activeGridId === id) setActiveGridId(null);
    } else { 
        setBalance(p => p + pos.margin + pnl); 
    }
    const historyItem = { ...pos, closePrice: currentPrice, pnl: (pos.realizedProfit || 0) + pnl, exitTime: new Date().toLocaleTimeString(), type: 'position' };
    setHistory(prev => [historyItem, ...prev]);
    setPositions(p => p.filter(x => x.id !== id));
  };

  const cancelOrder = (id) => {
      const order = orders.find(o => o.id === id); if (!order) return;
      const refund = order.mode === 'futures' ? (order.amount / order.leverage) : order.amount;
      setBalance(p => p + refund);
      setHistory(prev => [{ ...order, status: 'canceled', exitTime: new Date().toLocaleTimeString(), type: 'order' }, ...prev]);
      setOrders(p => p.filter(x => x.id !== id));
  };

  const calculatePnL = (pos, price) => {
      if (!pos.entryPrice || pos.entryPrice === 0 || !price || isNaN(price)) return 0;
      if (pos.mode === 'grid_spot') return (price - pos.entryPrice) * ((pos.amount / 2) / pos.entryPrice);
      if (pos.mode === 'grid_futures') {
          let directionMultiplier = 1;
          if (pos.gridDirection === 'short') directionMultiplier = -1;
          return (price - pos.entryPrice) * ((pos.amount / 2) / pos.entryPrice) * pos.leverage * directionMultiplier;
      }
      if (pos.mode === 'spot') return (price - pos.entryPrice) * pos.size;
      return (pos.side === 'long' ? price - pos.entryPrice : pos.entryPrice - price) * pos.size;
  };
  
  const equity = balance + positions.reduce((acc, pos) => {
      const isGrid = pos.mode === 'grid_spot' || pos.mode === 'grid_futures';
      let pnl = 0;
      if (pos.symbol === symbol || isGrid) pnl = calculatePnL(pos, currentPrice);
      if (isNaN(pnl)) pnl = 0;
      if (isGrid) return acc + pos.amount + (pos.realizedProfit || 0) + pnl;
      return acc + pos.margin + pnl;
  }, 0);

  const filteredData = { data: { pos: positions, ord: orders, history: history } };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const res = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=500`, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const rawData = await res.json();
        const formattedData = rawData.map(d => ({
            timestamp: typeof d[0] === 'string' ? parseInt(d[0]) : d[0],
            open: parseFloat(d[1]), high: parseFloat(d[2]), low: parseFloat(d[3]), close: parseFloat(d[4]), volume: parseFloat(d[5])
        }));
        if (isMounted) {
             setApiError(false); setKlineData(formattedData); setLoading(false); 
             if(formattedData.length > 0) {
                 const newPrice = formattedData[formattedData.length - 1].close;
                 setCurrentPrice(newPrice);
                 updateGridPositions(newPrice);
             }
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted) {
            if (klineData.length === 0) {
                setApiError(true);
                const mock = generateMockData(500, currentPrice || 60000);
                setKlineData(mock);
                if(mock.length > 0) {
                    const newPrice = mock[mock.length - 1].close;
                    setCurrentPrice(newPrice);
                    updateGridPositions(newPrice);
                }
            }
            setLoading(false);
        }
      }
    };
    fetchData();
    const timer = setInterval(fetchData, 3000);
    return () => { isMounted = false; clearInterval(timer); controller.abort(); };
  }, [symbol, timeframe]);

  if (authLoading) return <div className="min-h-screen bg-[#0b0e11] text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <LoginView onLoginSuccess={setUser} />;

  return (
    <div className="flex flex-col h-screen bg-[#0b0e11] text-[#eaecef] font-sans overflow-hidden select-none">
      <Header symbol={symbol} setSymbol={setSymbol} currentPrice={currentPrice} equity={equity} balance={balance} user={user} setUser={setUser} resetAccount={resetAccount} history={history} positions={positions} feeSettings={feeSettings} setFeeSettings={setFeeSettings} />
      
      <div className="flex flex-1 overflow-hidden">
        <ChartContainer 
            symbol={symbol} timeframe={timeframe} setTimeframe={setTimeframe} 
            klineData={klineData} currentPrice={currentPrice} 
            loading={loading} apiError={apiError}
            showTimeMenu={showTimeMenu} setShowTimeMenu={setShowTimeMenu} 
            favorites={favorites} toggleFavorite={toggleFavorite} 
            activeGrid={activeGrid} 
        />
        
        <div className="w-1 bg-[#2b3139] hover:bg-[#f0b90b] cursor-col-resize z-50 transition-colors flex items-center justify-center group" onMouseDown={startResizing}>
            <div className="h-8 w-1 bg-transparent group-hover:bg-white/50 rounded"></div>
        </div>

        <div ref={panelRef} style={{ width: `${panelWidth}px`, flexShrink: 0 }}>
            <TradingPanel 
                tradeMode={tradeMode} setTradeMode={setTradeMode} symbol={symbol} setSymbol={setSymbol} side={side} setSide={setSide}
                orderType={orderType} setOrderType={setOrderType} priceInput={priceInput} setPriceInput={setPriceInput} currentPrice={currentPrice}
                amount={amount} setAmount={setAmount} amountType={amountType} setAmountType={setAmountType}
                leverage={leverage} setLeverage={setLeverage} balance={balance} handleTrade={handleTrade}
                futuresInputMode={futuresInputMode} setFuturesInputMode={setFuturesInputMode}
                gridType={gridType} setGridType={setGridType}
                gridLevels={gridLevels} setGridLevels={setGridLevels} gridDirection={gridDirection} setGridDirection={setGridDirection}
                gridLowerPrice={gridLowerPrice} setGridLowerPrice={setGridLowerPrice} gridUpperPrice={gridUpperPrice} setGridUpperPrice={setGridUpperPrice}
                reserveMargin={reserveMargin} setReserveMargin={setReserveMargin}
            />
        </div>
      </div>

      <TransactionDetails 
         mainTab={mainTab} setMainTab={setMainTab} subTab={subTab} setSubTab={setSubTab} 
         filteredData={filteredData} currentPrice={currentPrice} closePosition={closePosition} cancelOrder={cancelOrder} calculatePnL={calculatePnL} symbol={symbol} 
         onGridSelect={setActiveGridId}
         activeGridId={activeGridId}
      />
    </div>
  );
}