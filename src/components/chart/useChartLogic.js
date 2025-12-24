// src/components/chart/useChartLogic.js
import { useEffect, useRef, useMemo } from 'react';
import { init, dispose } from 'klinecharts';

import { toggleEMA } from './EMA';
import { toggleVOL } from './VOL';
import { toggleMACD } from './MACD';
import { toggleRSI } from './RSI';

export const useChartLogic = ({ 
    chartReadyState, 
    setChartReadyState, 
    klineData, 
    themeOptions, 
    indicators, 
    indicatorSettings,
    symbol 
}) => {
    const chartContainerRef = useRef(null);
    const chartInstance = useRef(null);
    // 紀錄最後一次成功渲染的幣種，用於判斷切換
    const lastRenderedSymbol = useRef(symbol);

    // 數據淨化與過濾
    const cleanData = useMemo(() => {
        if (!Array.isArray(klineData) || klineData.length === 0) return [];
        
        const validData = klineData.filter(item => 
            item && 
            typeof item === 'object' && 
            typeof item.timestamp === 'number' && !isNaN(item.timestamp) &&
            typeof item.open === 'number' && !isNaN(item.open) &&
            typeof item.high === 'number' && !isNaN(item.high) &&
            typeof item.low === 'number' && !isNaN(item.low) &&
            typeof item.close === 'number' && !isNaN(item.close) &&
            typeof item.volume === 'number' && !isNaN(item.volume)
        );

        if (validData.length === 0) return [];

        const firstTime = validData[0].timestamp;
        const needsMultiplier = firstTime < 10000000000; 
        const processed = validData.map(item => ({
            ...item,
            timestamp: needsMultiplier ? item.timestamp * 1000 : item.timestamp
        }));

        const uniqueMap = new Map();
        processed.forEach(item => uniqueMap.set(item.timestamp, item));
        
        return Array.from(uniqueMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    }, [klineData]);

    const applyIndicator = (name, isOpen, currentSettings = null) => {
        if (!chartInstance.current) return;
        try {
            const list = chartInstance.current.getDataList();
            if (!list || list.length === 0) return;
            const settings = currentSettings || indicatorSettings[name]; 
            switch (name) {
                case 'EMA': toggleEMA(chartInstance.current, isOpen, settings); break;
                case 'VOL': toggleVOL(chartInstance.current, isOpen, settings); break;
                case 'MACD': toggleMACD(chartInstance.current, isOpen, settings); break;
                case 'RSI': toggleRSI(chartInstance.current, isOpen, settings); break;
                default: break;
            }
        } catch (e) {}
    };

    // 初始化圖表實例
    useEffect(() => {
        if (!chartReadyState || !chartContainerRef.current) return;
        if (chartInstance.current) return;
        
        try {
            const chart = init(chartContainerRef.current);
            chart.setStyles(themeOptions);
            chartInstance.current = chart;
            
            if (cleanData.length > 0) {
                const lastPrice = cleanData[cleanData.length - 1].close;
                const precision = lastPrice < 0.1 ? 6 : lastPrice < 1 ? 4 : 2;
                chart.setPriceVolumePrecision(precision, 2);
                chart.applyNewData(cleanData);
                chart.executeAction('fitView');
                Object.keys(indicators).forEach(key => { if (indicators[key]) applyIndicator(key, true); });
            }
        } catch (err) {
            console.error("[Chart] Init Error:", err);
            setChartReadyState(false);
        }
        
        return () => { 
            if (chartInstance.current) { 
                dispose(chartInstance.current); 
                chartInstance.current = null; 
            } 
        };
    }, [chartReadyState]); 

    // 🚀 核心修復：數據同步與幣種切換邏輯
    useEffect(() => {
        if (!chartInstance.current) return;
        const chart = chartInstance.current;

        // 偵測是否更換了幣種
        const isSymbolChanged = lastRenderedSymbol.current !== symbol;

        // 如果幣種切換，且目前的 cleanData 還是舊的 (由 App.jsx 尚未更新導致)
        // 則立即清空圖表，防止舊數據誤導
        if (isSymbolChanged) {
            chart.applyNewData([]); // 強制清空緩存
            lastRenderedSymbol.current = symbol; // 同步標記
            return; // 等待下一次 cleanData 更新後再畫圖
        }

        if (cleanData.length === 0) return;

        const currentDataList = chart.getDataList();
        const oldDataLength = currentDataList.length;
        
        // 判斷是否需要全量重繪
        const isHeadChanged = oldDataLength > 0 && cleanData[0]?.timestamp !== currentDataList[0]?.timestamp;
        const isLengthShrink = cleanData.length < oldDataLength;

        if (oldDataLength === 0 || isHeadChanged || isLengthShrink) {
            // 針對低價幣 (DOGE) 處理精度與縮放
            const lastPrice = cleanData[cleanData.length - 1].close;
            const precision = lastPrice < 0.1 ? 6 : lastPrice < 1 ? 4 : 2;
            chart.setPriceVolumePrecision(precision, 2);

            chart.applyNewData(cleanData);
            
            // 強制觸發一次視圖回正，解決切換後扁平問題
            setTimeout(() => {
                chart.executeAction('fitView');
            }, 50);
        } else {
            // 同一幣種的增量更新
            const latestData = cleanData[cleanData.length - 1];
            if (latestData && typeof latestData.close === 'number' && !isNaN(latestData.close)) {
                chart.updateData(latestData);
            }
        }
    }, [cleanData, symbol]); // 必須同時依賴數據與幣種標籤

    return { chartContainerRef, chartInstance, applyIndicator };
};