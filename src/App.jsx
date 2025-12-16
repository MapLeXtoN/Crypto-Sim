// src/App.jsx

import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { INITIAL_BALANCE } from './constants';
import { generateMockData } from './utils';

// Import Components
import LoginView from './components/LoginView';
import Header from './components/TOP/Header';
import ChartContainer from './components/chart/ChartContainer';
import TransactionDetails from './components/Tradingpanel/Transactiondetails';
import TradingPanel from './components/TradingPanel';

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
  
  // Trading UI State
  const [tradeMode, setTradeMode] = useState('spot');
  const [side, setSide] = useState('long');
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState(10);
  
  // 🔥 新增：合約下單模式 ('value' = 按價值, 'cost' = 按本金)
  const [futuresInputMode, setFuturesInputMode] = useState('value');

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

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Loading
  useEffect(() => {
    const loadUserData = async () => {
        if (user) {
            try {
                const userRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setBalance(data.balance || INITIAL_BALANCE);
                    setPositions(data.positions || []);
                    setOrders(data.orders || []);
                    setHistory((data.history || []).slice(0, 100));
                    if (data.favorites) setFavorites(data.favorites);
                }
            } catch (err) { console.error(err); }
        }
    };
    loadUserData();
  }, [user]);

  // Data Saving
  useEffect(() => {
    if (user && !authLoading) {
        const saveData = async () => {
            try {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, { 
                    balance, 
                    positions, 
                    orders, 
                    history: history.slice(0, 100), 
                    favorites
                });
            } catch (err) {}
        };
        const timer = setTimeout(saveData, 2000); 
        return () => clearTimeout(timer);
    }
  }, [balance, positions, orders, history, favorites, user, authLoading]);

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
          } catch (e) {
              console.error("Reset failed:", e);
          }
      }
  };

  // API Fetching
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const url = `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=500`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const rawData = await res.json();
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
                 const lastPrice = formattedData[formattedData.length - 1].close;
                 setCurrentPrice(lastPrice);
             }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (isMounted) {
            if (klineData.length === 0) {
                setApiError(true);
                const mockData = generateMockData(500, currentPrice || 60000);
                setKlineData(mockData);
                if(mockData.length > 0) setCurrentPrice(mockData[mockData.length - 1].close);
            }
            setLoading(false);
        }
      }
    };

    fetchData();
    const timer = setInterval(() => { fetchData(); }, 6000); 

    return () => { 
        isMounted = false; 
        clearInterval(timer);
        controller.abort(); 
    };
  }, [symbol, timeframe]);

  // Trading Logic
  const handleTrade = () => {
    const executionPrice = orderType === 'limit' ? parseFloat(priceInput) : currentPrice;
    const val = parseFloat(amount);
    if (!val || val <= 0) return alert('請輸入有效數量');

    // 網格交易處理
    if (tradeMode === 'grid') {
        const totalInvestment = val;
        if (totalInvestment > balance) return alert('資金不足');
        const min = parseFloat(gridLowerPrice);
        const max = parseFloat(gridUpperPrice);
        if (!min || !max || min >= max) return alert('無效範圍');
        
        const newOrder = { id: Date.now(), symbol, mode: 'grid', status: 'active', amount: totalInvestment };
        setOrders(prev => [newOrder, ...prev]);
        setBalance(p => p - totalInvestment);
        alert('網格已建立');
        return;
    }

    // 🔥 核心修改：下單計算邏輯 (現貨 vs 合約[按價值/按本金])
    let usdtValue, coinSize, margin;

    if (tradeMode === 'spot') {
        // 現貨模式 (無槓桿)
        usdtValue = amountType === 'usdt' ? val : val * executionPrice;
        coinSize = amountType === 'usdt' ? val / executionPrice : val;
        margin = usdtValue;
    } else {
        // 合約模式 (tradeMode === 'futures')
        if (amountType === 'coin') {
            // 如果輸入單位是幣(Coin)，則無視本金/價值模式，直接算
            coinSize = val;
            usdtValue = val * executionPrice;
            margin = usdtValue / leverage;
        } else {
            // 輸入單位是 USDT
            if (futuresInputMode === 'cost') {
                // 🔥 按本金買入：輸入的 val 就是我要出的錢 (Margin)
                margin = val;
                usdtValue = margin * leverage; // 總倉位價值放大
                coinSize = usdtValue / executionPrice;
            } else {
                // 🔥 按價值買入 (預設)：輸入的 val 是總倉位價值
                usdtValue = val;
                margin = usdtValue / leverage; // 實際出的錢縮小
                coinSize = usdtValue / executionPrice;
            }
        }
    }
    
    // 檢查餘額
    if (margin > balance) return alert(`資金不足！需要保證金: ${margin.toFixed(2)} USDT`);

    if (orderType === 'limit') {
          const newOrder = { id: Date.now(), symbol, mode: tradeMode, type: 'limit', side, price: executionPrice, amount: usdtValue, size: coinSize, leverage: tradeMode === 'futures' ? leverage : 1, status: 'pending', time: new Date().toLocaleTimeString(), isBot: false };
          setOrders(prev => [newOrder, ...prev]);
    } else {
          const newPos = { id: Date.now(), symbol, mode: tradeMode, side, entryPrice: executionPrice, amount: usdtValue, size: coinSize, leverage: tradeMode === 'futures' ? leverage : 1, margin, isBot: false };
          setPositions(prev => [newPos, ...prev]);
    }
    
    setBalance(p => p - margin);
    setAmount('');
  };

  const closePosition = (id) => {
    const pos = positions.find(p => p.id === id);
    if (!pos) return;
    const diff = pos.side === 'long' ? (currentPrice - pos.entryPrice) : (pos.entryPrice - currentPrice);
    let pnl = (pos.mode === 'spot') ? (currentPrice - pos.entryPrice) * pos.size : diff * pos.size;
    setBalance(p => p + pos.margin + pnl);
    const historyItem = { ...pos, closePrice: currentPrice, pnl, exitTime: new Date().toLocaleTimeString(), type: 'position' };
    setHistory(prev => [historyItem, ...prev]);
    setPositions(p => p.filter(x => x.id !== id));
  };

  const cancelOrder = (id) => {
      const order = orders.find(o => o.id === id);
      if (!order) return;
      // 取消訂單退回的錢：若是合約，退回保證金；若是現貨，退回全額
      const refund = order.mode === 'futures' ? (order.amount / order.leverage) : order.amount;
      setBalance(p => p + refund);
      setHistory(prev => [{ ...order, status: 'canceled', exitTime: new Date().toLocaleTimeString(), type: 'order' }, ...prev]);
      setOrders(p => p.filter(x => x.id !== id));
  };

  const calculatePnL = (pos, price) => {
      if (pos.mode === 'spot') return (price - pos.entryPrice) * pos.size;
      return (pos.side === 'long' ? price - pos.entryPrice : pos.entryPrice - price) * pos.size;
  };
  
  const equity = balance + positions.reduce((acc, pos) => {
      return acc + pos.margin + calculatePnL(pos, currentPrice);
  }, 0);

  const filteredData = { data: { pos: positions, ord: orders, history: history } };

  if (authLoading) return <div className="min-h-screen bg-[#0b0e11] text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <LoginView onLoginSuccess={setUser} />;

  return (
    <div className="flex flex-col h-screen bg-[#0b0e11] text-[#eaecef] font-sans overflow-hidden select-none">
      <Header 
        symbol={symbol} 
        setSymbol={setSymbol} 
        currentPrice={currentPrice} 
        equity={equity} 
        balance={balance} 
        user={user} 
        setUser={setUser}
        resetAccount={resetAccount}
        history={history}
        positions={positions}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <ChartContainer 
            symbol={symbol} timeframe={timeframe} setTimeframe={setTimeframe} 
            klineData={klineData} currentPrice={currentPrice} 
            loading={loading} apiError={apiError}
            showTimeMenu={showTimeMenu} setShowTimeMenu={setShowTimeMenu} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite} 
        />
        <TradingPanel 
            tradeMode={tradeMode} setTradeMode={setTradeMode} symbol={symbol} setSymbol={setSymbol} side={side} setSide={setSide}
            orderType={orderType} setOrderType={setOrderType} priceInput={priceInput} setPriceInput={setPriceInput} currentPrice={currentPrice}
            amount={amount} setAmount={setAmount} amountType={amountType} setAmountType={setAmountType}
            leverage={leverage} setLeverage={setLeverage} balance={balance} handleTrade={handleTrade}
            
            // 🔥 傳遞新的 props 給 TradingPanel
            futuresInputMode={futuresInputMode}
            setFuturesInputMode={setFuturesInputMode}

            gridLevels={gridLevels} setGridLevels={setGridLevels} gridDirection={gridDirection} setGridDirection={setGridDirection}
            gridLowerPrice={gridLowerPrice} setGridLowerPrice={setGridLowerPrice} gridUpperPrice={gridUpperPrice} setGridUpperPrice={setGridUpperPrice}
            reserveMargin={reserveMargin} setReserveMargin={setReserveMargin}
        />
      </div>
      <TransactionDetails 
         mainTab={mainTab} setMainTab={setMainTab} subTab={subTab} setSubTab={setSubTab}
         filteredData={filteredData} currentPrice={currentPrice} closePosition={closePosition} cancelOrder={cancelOrder} calculatePnL={calculatePnL}
      />
    </div>
  );
}