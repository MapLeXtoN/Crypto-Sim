// src/components/chart/useChartLogic.js

import { useEffect, useRef, useMemo } from 'react';
import { init, dispose } from 'klinecharts';

import { toggleEMA } from './EMA';
import { toggleVOL } from './VOL';
import { toggleMACD } from './MACD';
import { toggleRSI } from './RSI';
// 移除 SNR 和 SMC 的引用

export const useChartLogic = ({ 
    chartReadyState, 
    setChartReadyState, 
    klineData, 
    themeOptions, 
    indicators, 
    indicatorSettings
    // 移除 timeframe 參數
}) => {
    const chartContainerRef = useRef(null);
    const chartInstance = useRef(null);
    // 移除 indicatorsRef (因為沒有閉包問題需要處理了)

    const cleanData = useMemo(() => {
        if (!Array.isArray(klineData) || klineData.length === 0) return [];
        const validData = klineData.filter(item => 
            item && typeof item === 'object' && typeof item.close === 'number' && typeof item.timestamp === 'number'
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
        const settings = currentSettings || indicatorSettings[name]; 

        switch (name) {
            case 'EMA': toggleEMA(chartInstance.current, isOpen, settings); break;
            case 'VOL': toggleVOL(chartInstance.current, isOpen, settings); break;
            case 'MACD': toggleMACD(chartInstance.current, isOpen, settings); break;
            case 'RSI': toggleRSI(chartInstance.current, isOpen, settings); break;
            // 移除 SNR 和 SMC 的 case
            default: break;
        }
    };

    // 初始化
    useEffect(() => {
        if (!chartReadyState || !chartContainerRef.current) return;
        if (chartInstance.current) return;
        try {
            const chart = init(chartContainerRef.current);
            chart.setStyles(themeOptions);
            chartInstance.current = chart;
            if (cleanData.length > 0) chart.applyNewData(cleanData);
            Object.keys(indicators).forEach(key => { if (indicators[key]) applyIndicator(key, true); });
        } catch (err) {
            console.error("Chart Init Error:", err);
            setChartReadyState(false);
        }
        return () => { if (chartInstance.current) { dispose(chartInstance.current); chartInstance.current = null; } };
    }, [chartReadyState]); 

    // 數據更新
    useEffect(() => {
        if (!chartInstance.current || cleanData.length === 0) return;
        const chart = chartInstance.current;
        const currentDataList = chart.getDataList();
        const oldDataLength = currentDataList.length;
        const isHugeChange = Math.abs(cleanData.length - oldDataLength) > 5;
        const isDifferentSource = oldDataLength > 0 && cleanData[0].timestamp !== currentDataList[0].timestamp;

        if (oldDataLength === 0 || isHugeChange || isDifferentSource) {
            chart.applyNewData(cleanData);
            // 移除 SMC/SNR 的重繪邏輯
        } else {
            const latestData = cleanData[cleanData.length - 1];
            chart.updateData(latestData);
            // 移除 SMC 失效檢測
        }
    }, [cleanData]); 

    return { chartContainerRef, chartInstance, applyIndicator };
};