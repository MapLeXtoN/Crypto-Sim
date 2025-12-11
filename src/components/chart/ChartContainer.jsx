// src/components/chart/ChartContainer.jsx [恢復點擊啟動版]

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { init, dispose } from 'klinecharts';
import ChartUI from './ChartUI';

// 引用指標模組
import { toggleEMA } from './EMA.jsx';
import { toggleVOL } from './VOL.jsx';
import { toggleMACD } from './MACD.jsx';
import { toggleRSI } from './RSI.jsx';

const ChartContainer = ({ 
    symbol, timeframe, setTimeframe, klineData, 
    loading, apiError, showTimeMenu, setShowTimeMenu, 
    favorites, toggleFavorite 
}) => {
    const chartContainerRef = useRef(null);
    const chartInstance = useRef(null);
    
    // 預設為 false，這樣一開始就會顯示「啟動按鈕」
    const [chartReadyState, setChartReadyState] = useState(false);

    // 指標狀態
    const [indicators, setIndicators] = useState({
        EMA: true, VOL: true, MACD: false, RSI: false
    });

    const [indicatorSettings, setIndicatorSettings] = useState({
        EMA: { periods: [20, 50, 200], colors: ['#FF9600', '#2196F3', '#E91E63'] },
        VOL: { showMA: true, maPeriod: 20 },
        MACD: { fast: 12, slow: 26, signal: 9 },
        RSI: { period: 14, color: '#9c27b0' }
    });

    const [activeSettingModal, setActiveSettingModal] = useState(null);
    const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);

    // 樣式設定
    const themeOptions = {
        grid: { horizontal: { color: '#2B3139' }, vertical: { color: '#2B3139' } },
        candle: { 
            bar: { upColor: '#089981', downColor: '#F23645', noChangeColor: '#888888' }, 
            priceMark: { high: { color: '#888888' }, low: { color: '#888888' } } 
        },
        background: { color: '#131722' },
        crosshair: { 
            horizontal: { line: { style: 'dashed', color: '#758696' }, text: { background: { color: '#2B3139' } } }, 
            vertical: { line: { style: 'dashed', color: '#758696' }, text: { background: { color: '#2B3139' } } } 
        },
        xAxis: { tickText: { color: '#848e9c' } },
        yAxis: { tickText: { color: '#848e9c' } }
    };

    // --- 核心數據清洗 (依然保留，防止崩潰) ---
    const cleanData = useMemo(() => {
        if (!Array.isArray(klineData) || klineData.length === 0) return [];

        const validData = klineData.filter(item => 
            item && typeof item === 'object' && 
            typeof item.close === 'number' && 
            typeof item.timestamp === 'number'
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

    // 指標應用邏輯
    const applyIndicator = (name, isOpen, currentSettings = null) => {
        if (!chartInstance.current) return;
        const dataList = chartInstance.current.getDataList();
        if (!dataList || dataList.length === 0) return;

        const settings = currentSettings || indicatorSettings[name]; 

        switch (name) {
            case 'EMA': toggleEMA(chartInstance.current, isOpen, settings); break;
            case 'VOL': toggleVOL(chartInstance.current, isOpen, settings); break;
            case 'MACD': toggleMACD(chartInstance.current, isOpen, settings); break;
            case 'RSI': toggleRSI(chartInstance.current, isOpen, settings); break;
        }
    };

    const handleToggleIndicator = (name) => {
        setIndicators(prev => {
            const newState = { ...prev, [name]: !prev[name] };
            applyIndicator(name, newState[name]);
            return newState;
        });
    };

    const handleSaveSettings = (name, newSettings) => {
        setIndicatorSettings(prev => ({ ...prev, [name]: newSettings }));
        setActiveSettingModal(null);
        if (indicators[name]) {
            applyIndicator(name, true, newSettings);
        }
    };

    // --- 1. 初始化圖表 (邏輯修改處) ---
    useEffect(() => {
        // 🚨 關鍵改變：如果使用者還沒按「啟動」(chartReadyState 為 false)，就不初始化
        if (!chartReadyState) return;

        // 如果按了啟動，但還沒數據，也不初始化 (等待數據)
        if (cleanData.length === 0) return;
        
        // 如果 DOM 還沒出來，也不初始化
        if (!chartContainerRef.current) return;
        
        // 防止重複 Init
        if (chartInstance.current) return;

        try {
            const chart = init(chartContainerRef.current);
            chart.setStyles(themeOptions);
            chart.applyNewData(cleanData);
            
            chartInstance.current = chart;
            
            // 初始化完成後，加上預設指標
            Object.keys(indicators).forEach(key => {
                if (indicators[key]) {
                    applyIndicator(key, true);
                }
            });

        } catch (err) {
            console.error("Chart Init Error:", err);
            // 如果失敗，把狀態改回 false，讓使用者可以重試
            setChartReadyState(false);
        }

        return () => {
            if (chartInstance.current) {
                dispose(chartInstance.current);
                chartInstance.current = null;
            }
        };
    }, [chartReadyState, cleanData]); // 這裡加入了 chartReadyState 依賴

    // --- 2. 數據更新 ---
    useEffect(() => {
        // 只有在圖表已經建立的情況下才更新
        if (!chartInstance.current || cleanData.length === 0) return;
        chartInstance.current.applyNewData(cleanData);
    }, [cleanData]);

    // UI Helpers
    const setDrawTool = (toolName) => { 
        if (chartInstance.current && toolName) chartInstance.current.createOverlay(toolName);
    };
    
    const clearAllShapes = () => { 
        if (chartInstance.current) chartInstance.current.removeOverlay(); 
    };

    return (
        <ChartUI 
            timeframe={timeframe} 
            setTimeframe={setTimeframe}
            loading={loading}
            apiError={apiError}
            showTimeMenu={showTimeMenu}
            setShowTimeMenu={setShowTimeMenu}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            
            // 這裡把狀態傳給 ChartUI，它會根據 true/false 決定顯示按鈕還是圖表
            chartReadyState={chartReadyState}
            setChartReadyState={setChartReadyState}
            
            setDrawTool={setDrawTool}
            clearAllShapes={clearAllShapes}
            containerRef={chartContainerRef}
            
            indicators={indicators}
            indicatorSettings={indicatorSettings}
            showIndicatorMenu={showIndicatorMenu}
            setShowIndicatorMenu={setShowIndicatorMenu}
            handleToggleIndicator={handleToggleIndicator}
            
            activeSettingModal={activeSettingModal}
            setActiveSettingModal={setActiveSettingModal}
            handleSaveSettings={handleSaveSettings}
        />
    );
};

export default React.memo(ChartContainer);