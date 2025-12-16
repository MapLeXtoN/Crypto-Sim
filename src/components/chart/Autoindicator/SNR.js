// src/components/chart/Autoindicator/SNR.js

export const removeSNR = (chart) => {
    if (!chart) return;
    try {
        const overlays = chart.getOverlayList();
        const targets = overlays.filter(o => o.extendData && o.extendData.isSNR);
        targets.forEach(t => chart.removeOverlay(t.id));
    } catch (e) {
        console.error("Remove SNR Error:", e);
    }
};

export const toggleSNR = (chart, isShow, klineData) => {
    if (!chart) return;
    
    // 1. 清除舊線
    removeSNR(chart);

    if (!isShow || !Array.isArray(klineData) || klineData.length < 50) return;

    try {
        const leftLen = 10;
        const rightLen = 5;
        const len = klineData.length;
        const startIndex = Math.max(leftLen, len - 1000); 

        const validPivots = [];

        for (let i = startIndex; i < len - rightLen; i++) {
            const candle = klineData[i];
            if (!candle) continue;

            const high = candle.high;
            const low = candle.low;

            // --- 判斷 Pivot High (壓力) ---
            let isPivotHigh = true;
            for (let j = 1; j <= leftLen; j++) {
                if (klineData[i - j] && klineData[i - j].high > high) { isPivotHigh = false; break; }
            }
            if (isPivotHigh) {
                for (let j = 1; j <= rightLen; j++) {
                    if (klineData[i + j] && klineData[i + j].high > high) { isPivotHigh = false; break; }
                }
            }

            // --- 判斷 Pivot Low (支撐) ---
            let isPivotLow = true;
            for (let j = 1; j <= leftLen; j++) {
                if (klineData[i - j] && klineData[i - j].low < low) { isPivotLow = false; break; }
            }
            if (isPivotLow) {
                for (let j = 1; j <= rightLen; j++) {
                    if (klineData[i + j] && klineData[i + j].low < low) { isPivotLow = false; break; }
                }
            }

            // --- 過濾已測試 (Mitigation Check) ---
            if (isPivotHigh) {
                let isBroken = false;
                for (let k = i + rightLen + 1; k < len; k++) {
                    if (klineData[k].high > high) { isBroken = true; break; }
                }
                if (!isBroken) validPivots.push({ type: 'resistance', price: high, time: candle.timestamp });
            }

            if (isPivotLow) {
                let isBroken = false;
                for (let k = i + rightLen + 1; k < len; k++) {
                    if (klineData[k].low < low) { isBroken = true; break; }
                }
                if (!isBroken) validPivots.push({ type: 'support', price: low, time: candle.timestamp });
            }
        }

        // 4. 繪製
        const lastTime = klineData[len - 1].timestamp;

        validPivots.forEach(p => {
            const color = p.type === 'resistance' ? '#F23645' : '#089981';
            chart.createOverlay({
                name: 'segment',
                extendData: { isSNR: true },
                points: [
                    { timestamp: p.time, value: p.price },
                    { timestamp: lastTime, value: p.price }
                ],
                styles: { line: { color: color, style: 'solid', size: 1, dashedValue: [4, 4] } },
                lock: true
            });
        });

    } catch (err) {
        console.error("SNR Calculation Crash:", err);
    }
};