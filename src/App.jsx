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
  
  // 🔥 新增：儲存全市場最新價格 (Map結構: { "BTCUSDT": 90000, "ETHUSDT": 3000 })
  const [marketPrices, setMarketPrices] = useState({});

  const [positions, setPositions] = useState([]); 
  const [orders, setOrders] = useState([]);       
  const [history, setHistory] = useState([]);     
  const [klineData, setKlineData] = useState([]);
  
  // Trading UI State
  const [tradeMode, setTradeMode] = useState('spot');
  const [side, setSide] = useState('long');
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState(10);
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

  // 🔥 新增：背景抓取全市場價格 (每 3 秒更新一次)
  useEffect(() => {
    const fetchMarketPrices = async () => {
        try {
            // 使用 Binance Ticker API 獲取所有幣種價格
            const res = await fetch('https://data-api.binance.vision/api/v3/ticker/price');
            const data = await res.json();
            const priceMap = {};
            data.forEach(item => {
                priceMap[item.symbol] = parseFloat(item.price);
            });
            setMarketPrices(priceMap);
        } catch (error) {
            // console.error("Market prices fetch failed", error);
        }
    };
    
    fetchMarketPrices(); // 初次執行
    const interval = setInterval(fetchMarketPrices, 3000); // 每 3 秒更新
    return () => clearInterval(interval);
  }, []);

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

  // K-Line Data Fetching (Current Symbol)
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

  const handleTrade = () => {
    const executionPrice = orderType === 'limit' ? parseFloat(priceInput) : currentPrice;
    const val = parseFloat(amount);
    if (!val || val <= 0) return alert('請輸入有效數量');

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

    let usdtValue, coinSize, margin;

    if (tradeMode === 'spot') {
        usdtValue = amountType === 'usdt' ? val : val * executionPrice;
        coinSize = amountType === 'usdt' ? val / executionPrice : val;
        margin = usdtValue;
    } else {
        if (amountType === 'coin') {
            coinSize = val;
            usdtValue = val * executionPrice;
            margin = usdtValue / leverage;
        } else {
            if (futuresInputMode === 'cost') {
                margin = val;
                usdtValue = margin * leverage;
                coinSize = usdtValue / executionPrice;
            } else {
                usdtValue = val;
                margin = usdtValue / leverage;
                coinSize = usdtValue / executionPrice;
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
    setBalance(p => p - margin);
    setAmount('');
  };

  const closePosition = (id) => {
    const pos = positions.find(p => p.id === id);
    if (!pos) return;
    // 平倉時使用 marketPrices 裡的最新價格，如果沒有則用 currentPrice (剛好是當前幣種)
    const exitPrice = marketPrices[pos.symbol] || currentPrice;
    
    const diff = pos.side === 'long' ? (exitPrice - pos.entryPrice) : (pos.entryPrice - exitPrice);
    let pnl = (pos.mode === 'spot') ? (exitPrice - pos.entryPrice) * pos.size : diff * pos.size;
    
    setBalance(p => p + pos.margin + pnl);
    const historyItem = { ...pos, closePrice: exitPrice, pnl, exitTime: new Date().toLocaleTimeString(), type: 'position' };
    setHistory(prev => [historyItem, ...prev]);
    setPositions(p => p.filter(x => x.id !== id));
  };

  const cancelOrder = (id) => {
      const order = orders.find(o => o.id === id);
      if (!order) return;
      const refund = order.mode === 'futures' ? (order.amount / order.leverage) : order.amount;
      setBalance(p => p + refund);
      setHistory(prev => [{ ...order, status: 'canceled', exitTime: new Date().toLocaleTimeString(), type: 'order' }, ...prev]);
      setOrders(p => p.filter(x => x.id !== id));
  };

  const calculatePnL = (pos, price) => {
      if (pos.mode === 'spot') return (price - pos.entryPrice) * pos.size;
      return (pos.side === 'long' ? price - pos.entryPrice : pos.entryPrice - price) * pos.size;
  };
  
  // 🔥 修正總資產計算：使用 marketPrices 確保不同幣種的資產價值正確
  const equity = balance + positions.reduce((acc, pos) => {
      // 優先使用 marketPrices[pos.symbol]，如果還沒抓到資料，暫時用 entryPrice (PnL=0) 避免資產暴跌
      const realTimePrice = marketPrices[pos.symbol] || pos.entryPrice;
      return acc + pos.margin + calculatePnL(pos, realTimePrice);
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
        // 🔥 將 marketPrices 傳給 Header，讓 UserProfileSet 也能使用
        marketPrices={marketPrices} 
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
            futuresInputMode={futuresInputMode} setFuturesInputMode={setFuturesInputMode}
            gridLevels={gridLevels} setGridLevels={setGridLevels} gridDirection={gridDirection} setGridDirection={setGridDirection}
            gridLowerPrice={gridLowerPrice} setGridLowerPrice={setGridLowerPrice} gridUpperPrice={gridUpperPrice} setGridUpperPrice={setGridUpperPrice}
            reserveMargin={reserveMargin} setReserveMargin={setReserveMargin}
        />
      </div>
      <TransactionDetails 
         mainTab={mainTab} setMainTab={setMainTab} subTab={subTab} setSubTab={setSubTab}
         filteredData={filteredData} currentPrice={currentPrice} closePosition={closePosition} cancelOrder={cancelOrder} calculatePnL={calculatePnL}
         // 🔥 將 marketPrices 傳給交易列表
         marketPrices={marketPrices}
      />
    </div>
  );
}