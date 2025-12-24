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
    const [chartReadyState, setChartReadyState] = useState(false);

    useEffect(() => {
        setChartReadyState(true);
    }, []);
    
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
        indicatorSettings,
        symbol // 傳入幣種
    });

    // 🛠️ 必須修復：雙擊右側價格軸重置視圖
    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container || !chartInstance.current) return;

        const handleDblClick = (e) => {
            const rect = container.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const containerWidth = rect.width;
            
            // 判斷是否雙擊在右側價格刻度欄 (約佔寬度 10%)
            if (clickX > containerWidth * 0.9) {
                if (typeof chartInstance.current.executeAction === 'function') {
                    // fitView 會重置 Y 軸縮放、位移並自適應當前顯示區域
                    chartInstance.current.executeAction('fitView');
                }
            }
        };

        container.addEventListener('dblclick', handleDblClick);
        return () => container.removeEventListener('dblclick', handleDblClick);
    }, [chartInstance]);

    const requestRef = useRef();

    // Resize 邏輯
    useEffect(() => {
        if (!chartInstance.current || !chartContainerRef?.current) return;
        
        const resizeObserver = new ResizeObserver((entries) => {
            if (requestRef.current) return;
            requestRef.current = requestAnimationFrame(() => {
                if (entries[0] && chartInstance.current) {
                    const { width, height } = entries[0].contentRect;
                    if (width > 0 && height > 0) {
                        chartInstance.current.resize();
                    }
                }
                requestRef.current = null;
            });
        });

        resizeObserver.observe(chartContainerRef.current);
        
        return () => {
            resizeObserver.disconnect();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [chartInstance]);

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