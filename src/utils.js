// --- utils.js (修復引用版) ---

// --- 金錢格式化 ---
export const formatMoney = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return '$0.00';
  return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// --- 盈虧計算 ---
export const calculatePnL = (pos, currentPrice) => {
    if (!pos || !currentPrice) return 0;
    
    // 現貨 (Spot)
    if (pos.mode === 'spot') {
        return (currentPrice - pos.entryPrice) * pos.size;
    }
    
    // 合約 (Futures)
    return (pos.side === 'long' 
        ? currentPrice - pos.entryPrice 
        : pos.entryPrice - currentPrice
    ) * pos.size;
};

// --- 🚨 關鍵修復：補回這兩個空函式，防止 ChartContainer 報錯 ---
export const calculateSMC = (klineData) => {
    return []; // 回傳空陣列，不做計算
};

export const calculateSNR = (klineData) => {
    return []; // 回傳空陣列，不做計算
};

// --- 模擬數據生成 ---
export const generateMockData = (count = 1000, startPrice = 60000) => {
  let data = [];
  let price = startPrice;
  let time = Math.floor(Date.now() / 1000) - count * 60 * 60; 
  for (let i = 0; i < count; i++) {
    const move = (Math.random() - 0.5) * (price * 0.02);
    const open = price;
    const close = price + move;
    const high = Math.max(open, close) + Math.random() * (price * 0.005);
    const low = Math.min(open, close) - Math.random() * (price * 0.005);
    
    data.push({ timestamp: time * 1000, open, high, low, close, volume: Math.random() * 100 });
    
    price = close;
    time += 3600; 
  }
  return data;
};