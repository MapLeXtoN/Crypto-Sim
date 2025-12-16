// src/components/chart/useDrawingTools.js

import { useState, useRef, useEffect } from 'react';
import { registerOverlay } from 'klinecharts';

// 註冊自定義工具 (保持原樣)
registerOverlay({
    name: 'rect',
    totalStep: 3,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: true,
    needDefaultYAxisFigure: true,
    createPointFigures: ({ coordinates }) => {
        if (coordinates.length === 2) {
            const x1 = coordinates[0].x;
            const y1 = coordinates[0].y;
            const x2 = coordinates[1].x;
            const y2 = coordinates[1].y;
            return [{
                type: 'polygon',
                attrs: {
                    coordinates: [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }]
                },
                styles: { style: 'stroke_fill', color: 'rgba(240, 185, 11, 0.2)', borderColor: '#f0b90b', borderSize: 1 }
            }];
        }
        return [];
    }
});

registerOverlay({
    name: 'circle',
    totalStep: 3,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: true,
    needDefaultYAxisFigure: true,
    createPointFigures: ({ coordinates }) => {
        if (coordinates.length === 2) {
            const x1 = coordinates[0].x;
            const y1 = coordinates[0].y;
            const x2 = coordinates[1].x;
            const y2 = coordinates[1].y;
            const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            return [{
                type: 'circle',
                attrs: { x: x1, y: y1, r: radius },
                styles: { style: 'stroke_fill', color: 'rgba(33, 150, 243, 0.2)', borderColor: '#2196F3', borderSize: 1 }
            }];
        }
        return [];
    }
});

registerOverlay({
    name: 'triangle',
    totalStep: 4,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: true,
    needDefaultYAxisFigure: true,
    createPointFigures: ({ coordinates }) => {
        return [{
            type: 'polygon',
            attrs: { coordinates: coordinates },
            styles: { style: 'stroke_fill', color: 'rgba(233, 30, 99, 0.2)', borderColor: '#E91E63', borderSize: 1 }
        }];
    }
});

export const useDrawingTools = (chartInstance, onDrawingCancel, magnetMode) => {
    const selectedOverlayId = useRef(null);
    const isDrawingRef = useRef(false); 
    const activeDrawingId = useRef(null); // 🔥 新增：追蹤當前正在畫的圖形ID
    
    const [overlayMenu, setOverlayMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        overlayId: null
    });

    // 🔥 監聽 magnetMode 變化，即時更新當前畫筆狀態
    useEffect(() => {
        if (isDrawingRef.current && activeDrawingId.current && chartInstance.current) {
            // 如果正在畫圖中，且切換了磁鐵，立刻更新該圖形的 mode
            chartInstance.current.overrideOverlay({
                id: activeDrawingId.current,
                mode: magnetMode ? 'strong_magnet' : 'normal'
            });
            console.log(`Updated active drawing mode to: ${magnetMode ? 'STRONG' : 'NORMAL'}`);
        }
    }, [magnetMode]);

    // 設置畫圖工具
    const setDrawTool = (toolName) => { 
        if (!chartInstance.current) return;
        
        if (!toolName) {
            chartInstance.current.createOverlay(null);
            isDrawingRef.current = false;
            activeDrawingId.current = null;
            return;
        }

        console.log(`Activating Drawing Tool: ${toolName} (Magnet: ${magnetMode ? 'STRONG' : 'OFF'})`);
        isDrawingRef.current = true;

        // 🔥 獲取建立的 overlay ID
        const newOverlayId = chartInstance.current.createOverlay({
            name: toolName,
            // 預設使用強磁鐵 (strong_magnet)
            mode: magnetMode ? 'strong_magnet' : 'normal', 
            
            onRightClick: (eventData) => {
                const nativeEvent = eventData.event || eventData.originalEvent;
                const overlay = eventData.overlay;

                if (nativeEvent && overlay) {
                    nativeEvent.preventDefault && nativeEvent.preventDefault();
                    setOverlayMenu({
                        visible: true,
                        x: nativeEvent.clientX,
                        y: nativeEvent.clientY,
                        overlayId: overlay.id
                    });
                }
                return true;
            },
            onDrawEnd: () => {
                isDrawingRef.current = false; 
                activeDrawingId.current = null; // 畫完清空
                if (onDrawingCancel) onDrawingCancel();
            },
            onClick: (eventData) => {
                if (eventData.overlay) {
                    selectedOverlayId.current = eventData.overlay.id;
                    setOverlayMenu(prev => ({ ...prev, visible: false }));
                }
            }
        });

        // 記錄當前正在畫的 ID
        activeDrawingId.current = newOverlayId;
    };
    
    // 右鍵取消
    useEffect(() => {
        const handleRightClick = (e) => {
            if (isDrawingRef.current && chartInstance.current) {
                e.preventDefault(); 
                e.stopPropagation();
                chartInstance.current.createOverlay(null);
                isDrawingRef.current = false;
                activeDrawingId.current = null;
                if (onDrawingCancel) onDrawingCancel();
                console.log("Drawing Cancelled by Right Click");
            }
        };
        window.addEventListener('contextmenu', handleRightClick, { capture: true });
        return () => window.removeEventListener('contextmenu', handleRightClick, { capture: true });
    }, [chartInstance, onDrawingCancel]);

    // 刪除物件
    const removeOverlayById = (id) => {
        if (chartInstance.current && id) {
            chartInstance.current.removeOverlay(id);
            setOverlayMenu(prev => ({ ...prev, visible: false }));
            selectedOverlayId.current = null;
        }
    };

    // 清除所有
    const clearAllShapes = () => { 
        if (chartInstance.current) {
            chartInstance.current.removeOverlay(); 
            selectedOverlayId.current = null;
            setOverlayMenu(prev => ({ ...prev, visible: false }));
        }
    };

    // 監聽點擊
    useEffect(() => {
        if (!chartInstance.current) return;
        chartInstance.current.subscribeAction('onClick', (data) => {
            if (!data || !data.overlay) {
                selectedOverlayId.current = null;
                setOverlayMenu(prev => ({ ...prev, visible: false }));
            }
        });
    }, [chartInstance.current]);

    // 監聽 Delete
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedOverlayId.current && chartInstance.current) {
                    chartInstance.current.removeOverlay(selectedOverlayId.current);
                    selectedOverlayId.current = null;
                    setOverlayMenu(prev => ({ ...prev, visible: false }));
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [chartInstance]); 

    return {
        setDrawTool,
        removeOverlayById,
        clearAllShapes,
        overlayMenu,
        setOverlayMenu
    };
};