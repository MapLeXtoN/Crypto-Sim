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
        if (!price || isNaN(price)) return 0;
        return (pos.side === 'long' ? price - pos.entryPrice : pos.entryPrice - price) * pos.size;
    }, []);

    const handleFuturesTrade = useCallback((tradeParams) => {
        const { side, amount, amountType, orderType, priceInput, leverage, futuresInputMode, takeProfit, stopLoss } = tradeParams;
        const executionPrice = orderType === 'limit' ? parseFloat(priceInput) : currentPrice;
        const val = parseFloat(amount);

        const currentRate = orderType === 'limit' ? feeSettings.futuresMaker : feeSettings.futuresTaker;

        let usdtValue, coinSize, margin;
        if (amountType === 'coin') { coinSize = val; usdtValue = val * executionPrice; margin = usdtValue / leverage; }
        else {
            if (futuresInputMode === 'cost') { margin = val; usdtValue = margin * leverage; coinSize = usdtValue / executionPrice; }
            else { usdtValue = val; margin = usdtValue / leverage; coinSize = usdtValue / executionPrice; }
        }

        const entryFee = (usdtValue * currentRate) / 100;
        if (margin + entryFee > balance) { alert(`資金不足支付保證金與手續費！`); return false; }

        const commonData = { exchange: selectedExchange, feeRate: currentRate, entryFee };

        if (orderType === 'limit') {
            const triggerCondition = executionPrice >= currentPrice ? 'gte' : 'lte';
            setOrders(prev => [{ ...commonData, id: Date.now(), symbol, mode: 'futures', type: 'limit', side, price: executionPrice, amount: usdtValue, size: coinSize, leverage, margin, status: 'pending', time: new Date().toLocaleString(), tp: takeProfit || null, sl: stopLoss || null, triggerCondition }, ...prev]);
        } else {
            setPositions(prev => [{ ...commonData, id: Date.now(), symbol, mode: 'futures', side, entryPrice: executionPrice, amount: usdtValue, size: coinSize, leverage, margin, tp: takeProfit || null, sl: stopLoss || null, time: new Date().toLocaleString() }, ...prev]);
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