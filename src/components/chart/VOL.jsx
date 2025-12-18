// src/components/chart/VOL.jsx

export const toggleVOL = (chart, isShow, settings) => {
    if (!chart) return;

    // 定義固定的 Pane ID，確保我們是在操作同一個視窗
    const PANE_ID = 'pane_vol';

    // 1. 先乾淨地移除舊的指標與視窗，避免殘留
    chart.removeIndicator(PANE_ID, 'VOL');

    if (isShow) {
        const maPeriod = settings?.maPeriod || 20;
        const showMA = settings?.showMA !== false;

        // 2. 第一道鎖：建立指標時，嘗試設定高度
        chart.createIndicator({
            name: 'VOL',
            calcParams: [maPeriod],
            styles: {
                lines: [{ style: showMA ? 'solid' : 'none', color: '#f0b90b' }]
            }
        }, false, { 
            id: PANE_ID, 
            height: 100,       // 設定初始高度
            minHeight: 50,     // 設定最小高度防擠壓
            dragEnabled: true  // 允許拖曳調整
        });

        // 3. 🔥 根治關鍵：第二道鎖 (強制佈局更新)
        // 有時候 createIndicator 執行當下，圖表還沒準備好重新排版。
        // 透過再次呼叫 setPaneOptions，我們強制圖表引擎 "現在" 重新分配空間。
        chart.setPaneOptions({
            id: PANE_ID,
            height: 100,
            minHeight: 50,
            dragEnabled: true,
        });
    }
};