export const toggleMACD = (chart, isShow, settings) => {
    if (!chart) return;
    
    if (isShow) {
        // 先移除舊的以更新設定
        chart.removeIndicator('pane_macd', 'MACD');
        
        chart.createIndicator({
            name: 'MACD',
            calcParams: [
                settings?.fast || 12,
                settings?.slow || 26,
                settings?.signal || 9
            ]
        }, false, { id: 'pane_macd' });
    } else {
        chart.removeIndicator('pane_macd', 'MACD');
    }
};