/**
 * 切換 RSI 指標
 * @param {Object} chart - klinecharts 實例
 * @param {boolean} isShow - 是否顯示
 * @param {Object} settings - { period: number, color: string }
 */
export const toggleRSI = (chart, isShow, settings) => {
    if (!chart) return;

    const period = settings?.period || 14;
    const color = settings?.color || '#9c27b0'; // 預設紫色

    if (isShow) {
        // 先移除舊的 (確保樣式更新)
        chart.removeIndicator('pane_rsi', 'RSI');

        chart.createIndicator({
            name: 'RSI',
            calcParams: [period],
            styles: {
                lines: [
                    { color: color, size: 1.5 } // 設定 RSI 線的顏色
                ]
            }
        }, false, { id: 'pane_rsi' });
    } else {
        chart.removeIndicator('pane_rsi', 'RSI');
    }
};