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
import TradingPanel from './components/TradingPanel/TradingPanel';
import GridStrategyDetails from './components/PositionManagement/GridStrategyDetails'; 

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1d'); 
  const [currentPrice, setCurrentPrice] = useState(0);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  
  const [positions, setPositions] = useState([]); 
  const [orders, setOrders] = useState([]);       
  const [history, setHistory] = useState([]);     
  const [klineData, setKlineData] = useState([]);
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeGridId, setActiveGridId] = useState(null);
  const activeGrid = positions.find(p => p.id === activeGridId) || null;
  
  const [feeSettings, setFeeSettings] = useState({
      vipLevel: 'VIP0', spotMaker: 0.1, spotTaker: 0.1, futuresMaker: 0.02, futuresTaker: 0.05, fundingRate: 0.01
  });

  // Trading Panel States
  const [tradeMode, setTradeMode] = useState('spot');
  const [side, setSide] = useState('long');
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [futuresInputMode, setFuturesInputMode] = useState('value');

  // Grid Specific States
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

  // ---------------------------------------------------------
  // CORE TRADING LOGIC
  // ---------------------------------------------------------

  // 🔥 新增：掛單撮合邏輯 (Order Matching Logic)
  // 當價格變動時，檢查是否有 Limit 單需要成交
  useEffect(() => {
    if (!currentPrice || orders.length === 0) return;

    let hasChanges = false;
    const filledOrders = [];
    const remainingOrders = [];

    orders.forEach(order => {
        // 只處理狀態為 pending 的訂單
        if (order.status !== 'pending') {
            remainingOrders.push(order);
            return;
        }

        let isFilled = false;
        const pCurrent = parseFloat(currentPrice);
        const pOrder = parseFloat(order.price);

        // 買單 (做多)：現價 <= 掛單價
        if (order.side === 'long' && pCurrent <= pOrder) isFilled = true;
        // 賣單 (做空)：現價 >= 掛單價
        if (order.side === 'short' && pCurrent >= pOrder) isFilled = true;

        if (isFilled) {
            hasChanges = true;
            filledOrders.push(order);
        } else {
            remainingOrders.push(order);
        }
    });

    if (hasChanges) {
        // 1. 更新訂單列表 (移除已成交)
        setOrders(remainingOrders);

        // 2. 將成交的訂單轉為持倉
        const newPositions = filledOrders.map(o => ({
            id: Date.now() + Math.random(), // 確保 ID 唯一
            symbol: o.symbol,
            mode: o.mode,
            side: o.side,
            entryPrice: o.price, // 以掛單價成交 (或可改為 currentPrice)
            amount: o.amount,    // 總投資額 (USDT)
            size: o.size,        // 數量 (Coin)
            leverage: o.leverage,
            margin: o.mode === 'futures' ? (o.amount / o.leverage) : o.amount,
            tp: o.tp || null, // 帶入止盈
            sl: o.sl || null, // 帶入止損
            isBot: false,
            time: new Date().toLocaleString() // 成交時間
        }));

        setPositions(prev => [...newPositions, ...prev]);

        // 3. 寫入歷史紀錄
        const newHistory = filledOrders.map(o => ({
            ...o,
            status: 'filled',
            exitTime: new Date().toLocaleString(),
            type: 'order_filled',
            pnl: 0 
        }));

        setHistory(prev => [...newHistory, ...prev]);
        
        // 注意：餘額在下單時(handleTrade)已扣除，此處無需再次操作餘額
    }
  }, [currentPrice, orders]); // 依賴 currentPrice 觸發檢查

  const generateChartLines = (levels, subPositions, step, direction) => {
      return levels.map((price, index) => {
          const hasPos = subPositions.some(p => p.gridIndex === index);
          
          if (direction === 'long') {
              if (hasPos) return { price: price + step, type: 'sell' }; 
              return { price: price, type: 'buy' };
          } else if (direction === 'short') {
              if (hasPos) return { price: price - step, type: 'buy' };
              return { price: price, type: 'sell' };
          } else {
              if (hasPos) {
                 const pos = subPositions.find(p => p.gridIndex === index);
                 if (pos.direction === 'long') return { price: price + step, type: 'sell' };
                 if (pos.direction === 'short') return { price: price - step, type: 'buy' };
              }
              return { price: price, type: 'neutral' }; 
          }
      });
  };

  const updateGridPositions = (price) => {
      if (!price || isNaN(price)) return;

      setPositions(prevPositions => {
          let hasChanges = false;
          const newPositions = prevPositions.map(pos => {
              if ((pos.mode !== 'grid_spot' && pos.mode !== 'grid_futures') || pos.symbol !== symbol) return pos;

              const currentSubPositions = pos.subPositions || [];

              if (price < pos.gridLower || price > pos.gridUpper) {
                  return pos;
              }

              const maintMarginRate = 0.005;
              const currentUnrealized = calculatePnL(pos, price);
              const equity = pos.amount + (pos.realizedProfit || 0) + currentUnrealized;
              
              const totalNotional = currentSubPositions.reduce((sum, p) => sum + p.notional, 0);
              const maintMargin = totalNotional * maintMarginRate;

              if (equity <= maintMargin) {
                  hasChanges = true;
                  return { ...pos, status: 'liquidated', subPositions: [], realizedProfit: -pos.amount };
              }

              let newSubPositions = [...currentSubPositions];
              let newRealizedProfit = pos.realizedProfit || 0;
              let newMatchedCount = pos.matchedCount || 0;
              let triggered = false;

              const levels = pos.gridLevelsList || [];
              const step = pos.gridStep;
              const size = pos.basePositionSize; 
              const feeRate = feeSettings.futuresTaker / 100;

              const findPosIndex = (idx) => newSubPositions.findIndex(p => p.gridIndex === idx);

              if (pos.gridDirection === 'long' || pos.gridDirection === 'neutral') {
                  levels.forEach((levelPrice, i) => {
                      if (i < levels.length - 1) { 
                          const exitPrice = levels[i + 1];
                          const posIdx = findPosIndex(i);
                          
                          if (posIdx !== -1 && price >= exitPrice && newSubPositions[posIdx].direction === 'long') {
                              const profit = (exitPrice - levelPrice) * (size / levelPrice);
                              const fee = (exitPrice * (size / levelPrice)) * feeRate;
                              
                              newRealizedProfit += (profit - fee);
                              newMatchedCount += 1;
                              newSubPositions.splice(posIdx, 1); 
                              triggered = true;
                          }
                      }
                      if (price <= levelPrice) {
                          const posIdx = findPosIndex(i);
                          if (posIdx === -1) {
                              const fee = size * feeRate;
                              newRealizedProfit -= fee; 
                              newSubPositions.push({
                                  entryPrice: levelPrice,
                                  gridIndex: i,
                                  direction: 'long',
                                  notional: size,
                                  sizeInCoin: size / levelPrice
                              });
                              triggered = true;
                          }
                      }
                  });
              }

              if (pos.gridDirection === 'short' || pos.gridDirection === 'neutral') {
                  levels.forEach((levelPrice, i) => {
                      if (i > 0) {
                          const exitPrice = levels[i - 1];
                          const posIdx = findPosIndex(i);

                          if (posIdx !== -1 && price <= exitPrice && newSubPositions[posIdx].direction === 'short') {
                              const profit = (levelPrice - exitPrice) * (size / levelPrice);
                              const fee = (exitPrice * (size / levelPrice)) * feeRate;

                              newRealizedProfit += (profit - fee);
                              newMatchedCount += 1;
                              newSubPositions.splice(posIdx, 1);
                              triggered = true;
                          }
                      }
                      if (price >= levelPrice) {
                          const posIdx = findPosIndex(i);
                          if (posIdx === -1) {
                              const fee = size * feeRate;
                              newRealizedProfit -= fee;
                              newSubPositions.push({
                                  entryPrice: levelPrice,
                                  gridIndex: i,
                                  direction: 'short',
                                  notional: size,
                                  sizeInCoin: size / levelPrice
                              });
                              triggered = true;
                          }
                      }
                  });
              }

              if (triggered) {
                  hasChanges = true;
                  const newGridLines = generateChartLines(levels, newSubPositions, step, pos.gridDirection);
                  
                  return { 
                      ...pos, 
                      subPositions: newSubPositions, 
                      realizedProfit: newRealizedProfit, 
                      matchedCount: newMatchedCount,
                      gridLines: newGridLines 
                  };
              }
              return pos;
          });

          const activePositions = [];
          newPositions.forEach(p => {
              if (p.status === 'liquidated') {
                  setHistory(prev => [{ ...p, exitTime: new Date().toLocaleTimeString(), pnl: -p.amount, type: 'liquidated' }, ...prev]);
              } else {
                  activePositions.push(p);
              }
          });

          return hasChanges ? activePositions : prevPositions;
      });
  };

  // 使用幣安防禦型 API
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const res = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=500`, { 
            signal: controller.signal,
            cache: 'no-store'
        });

        if (!res.ok) {
            if (res.status === 429 || res.status === 418) console.warn("[Binance API] Rate Limited.");
            throw new Error(`API Error: ${res.status}`);
        }
        
        const rawData = await res.json();

        // 防禦機制：檢查數據格式
        if (Array.isArray(rawData) && rawData.length > 0) {
            if (!Array.isArray(rawData[0]) || rawData[0].length < 6) return;

            const formattedData = rawData.map(d => ({
                timestamp: typeof d[0] === 'string' ? parseInt(d[0]) : d[0],
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
                volume: parseFloat(d[5])
            }));

            if (isMounted) {
                 setApiError(false); 
                 setKlineData(formattedData); 
                 setLoading(false); 

                 if(formattedData.length > 0) {
                     const newPrice = formattedData[formattedData.length - 1].close;
                     if (!isNaN(newPrice)) {
                        setCurrentPrice(newPrice);
                        updateGridPositions(newPrice);
                     }
                 }
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
    const timer = setInterval(fetchData, 5000); // 5秒更新一次
    return () => { isMounted = false; clearInterval(timer); controller.abort(); };
  }, [symbol, timeframe]);

  const handleTrade = (advancedParams = {}) => {
    if (!currentPrice || currentPrice <= 0) return alert('價格載入中...');
    
    // 🔥 修改：解構出 TP/SL 參數，供一般交易使用
    const { gridSpacingType, triggerPrice, stopLoss, takeProfit } = advancedParams;
    
    const executionPrice = orderType === 'limit' ? parseFloat(priceInput) : currentPrice;
    const val = parseFloat(amount);
    
    if (!val || val <= 0) return alert('請輸入有效數量');

    if (tradeMode === 'grid') {
        const totalInvestment = val; 
        if (totalInvestment > balance) return alert('資金不足');
        
        const min = parseFloat(gridLowerPrice); 
        const max = parseFloat(gridUpperPrice);
        const count = parseInt(gridLevels);
        const lev = gridType === 'futures' ? leverage : 1; 

        if (!min || !max || min >= max || count < 2) return alert('無效範圍或格數');
        
        let levels = [];
        let step = 0;

        if (gridSpacingType === 'geometric') {
             const ratio = Math.pow(max / min, 1 / (count - 1));
             for (let i = 0; i < count; i++) {
                 levels.push(min * Math.pow(ratio, i));
             }
             step = 0; 
        } else {
             const priceDiff = max - min;
             step = priceDiff / (count - 1);
             for (let i = 0; i < count; i++) {
                 levels.push(min + i * step);
             }
        }

        const totalNotional = totalInvestment * lev;
        const basePositionSize = totalNotional / count; 

        const initialGridLines = levels.map(p => {
            if (gridDirection === 'long') return { price: p, type: 'buy' };
            if (gridDirection === 'short') return { price: p, type: 'sell' };
            return { price: p, type: 'neutral' };
        });

        const gridMode = gridType === 'spot' ? 'grid_spot' : 'grid_futures';
        
        const newOrder = { 
            id: Date.now(), symbol, mode: gridMode, status: 'active', amount: totalInvestment, leverage: lev,
            gridLower: min, gridUpper: max, gridLevels: count, gridStep: step, gridDirection,
            gridSpacingType: gridSpacingType || 'arithmetic', triggerPrice: triggerPrice || null, stopLoss: stopLoss || null, takeProfit: takeProfit || null,
            gridLevelsList: levels, basePositionSize: basePositionSize, subPositions: [], gridLines: initialGridLines, 
            realizedProfit: 0, matchedCount: 0, entryPrice: currentPrice 
        };

        setPositions(prev => [newOrder, ...prev]);
        setBalance(p => p - totalInvestment);
        
        setActiveGridId(newOrder.id);
        setCurrentView('grid_details');
        
        alert(`${gridType === 'spot' ? '現貨' : '合約'}網格 (${gridDirection}) 已建立`);
        
        setTimeout(() => updateGridPositions(currentPrice), 100);
        return;
    }

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
          const newOrder = { 
              id: Date.now(), symbol, mode: tradeMode, type: 'limit', side, 
              price: executionPrice, amount: usdtValue, size: coinSize, 
              leverage: tradeMode === 'futures' ? leverage : 1, 
              status: 'pending', 
              time: new Date().toLocaleString(), // 顯示完整日期時間
              tp: takeProfit || null, // 儲存止盈
              sl: stopLoss || null,   // 儲存止損
              isBot: false 
          };
          setOrders(prev => [newOrder, ...prev]);
    } else {
          const newPos = { 
              id: Date.now(), symbol, mode: tradeMode, side, 
              entryPrice: executionPrice, amount: usdtValue, size: coinSize, 
              leverage: tradeMode === 'futures' ? leverage : 1, 
              margin, 
              tp: takeProfit || null, // 儲存止盈
              sl: stopLoss || null,   // 儲存止損
              isBot: false 
          };
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
        if (activeGridId === id) {
            setActiveGridId(null);
            setCurrentView('dashboard');
        }
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
      if (!price || isNaN(price)) return 0;
      
      if (pos.mode === 'spot') return (price - pos.entryPrice) * pos.size;
      if (pos.mode === 'futures') return (pos.side === 'long' ? price - pos.entryPrice : pos.entryPrice - price) * pos.size;

      if (pos.mode === 'grid_futures' || pos.mode === 'grid_spot') {
          if (!pos.subPositions || pos.subPositions.length === 0) return 0;
          return pos.subPositions.reduce((total, subPos) => {
              const diff = subPos.direction === 'long' ? (price - subPos.entryPrice) : (subPos.entryPrice - price);
              return total + (diff * subPos.sizeInCoin);
          }, 0);
      }
      return 0;
  };
  
  const equity = balance + positions.reduce((acc, pos) => {
      let pnl = 0;
      if (pos.symbol === symbol) pnl = calculatePnL(pos, currentPrice);
      if (isNaN(pnl)) pnl = 0;
      if (pos.mode === 'grid_spot' || pos.mode === 'grid_futures') {
          return acc + pos.amount + (pos.realizedProfit || 0) + pnl;
      }
      return acc + pos.margin + pnl;
  }, 0);

  const filteredData = { data: { pos: positions, ord: orders, history: history } };

  const handleGridSelect = (id) => {
      setActiveGridId(id);
      setCurrentView('grid_details');
  };

  const handleBackToDashboard = () => {
      setActiveGridId(null);
      setCurrentView('dashboard');
  };

  if (authLoading) return <div className="min-h-screen bg-[#0b0e11] text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <LoginView onLoginSuccess={setUser} />;

  if (currentView === 'grid_details' && activeGrid) {
      return (
          <GridStrategyDetails 
              grid={activeGrid}
              currentPrice={currentPrice}
              onBack={handleBackToDashboard}
              calculatePnL={calculatePnL}
          />
      );
  }

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
            activeGrid={null} 
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
         onGridSelect={handleGridSelect} 
         activeGridId={activeGridId}
      />
    </div>
  );
}