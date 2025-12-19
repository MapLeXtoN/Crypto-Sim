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
    indicatorSettings
}) => {
    const chartContainerRef = useRef(null);
    const chartInstance = useRef(null);

    // 1. 🔥 核心修復：數據淨化過濾網 (Data Sanitization)
    // 這段代碼專門用來解決 "Cannot read properties of undefined (reading 'close')"
    const cleanData = useMemo(() => {
        if (!Array.isArray(klineData) || klineData.length === 0) return [];
        
        // 過濾掉所有不完整的數據
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

        // 時間戳處理 (秒轉毫秒)
        const firstTime = validData[0].timestamp;
        const needsMultiplier = firstTime < 10000000000; 
        const processed = validData.map(item => ({
            ...item,
            timestamp: needsMultiplier ? item.timestamp * 1000 : item.timestamp
        }));

        // 去除重複時間戳 (防止圖表索引錯亂)
        const uniqueMap = new Map();
        processed.forEach(item => uniqueMap.set(item.timestamp, item));
        
        return Array.from(uniqueMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    }, [klineData]);

    // 輔助函式：套用指標
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
        } catch (e) {
            // 忽略指標計算錯誤，避免影響主圖
        }
    };

    // 初始化圖表
    useEffect(() => {
        if (!chartReadyState || !chartContainerRef.current) return;
        if (chartInstance.current) return;
        
        try {
            const chart = init(chartContainerRef.current);
            chart.setStyles(themeOptions);
            chartInstance.current = chart;
            
            if (cleanData.length > 0) {
                chart.applyNewData(cleanData);
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

    // 數據更新邏輯
    useEffect(() => {
        if (!chartInstance.current) return;
        const chart = chartInstance.current;
        
        if (cleanData.length === 0) return;

        const currentDataList = chart.getDataList();
        const oldDataLength = currentDataList.length;
        
        // 判斷是否需要全量重繪 (切換幣種、週期變化、或第一次載入)
        const isHeadChanged = oldDataLength > 0 && cleanData[0]?.timestamp !== currentDataList[0]?.timestamp;
        const isLengthShrink = cleanData.length < oldDataLength;

        if (oldDataLength === 0 || isHeadChanged || isLengthShrink) {
            chart.applyNewData(cleanData);
        } else {
            // 增量更新 (只更新最後一筆，效能較佳)
            const latestData = cleanData[cleanData.length - 1];
            // 🔥 第二道防線：再次確認數據有效才塞入
            if (latestData && typeof latestData.close === 'number' && !isNaN(latestData.close)) {
                chart.updateData(latestData);
            }
        }
    }, [cleanData]); 

    return { chartContainerRef, chartInstance, applyIndicator };
};