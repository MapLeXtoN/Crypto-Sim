// src/components/chart/ChartContainer.jsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ChartUI from './ChartUI';
import { Trash2 } from 'lucide-react';

import { useChartLogic } from './useChartLogic'; 
import { useDrawingTools } from './useDrawingTools';

const ChartContainer = ({ 
    symbol, timeframe, setTimeframe, klineData, 
    loading, apiError, showTimeMenu, setShowTimeMenu, 
    favorites, toggleFavorite,
    activeGrid 
}) => {
    // 🔥 修正 1：預設改回 false，並在 useEffect 中設為 true
    // 這樣可以確保 div ref 已經掛載到 DOM 上，避免 init(null) 導致圖表空白
    const [chartReadyState, setChartReadyState] = useState(false);

    useEffect(() => {
        setChartReadyState(true);
    }, []);
    
    // UI 狀態
    const [activeToolName, setActiveToolName] = useState(null);
    const [magnetMode, setMagnetMode] = useState(false);

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

    const themeOptions = useMemo(() => ({
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
    }), []);

    const { chartContainerRef, chartInstance, applyIndicator } = useChartLogic({
        chartReadyState,
        setChartReadyState,
        klineData,
        themeOptions,
        indicators,
        indicatorSettings
    });

    const requestRef = useRef();

    // Resize Logic - 更加安全的寫法
    useEffect(() => {
        // 只有當 chartInstance 存在且 ref 存在時才監聽
        if (!chartInstance || !chartContainerRef?.current) return;
        
        const resizeObserver = new ResizeObserver((entries) => {
            if (requestRef.current) return;
            requestRef.current = requestAnimationFrame(() => {
                if (entries[0] && chartInstance) {
                    const { width, height } = entries[0].contentRect;
                    // 增加檢查：確保寬高有效
                    if (width > 0 && height > 0 && typeof chartInstance.resize === 'function') {
                        chartInstance.resize(width, height);
                    }
                }
                requestRef.current = null;
            });
        });

        resizeObserver.observe(chartContainerRef.current);

        const handleLayoutResize = () => { if(chartInstance) chartInstance.resize(); };
        window.addEventListener('layout-resize', handleLayoutResize);
        const handleFullscreenChange = () => { if (chartInstance) chartInstance.resize(); };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('layout-resize', handleLayoutResize);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [chartInstance]); // 移除 chartContainerRef 依賴，因为它是一個 ref，變化不會觸發 effect

    // 🔥🔥🔥 網格線繪製邏輯 (安全修正版) 🔥🔥🔥
    const gridOverlayIds = useRef([]); 

    useEffect(() => {
        // 1. 基礎檢查：嚴格確保數據存在
        if (!chartInstance || !klineData || klineData.length < 2) return;

        // 使用 setTimeout 確保圖表已經消化了最新的數據
        const timer = setTimeout(() => {
            // 安全檢查：確保方法存在
            if (typeof chartInstance.createOverlay !== 'function' || typeof chartInstance.removeOverlay !== 'function') {
                return;
            }

            try {
                // 移除舊的線條
                gridOverlayIds.current.forEach(id => {
                    try { chartInstance.removeOverlay(id); } catch(e) {}
                });
                gridOverlayIds.current = [];

                if (activeGrid && Array.isArray(activeGrid.gridLines)) {
                    
                    // 安全獲取時間戳
                    const firstData = klineData[0];
                    const lastData = klineData[klineData.length - 1];

                    if (!firstData || !lastData) return;

                    const startTs = firstData.timestamp;
                    const endTs = lastData.timestamp;

                    // 確保時間戳是有效數字
                    if (typeof startTs === 'number' && typeof endTs === 'number') {
                        
                        const drawLine = (price, color, isSolid = false) => {
                            const numericPrice = Number(price);
                            if (!Number.isFinite(numericPrice)) return;

                            const id = chartInstance.createOverlay({
                                name: 'segment', 
                                lock: true,
                                points: [
                                    { timestamp: startTs, value: numericPrice },
                                    { timestamp: endTs, value: numericPrice }
                                ],
                                styles: { 
                                    line: { 
                                        style: 'solid', 
                                        color: color, 
                                        width: isSolid ? 2 : 1 
                                    }
                                }
                            });
                            if (id) gridOverlayIds.current.push(id);
                        };

                        // A. 畫中間的網格線
                        activeGrid.gridLines.forEach(line => {
                            const color = line.type === 'buy' ? '#089981' : '#F23645'; 
                            drawLine(line.price, color);
                        });

                        // B. 畫上下邊界
                        if(activeGrid.gridUpper) drawLine(activeGrid.gridUpper, '#eaecef', true);
                        if(activeGrid.gridLower) drawLine(activeGrid.gridLower, '#eaecef', true);
                    }
                }
            } catch (error) {
                console.warn("Grid draw safe-fail:", error);
            }
        }, 100); // 縮短延遲

        return () => clearTimeout(timer);

    }, [activeGrid, chartInstance, klineData]); // 依賴項正確

    const handleDrawingCancel = useCallback(() => { setActiveToolName(null); }, []);
    
    const { setDrawTool, removeOverlayById, clearAllShapes, overlayMenu, setOverlayMenu } = useDrawingTools(chartInstance, handleDrawingCancel, magnetMode);
    
    const handleSelectTool = (toolValue, toolLabel) => { setDrawTool(toolValue); setActiveToolName(toolLabel); };
    const handleResetCursor = () => { setDrawTool(null); setActiveToolName(null); };
    const handleToggleIndicator = (name) => { setIndicators(prev => { const newState = { ...prev, [name]: !prev[name] }; applyIndicator(name, newState[name]); return newState; }); };
    const handleSaveSettings = (name, newSettings) => { setIndicatorSettings(prev => ({ ...prev, [name]: newSettings })); setActiveSettingModal(null); if (indicators[name]) applyIndicator(name, true, newSettings); };

    return (
        <div className="relative flex-1 flex flex-col h-full w-full overflow-hidden min-w-0">
            <ChartUI 
                timeframe={timeframe} setTimeframe={setTimeframe} loading={loading} apiError={apiError} showTimeMenu={showTimeMenu} setShowTimeMenu={setShowTimeMenu} favorites={favorites} toggleFavorite={toggleFavorite}
                chartReadyState={chartReadyState} setChartReadyState={setChartReadyState} containerRef={chartContainerRef}
                activeToolName={activeToolName} onSelectTool={handleSelectTool} onResetCursor={handleResetCursor} clearAllShapes={clearAllShapes} magnetMode={magnetMode} setMagnetMode={setMagnetMode}
                indicators={indicators} indicatorSettings={indicatorSettings} showIndicatorMenu={showIndicatorMenu} setShowIndicatorMenu={setShowIndicatorMenu} handleToggleIndicator={handleToggleIndicator}
                activeSettingModal={activeSettingModal} setActiveSettingModal={setActiveSettingModal} handleSaveSettings={handleSaveSettings}
            />
            {overlayMenu.visible && (
                <div className="fixed z-[9999] bg-[#1e2329] border border-[#474d57] rounded shadow-xl py-1 text-sm text-[#eaecef]" style={{ top: overlayMenu.y, left: overlayMenu.x }} onClick={(e) => e.stopPropagation()}>
                    <div className="px-4 py-2 hover:bg-[#2b3139] cursor-pointer flex items-center gap-2 text-red-400" onClick={() => removeOverlayById(overlayMenu.overlayId)}><Trash2 size={14} /><span>刪除此物件</span></div>
                    <div className="px-4 py-2 hover:bg-[#2b3139] cursor-pointer text-gray-400" onClick={() => setOverlayMenu(prev => ({ ...prev, visible: false }))}><span>取消</span></div>
                </div>
            )}
            {overlayMenu.visible && <div className="fixed inset-0 z-[9998]" onClick={() => setOverlayMenu(prev => ({ ...prev, visible: false }))} />}
        </div>
    );
};

export default React.memo(ChartContainer);