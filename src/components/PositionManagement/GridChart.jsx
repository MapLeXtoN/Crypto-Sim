// src/components/PositionManagement/GridChart.jsx
import React, { useEffect, useRef } from 'react';
import { init, dispose } from 'klinecharts';

const GridChart = ({ klineData, grid }) => {
    const chartContainerRef = useRef(null);
    const chartInstance = useRef(null);

    // 1. 初始化圖表 (只執行一次)
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // 初始化
        const chart = init(chartContainerRef.current, {
            grid: { horizontal: { color: '#2B3139' }, vertical: { color: '#2B3139' } },
            candle: { 
                bar: { upColor: '#089981', downColor: '#F23645', noChangeColor: '#888888' }, 
                priceMark: { high: { color: '#888888' }, low: { color: '#888888' } } 
            },
            background: { color: '#0b0e11' },
            xAxis: { tickText: { color: '#848e9c' } },
            yAxis: { tickText: { color: '#848e9c' } }
        });
        
        chartInstance.current = chart;

        // 銷毀時的清理
        return () => {
            dispose(chartContainerRef.current);
            chartInstance.current = null;
        };
    }, []); // 空陣列，保證只初始化一次

    // 2. 數據更新與畫線 (當數據變動時執行)
    useEffect(() => {
        const chart = chartInstance.current;
        if (!chart || !grid) return;

        // A. 更新 K 線數據
        if (klineData && klineData.length > 0) {
            // 這裡直接用 applyNewData 防止索引錯亂，網格圖表數據量不大，效能沒問題
            chart.applyNewData(klineData);
        }

        // B. 繪製網格線 (先清除舊的)
        chart.removeOverlay();

        // 延遲一點點確保數據載入後再畫線
        const timer = setTimeout(() => {
            if (!chart) return;

            const drawLine = (price, color, isSolid = false) => {
                if (!price) return;
                try {
                    chart.createOverlay({
                        name: 'simpleAnnotation',
                        extendData: 'Line',
                        points: [{ timestamp: klineData[klineData.length - 1]?.timestamp, value: price }],
                        styles: {
                            line: {
                                style: 'solid', 
                                color: color,
                                width: isSolid ? 2 : 1,
                                dashedValue: isSolid ? [] : [4, 4] 
                            }
                        },
                        // 讓線條水平延伸到整個畫面
                        lock: true,
                        mode: 'weak_magnet',
                        onDraw: ({ ctx, point }) => {
                            // 自定義繪製水平線 (KLineCharts 預設的 simpleAnnotation 可能只是一個點)
                            // 這裡使用內建的 'priceLine' 可能會更好，或者簡單用 overlay
                        }
                    });
                    
                    // 替代方案：使用 simpleTag 或 priceLine
                    // 這裡為了簡單，我們改用 createShape 畫水平線的邏輯太複雜
                    // 建議使用 createOverlay 畫 'priceLine' 
                    chart.createOverlay({
                        name: 'priceLine',
                        points: [{ value: price }],
                        styles: {
                            line: { color: color, style: isSolid ? 'solid' : 'dashed', dashedValue: [4, 4] }
                        }
                    });

                } catch (e) {
                    console.warn('Grid draw error:', e);
                }
            };

            // 畫中間網格
            if (grid.gridLines) {
                grid.gridLines.forEach(line => {
                    const color = line.type === 'buy' ? '#089981' : (line.type === 'sell' ? '#F23645' : '#888888');
                    drawLine(line.price, color, false);
                });
            }

            // 畫天地單邊界
            if (grid.gridUpper) drawLine(grid.gridUpper, '#eaecef', true);
            if (grid.gridLower) drawLine(grid.gridLower, '#eaecef', true);

        }, 50);

        return () => clearTimeout(timer);
    }, [grid, klineData]); // 只有數據變動時才執行這塊

    return (
        <div className="w-full h-full relative">
            <div ref={chartContainerRef} className="w-full h-full" />
            {(!klineData || klineData.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                    載入圖表數據中...
                </div>
            )}
        </div>
    );
};

export default GridChart;