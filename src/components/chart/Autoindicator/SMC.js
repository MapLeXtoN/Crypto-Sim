// src/components/chart/Autoindicator/SMC.js

/**
 * 產生唯一 ID (用於連結方塊與文字)
 */
const generateId = () => {
    return 'smc_' + Math.random().toString(36).substr(2, 9);
};

/**
 * 移除未固定的 SMC
 * 只移除 groupId 為 'SMC' 的物件，保留 'SMC_PINNED' (已固定)
 */
export const removeSMC = (chart) => {
    if (!chart) return;
    try {
        if (chart.removeOverlay) {
            chart.removeOverlay({ groupId: 'SMC' });
        }
    } catch (e) {
        console.error("Remove SMC Error:", e);
    }
};

/**
 * 【功能】固定 (Pin) 特定的 SMC 物件
 * 當使用者在右鍵選單點擊「固定」時呼叫此函式
 */
export const pinSMC = (chart, overlayId) => {
    if (!chart || !overlayId) return;
    
    // 1. 找到被點擊的物件
    const overlay = chart.getOverlayById(overlayId);
    if (!overlay || !overlay.extendData || !overlay.extendData.linkId) return;

    // 取得該物件的關聯資訊
    const linkId = overlay.extendData.linkId;
    const tf = overlay.extendData.timeframe || '';
    const type = overlay.extendData.type || 'Zone'; // FVG, BOS, OB

    // 2. 找到所有具有相同 linkId 的物件 (通常是: 方塊 + 文字標籤)
    const allOverlays = chart.getOverlayList();
    const linkedOverlays = allOverlays.filter(o => o.extendData && o.extendData.linkId === linkId);

    // 3. 將它們升級為「已固定」狀態
    linkedOverlays.forEach(o => {
        // 修改群組：從 'SMC' 改為 'SMC_PINNED' (保護它不被自動清除)
        o.groupId = 'SMC_PINNED';
        o.lock = false; // 確保還是可以右鍵刪除

        // 如果是文字標籤，更新顯示內容：補上時間週期
        if (o.name === 'simpleAnnotation') {
            const newText = `[${tf}] ${type}`; // 例如: [1D] FVG
            o.styles = {
                ...o.styles,
                text: {
                    ...o.styles.text,
                    content: newText, 
                    backgroundColor: 'rgba(255, 140, 0, 0.9)', // 改為亮橘色背景，代表已固定
                    color: '#FFFFFF'
                }
            };
        } 
        // 如果是方塊/線條，加深顏色表示固定
        else {
             if (o.styles && o.styles.style === 'stroke_fill') {
                // 方塊
                o.styles = {
                    ...o.styles,
                    borderColor: 'rgba(255, 140, 0, 0.8)',
                    color: 'rgba(255, 140, 0, 0.15)'
                }
             }
        }
        
        // 更新物件
        chart.overrideOverlay(o);
    });
};

/**
 * 【功能】檢查「已固定」區域是否失效
 * 只檢查 'SMC_PINNED' 群組，避免運算量過大導致當機
 */
export const checkMitigation = (chart, klineData) => {
    if (!chart || !klineData || klineData.length === 0) return;
    
    // 只獲取已固定的方塊 (Rect)，且尚未失效的
    const overlays = chart.getOverlayList();
    const pinnedZones = overlays.filter(o => 
        o.groupId === 'SMC_PINNED' && 
        o.name === 'rect' && 
        !o.extendData.isMitigated
    );
    
    if (pinnedZones.length === 0) return;

    const lastCandle = klineData[klineData.length - 1]; // 只檢查最新價格，效能最好

    pinnedZones.forEach(zone => {
        const points = zone.points;
        if (!points || points.length < 2) return;

        const y1 = points[0].value;
        const y2 = points[1].value;
        const maxY = Math.max(y1, y2);
        const minY = Math.min(y1, y2);

        // 碰撞檢測：最新價格是否觸碰區域
        if (lastCandle.high >= minY && lastCandle.low <= maxY) {
            // 標記為失效
            zone.extendData.isMitigated = true;
            const linkId = zone.extendData.linkId;
            const tf = zone.extendData.timeframe;
            const type = zone.extendData.type;

            // 1. 變更方塊樣式 -> 變灰、虛線
            zone.styles = {
                style: 'stroke_fill',
                color: 'rgba(128, 128, 128, 0.1)', // 灰色
                borderColor: 'rgba(128, 128, 128, 0.5)',
                borderDashedValue: [4, 4]
            };
            chart.overrideOverlay(zone);

            // 2. 找到對應的文字標籤 -> 更新文字為 "已失效"
            const label = overlays.find(o => o.extendData && o.extendData.linkId === linkId && o.name === 'simpleAnnotation');
            if (label) {
                label.styles = {
                    ...label.styles,
                    text: {
                        ...label.styles.text,
                        content: `[${tf}] ${type} (已失效)`, 
                        backgroundColor: '#757575', // 灰色背景
                        color: '#DDDDDD'
                    }
                };
                chart.overrideOverlay(label);
            }
        }
    });
};

