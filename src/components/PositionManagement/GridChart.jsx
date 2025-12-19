// src/components/PositionManagement/GridChart.jsx
import React, { useEffect, useRef } from 'react';
import { init, dispose } from 'klinecharts';

const GridChart = ({ klineData, grid }) => {
    const chartContainerRef = useRef(null);
    const chartInstance = useRef(null);
    const resizeObserver = useRef(null);

    // 1. 初始化圖表
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // 初始化 klinecharts
        chartInstance.current = init(chartContainerRef.current, {
            // 設定主題顏色
            grid: { horizontal: { color: '#2B3139' }, vertical: { color: '#2B3139' } },
            candle: { 
                bar: { upColor: '#089981', downColor: '#F23645', noChangeColor: '#888888' }, 
                priceMark: { high: { color: '#888888' }, low: { color: '#888888' } } 
            },
            background: { color: '#0b0e11' },
            xAxis: { tickText: { color: '#848e9c' } },
            yAxis: { tickText: { color: '#848e9c' } }
        });

        // 監聽容器大小變化
        resizeObserver.current = new ResizeObserver((entries) => {
            if (chartInstance.current) {
                const { width, height } = entries[0].contentRect;
                if (width > 0 && height > 0) {
                    chartInstance.current.resize();
                }
            }
        });
        
        resizeObserver.current.observe(chartContainerRef.current);

        return () => {
            if (resizeObserver.current) resizeObserver.current.disconnect();
            dispose(chartContainerRef.current);
        };
    }, []);

    // 2. 更新數據 (K線)
    useEffect(() => {
        // 🔥 防止數據為空時崩潰
        if (chartInstance.current && Array.isArray(klineData) && klineData.length > 0) {
            chartInstance.current.applyNewData(klineData);
        }
    }, [klineData]);

    // 3. 繪製網格線 (安全版：使用無限延伸直線 + 嚴格檢查)
    useEffect(() => {
        const chart = chartInstance.current;
        // 🔥 確保 chart 存在
        if (!chart) return;

        // 如果沒有 K 線數據，先清除舊線並返回
        if (!klineData || klineData.length === 0) {
             chart.removeOverlay();
             return;
        }

        const timer = setTimeout(() => {
            // 🔥 再次檢查數據
            const dataList = chart.getDataList();
            if (!dataList || dataList.length === 0) return;

            chart.removeOverlay();

            // 🔥 使用 Optional Chaining (?.) 確保不會因為讀取不到而報錯
            const startTs = klineData[0]?.timestamp;
            const endTs = klineData[klineData.length - 1]?.timestamp;

            if (startTs && endTs && Array.isArray(grid?.gridLines)) {
                
                // Helper: 畫線函數 (包含 try-catch)
                const drawLine = (price, color, isSolid = false) => {
                    const numPrice = Number(price);
                    if (!Number.isFinite(numPrice)) return;

                    try {
                        chart.createOverlay({
                            name: 'simpleLine', // 使用直線
                            extendData: 'both', // 無限延伸
                            lock: true,
                            points: [
                                { timestamp: startTs, value: numPrice },
                                { timestamp: endTs, value: numPrice }
                            ],
                            styles: {
                                line: {
                                    style: 'solid', 
                                    color: color,
                                    width: isSolid ? 2 : 1,
                                    dashedValue: isSolid ? [] : [4, 4] 
                                }
                            }
                        });
                    } catch (e) {
                        console.warn('Grid draw error:', e);
                    }
                };

                // A. 畫中間網格
                grid.gridLines.forEach(line => {
                    const color = line.type === 'buy' ? '#089981' : '#F23645';
                    drawLine(line.price, color, false);
                });

                // B. 畫天地單邊界
                if (grid.gridUpper) drawLine(grid.gridUpper, '#eaecef', true);
                if (grid.gridLower) drawLine(grid.gridLower, '#eaecef', true);
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [grid, klineData]);

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

export default React.memo(GridChart);