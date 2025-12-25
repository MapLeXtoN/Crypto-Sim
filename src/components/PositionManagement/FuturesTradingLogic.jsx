// src/components/PositionManagement/FuturesTradingLogic.jsx
import { useEffect, useCallback } from 'react';

export const useFuturesTradingLogic = ({
    currentPrice, balance, setBalance, positions, setPositions, orders, setOrders, history, setHistory, symbol,
    feeSettings, selectedExchange 
}) => {

    // 合約訂單撮合邏輯
    useEffect(() => {
        if (!currentPrice || orders.length === 0) return;
        let hasChanges = false;
        const filledOrders = [];
        const remainingOrders = [];
        orders.forEach(order => {
            if (order.status !== 'pending' || order.mode !== 'futures') { remainingOrders.push(order); return; }
            let isFilled = false;
            const pCurrent = parseFloat(currentPrice);
            const pOrder = parseFloat(order.price);
            if (order.triggerCondition === 'gte' && pCurrent >= pOrder) isFilled = true;
            else if (order.triggerCondition === 'lte' && pCurrent <= pOrder) isFilled = true;
            if (isFilled) { hasChanges = true; filledOrders.push(order); } else remainingOrders.push(order);
        });
        if (hasChanges) {
            setOrders(remainingOrders);
            const newPositions = filledOrders.map(o => ({
                id: Date.now() + Math.random(), symbol: o.symbol, mode: 'futures', side: o.side, entryPrice: parseFloat(o.price),
                amount: o.amount, size: o.size, leverage: o.leverage, margin: o.margin, tp: o.tp || null, sl: o.sl || null,
                time: new Date().toLocaleString(), exchange: o.exchange, feeRate: o.feeRate, entryFee: o.entryFee 
            }));
            setPositions(prev => [...newPositions, ...prev]);
            setHistory(prev => [...filledOrders.map(o => ({ ...o, status: 'filled', exitTime: new Date().toLocaleString(), type: 'order_filled', pnl: 0 })), ...prev]);
        }
    }, [currentPrice, orders, setOrders, setPositions, setHistory]);

    const calculateFuturesPnL = useCallback((pos, price) => {
        if (!price || isNaN(price) || !pos) return 0;
        return (pos.side === 'long' ? price - pos.entryPrice : pos.entryPrice - price) * (pos.size || 0);
    }, []);

    const handleFuturesTrade = useCallback((tradeParams) => {
        const { side, amount, amountType, orderType, priceInput, leverage, futuresInputMode, takeProfit, stopLoss } = tradeParams;
        
        // 1. 價格檢查
        if (!currentPrice) return alert("價格載入中，請稍後...");
        let executionPrice = currentPrice;
        
        if (orderType === 'limit') {
            const p = parseFloat(priceInput);
            if (!p || isNaN(p) || p <= 0) return alert("請輸入有效的限價單價格！");
            executionPrice = p;
        }

        // 2. 數量檢查
        const val = parseFloat(amount);
        if (!val || isNaN(val) || val <= 0) return alert("請輸入有效的下單數量/金額！");

        const lev = parseFloat(leverage) || 1;
        const makerRate = feeSettings?.futuresMaker ?? 0.02;
        const takerRate = feeSettings?.futuresTaker ?? 0.05;
        const currentRate = orderType === 'limit' ? makerRate : takerRate;

        let usdtValue, coinSize, margin;

        // 3. 計算並檢查是否出現 NaN
        if (amountType === 'coin') { 
            coinSize = val; 
            usdtValue = val * executionPrice; 
            margin = usdtValue / lev; 
        } else {
            // 金額開單
            // 🔥 [修正] 嚴格依照用戶定義：
            // cost (本金下單) = 輸入的是本金(margin) => 總價值(usdtValue) = 本金 * 槓桿
            // value (價值下單) = 輸入的是總價值(usdtValue) => 本金(margin) = 總價值 / 槓桿
            if (futuresInputMode === 'cost') { 
                margin = val; 
                usdtValue = margin * lev; 
                coinSize = usdtValue / executionPrice; 
            } else { 
                // value 模式
                usdtValue = val; 
                margin = usdtValue / lev; 
                coinSize = usdtValue / executionPrice; 
            }
        }

        if (isNaN(usdtValue) || isNaN(margin) || isNaN(coinSize) || !isFinite(coinSize)) {
            console.error("Trade Error: Invalid Calc", { usdtValue, margin, coinSize });
            return alert("數值計算錯誤，請檢查輸入參數！");
        }

        const entryFee = (usdtValue * currentRate) / 100;
        if (margin + entryFee > balance) return alert(`資金不足！(需: ${(margin+entryFee).toFixed(2)})`);

        const commonData = { exchange: selectedExchange, feeRate: currentRate, entryFee };

        if (orderType === 'limit') {
            const triggerCondition = executionPrice >= currentPrice ? 'gte' : 'lte';
            setOrders(prev => [{ ...commonData, id: Date.now(), symbol, mode: 'futures', type: 'limit', side, price: executionPrice, amount: usdtValue, size: coinSize, leverage: lev, margin, status: 'pending', time: new Date().toLocaleString(), tp: takeProfit || null, sl: stopLoss || null, triggerCondition }, ...prev]);
            alert("限價單已掛出");
        } else {
            setPositions(prev => [{ ...commonData, id: Date.now(), symbol, mode: 'futures', side, entryPrice: executionPrice, amount: usdtValue, size: coinSize, leverage: lev, margin, tp: takeProfit || null, sl: stopLoss || null, time: new Date().toLocaleString() }, ...prev]);
            alert("開倉成功");
        }
        
        setBalance(p => p - (margin + entryFee));
        return true;
    }, [currentPrice, symbol, balance, feeSettings, selectedExchange, setOrders, setPositions, setBalance]);

    const closeFuturesPosition = useCallback((pos) => {
        const exitFee = (pos.size * currentPrice * (pos.feeRate || 0.05)) / 100;
        const pnl = (pos.side === 'long' ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice) * pos.size;
        setBalance(p => p + pos.margin + pnl - exitFee);
        setHistory(prev => [{ ...pos, closePrice: currentPrice, pnl: pnl - (pos.entryFee || 0) - exitFee, exitTime: new Date().toLocaleTimeString(), type: 'position' }, ...prev]);
        setPositions(p => p.filter(x => x.id !== pos.id));
    }, [currentPrice, setBalance, setHistory, setPositions]);

    const cancelFuturesOrder = useCallback((order) => {
        setBalance(p => p + order.margin + (order.entryFee || 0));
        setOrders(p => p.filter(x => x.id !== order.id));
    }, [setBalance, setOrders]);

    const updateFuturesOrder = useCallback((id, updates) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    }, [setOrders]);

    return { handleFuturesTrade, calculateFuturesPnL, closeFuturesPosition, cancelFuturesOrder, updateFuturesOrder };
};