/**
 * 輔助：建立文字標籤
 */
const createLabel = (chart, time, price, text, bgColor, linkId, timeframe, type) => {
    chart.createOverlay({
        name: 'simpleAnnotation',
        groupId: 'SMC', // 預設群組 (未固定)
        extendData: { isSMC: true, linkId, timeframe, type }, 
        points: [{ timestamp: time, value: price }],
        styles: {
            text: {
                color: '#FFFFFF',
                size: 11,
                family: 'Arial',
                weight: 'bold',
                content: text, // 預設只顯示 "FVG" 或 "BOS"，不含時間
                offset: [0, -8],
                paddingLeft: 6,
                paddingRight: 6,
                paddingTop: 3,
                paddingBottom: 3,
                backgroundColor: bgColor,
                borderRadius: 4,
                borderSize: 0
            }
        },
        lock: false 
    });
};

const calculateATR = (data, period = 14) => {
    if (data.length < period) return Array(data.length).fill(0);
    let trs = [];
    for (let i = 1; i < data.length; i++) {
        const h = data[i].high;
        const l = data[i].low;
        const cp = data[i-1].close;
        trs.push(Math.max(h - l, Math.abs(h - cp), Math.abs(l - cp)));
    }
    let atrs = Array(data.length).fill(0);
    let sum = 0;
    for (let i = 0; i < period; i++) sum += trs[i];
    atrs[period] = sum / period;
    for (let i = period + 1; i < data.length; i++) {
        atrs[i] = ((atrs[i - 1] * (period - 1)) + trs[i - 1]) / period;
    }
    return atrs;
};

