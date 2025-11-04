const widgetGuid = w.general.renderTo;

function init() {
    const items = w.data.primaryData.items;
    const scatterData = transformData(items);

    renderScatterPlot(scatterData);
}

function transformData(items) {
    const categories = [...new Set(items.map(item => item.formattedKeys[0]))];

    return categories.map((category, index) => {
        const categoryItems = items.filter(item => item.formattedKeys[0] === category);

        return {
            name: category,
            data: categoryItems.map(item => ({
                x: parseFloat(item.values[0]) || 0,
                y: parseFloat(item.values[1]) || 0,
                name: item.formattedKeys.join(' - ')
            })),
            color: w.colors[index % w.colors.length]
        };
    });
}

function renderScatterPlot(data) {
    const html = `<div id="scatter-${widgetGuid}" style="width:100%;height:100%;"></div>`;
    TextRender({ text: { ...w.general, text: html }, style: {} });

    const container = document.getElementById(`scatter-${widgetGuid}`);
    if (!container) return;

    Highcharts.chart(container.id, {
        chart: { type: 'scatter' },
        title: { text: '' },
        series: data
    });
}

init();