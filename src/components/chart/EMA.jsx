export const toggleEMA = (chart, isShow, settings) => {
    if (!chart) return;
    chart.removeIndicator('candle_pane', 'EMA');
    chart.removeIndicator('candle_pane', 'MA');

    if (isShow) {
        const periods = settings?.periods || [20, 50, 200];
        const colors = settings?.colors || ['#FF9600', '#2196F3', '#E91E63'];

        chart.createIndicator({
            name: 'EMA',
            calcParams: periods, 
            styles: {
                lines: periods.map((_, i) => ({
                    color: colors[i],
                    style: 'solid',
                    size: i === 2 ? 2 : 1
                }))
            }
        }, false, { id: 'candle_pane' });
    }
};