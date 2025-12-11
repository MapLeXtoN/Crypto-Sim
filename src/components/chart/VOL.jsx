export const toggleVOL = (chart, isShow, settings) => {
    if (!chart) return;
    chart.removeIndicator('pane_vol', 'VOL');

    if (isShow) {
        const maPeriod = settings?.maPeriod || 20;
        const showMA = settings?.showMA !== false;

        chart.createIndicator({
            name: 'VOL',
            calcParams: [maPeriod],
            styles: {
                lines: [{ style: showMA ? 'solid' : 'none', color: '#f0b90b' }]
            }
        }, false, { id: 'pane_vol' });
    }
};