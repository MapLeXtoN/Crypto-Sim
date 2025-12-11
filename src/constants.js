// --- 基礎設定 ---
export const INITIAL_BALANCE = 100000;

// --- 交易對與週期 ---
export const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT'];
export const ALL_INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
];

// --- 繪圖工具設定 ---
export const TOOLS = {
  CURSOR: 'cursor',
  LINE: 'line',
  RECT: 'rect',
  FIB: 'fib'
};

// --- 線條樣式 (SMC/SNR 指標未來也會用到) ---
export const LINE_STYLES = {
  SOLID: [],
  DASHED: [10, 5],
  DOTTED: [3, 3]
};