export const toggleSMC = (chart, isShow, klineData, timeframe) => {
    if (!chart) return;
    
    // 1. 清除未固定的舊圖
    removeSMC(chart);

    if (!isShow || !Array.isArray(klineData) || klineData.length < 100) return;

    try {
        const len = klineData.length;
        const lastTime = klineData[len - 1].timestamp;
        const atrs = calculateATR(klineData, 14);
        
        // 確保 timeframe 是字串，並提供預設值
        const tfString = (timeframe && typeof timeframe === 'string') ? timeframe : 'Current';

        // 1. FVG
        const fvgLookback = 300; 
        const fvgStartIndex = Math.max(14, len - fvgLookback);

        for (let i = fvgStartIndex; i < len - 2; i++) {
            const c1 = klineData[i];
            const c3 = klineData[i+2];
            const currentATR = atrs[i];
            const minGap = currentATR * 0.3;

            // Bullish FVG
            if (c1.high < c3.low && (c3.low - c1.high) > minGap) {
                let isMitigated = false;
                for (let k = i + 3; k < len; k++) if (klineData[k].low <= c1.high) { isMitigated = true; break; }
                if (!isMitigated) {
                    const linkId = generateId(); // 產生連結 ID
                    chart.createOverlay({
                        name: 'rect',
                        groupId: 'SMC', // 未固定
                        extendData: { isSMC: true, linkId, timeframe: tfString, type: 'FVG', isMitigated: false },
                        points: [{ timestamp: c1.timestamp, value: c1.high }, { timestamp: lastTime, value: c3.low }],
                        styles: { style: 'stroke_fill', color: 'rgba(255, 215, 0, 0.15)', borderColor: 'rgba(255, 215, 0, 0.6)', borderDashedValue: [2, 2] },
                        lock: false
                    });
                    // 預設標籤只顯示 "FVG"
                    if (len - i < 80) createLabel(chart, c1.timestamp, c3.low, "FVG", '#FBC02D', linkId, tfString, 'FVG');
                }
            }

            // Bearish FVG
            if (c1.low > c3.high && (c1.low - c3.high) > minGap) {
                let isMitigated = false;
                for (let k = i + 3; k < len; k++) if (klineData[k].high >= c1.low) { isMitigated = true; break; }
                if (!isMitigated) {
                    const linkId = generateId();
                    chart.createOverlay({
                        name: 'rect',
                        groupId: 'SMC',
                        extendData: { isSMC: true, linkId, timeframe: tfString, type: 'FVG', isMitigated: false },
                        points: [{ timestamp: c1.timestamp, value: c1.low }, { timestamp: lastTime, value: c3.high }],
                        styles: { style: 'stroke_fill', color: 'rgba(255, 215, 0, 0.15)', borderColor: 'rgba(255, 215, 0, 0.6)', borderDashedValue: [2, 2] },
                        lock: false
                    });
                    if (len - i < 80) createLabel(chart, c1.timestamp, c1.low, "FVG", '#FBC02D', linkId, tfString, 'FVG');
                }
            }
        }

        // 2. OB
        const obLookback = 200;
        const obStartIndex = Math.max(14, len - obLookback);
        const validOBs = [];
        for (let i = obStartIndex; i < len - 3; i++) {
            const prev = klineData[i];
            const curr = klineData[i + 1];
            const currentATR = atrs[i];
            const currBody = Math.abs(curr.close - curr.open);
            const isStrongMove = currBody > currentATR * 0.8; 
            const isRed = prev.close < prev.open;
            const isGreen = prev.close > prev.open;
            const isEngulfing = curr.close > curr.open && curr.close > prev.high;
            const isBearishEngulfing = curr.close < curr.open && curr.close < prev.low;
            
            if (isRed && isEngulfing && isStrongMove) {
                let isBroken = false;
                for (let k = i + 2; k < len; k++) if (klineData[k].close < prev.low) { isBroken = true; break; }
                if (!isBroken) validOBs.push({ type: 'bullish', x: prev.timestamp, y1: prev.high, y2: prev.low, lastTime: lastTime });
            }

            if (isGreen && isBearishEngulfing && isStrongMove) {
                let isBroken = false;
                for (let k = i + 2; k < len; k++) if (klineData[k].close > prev.high) { isBroken = true; break; }
                if (!isBroken) validOBs.push({ type: 'bearish', x: prev.timestamp, y1: prev.high, y2: prev.low, lastTime: lastTime });
            }
        }
        
        validOBs.slice(-3).forEach(ob => {
            const linkId = generateId();
            const color = ob.type === 'bullish' ? 'rgba(8, 153, 129, 0.25)' : 'rgba(242, 54, 69, 0.25)';
            const borderColor = ob.type === 'bullish' ? '#089981' : '#F23645';
            const bg = ob.type === 'bullish' ? '#089981' : '#F23645';
            const text = ob.type === 'bullish' ? "Bull OB" : "Bear OB";

            chart.createOverlay({
                name: 'rect',
                groupId: 'SMC',
                extendData: { isSMC: true, linkId, timeframe: tfString, type: 'OB', isMitigated: false },
                points: [{ timestamp: ob.x, value: ob.y1 }, { timestamp: ob.lastTime, value: ob.y2 }],
                styles: { style: 'stroke_fill', color: color, borderColor: borderColor },
                lock: false
            });
            createLabel(chart, ob.x, ob.type === 'bullish' ? ob.y2 : ob.y1, text, bg, linkId, tfString, 'OB');
        });

        // 3. Structure
        const pivotLen = 5;
        const structStartIndex = Math.max(pivotLen, len - 300);
        let lastHigh = null;
        let lastLow = null;
        let currentTrend = 0; 

        for (let i = structStartIndex; i < len - pivotLen; i++) {
            const c = klineData[i];
            
            let isPivotHigh = true;
            for(let j=1; j<=pivotLen; j++) if(klineData[i-j].high > c.high || klineData[i+j].high > c.high) isPivotHigh = false;
            let isPivotLow = true;
            for(let j=1; j<=pivotLen; j++) if(klineData[i-j].low < c.low || klineData[i+j].low < c.low) isPivotLow = false;

            if (isPivotHigh) lastHigh = { price: c.high, time: c.timestamp, index: i };
            if (isPivotLow) lastLow = { price: c.low, time: c.timestamp, index: i };

            if (lastHigh && i > lastHigh.index + pivotLen && c.close > lastHigh.price) {
                const type = (currentTrend >= 0) ? "BOS" : "CHoCH";
                currentTrend = 1;
                if (len - i < 150) {
                    const linkId = generateId();
                    chart.createOverlay({
                        name: 'segment',
                        groupId: 'SMC',
                        extendData: { isSMC: true, linkId, timeframe: tfString, type },
                        points: [{ timestamp: lastHigh.time, value: lastHigh.price }, { timestamp: c.timestamp, value: lastHigh.price }],
                        styles: { line: { color: '#2962FF', style: 'solid', size: 1 } },
                        lock: false
                    });
                    createLabel(chart, c.timestamp, lastHigh.price, type, '#2962FF', linkId, tfString, type);
                    lastHigh = null; 
                }
            }
            if (lastLow && i > lastLow.index + pivotLen && c.close < lastLow.price) {
                const type = (currentTrend <= 0) ? "BOS" : "CHoCH";
                currentTrend = -1;
                if (len - i < 150) {
                    const linkId = generateId();
                    chart.createOverlay({
                        name: 'segment',
                        groupId: 'SMC',
                        extendData: { isSMC: true, linkId, timeframe: tfString, type },
                        points: [{ timestamp: lastLow.time, value: lastLow.price }, { timestamp: c.timestamp, value: lastLow.price }],
                        styles: { line: { color: '#F23645', style: 'solid', size: 1 } },
                        lock: false
                    });
                    createLabel(chart, c.timestamp, lastLow.price, type, '#F23645', linkId, tfString, type);
                    lastLow = null;
                }
            }
        }
    } catch (err) {
        console.error("SMC Calculation Crash:", err);
    }
};