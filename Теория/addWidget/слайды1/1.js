
// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;
const widgetColors = w.colors;

// === ПЕРЕМЕННЫЕ ===
let chart = null;

// === ИНИЦИАЛИЗАЦИЯ ===
function init() {
    const transformedData = transformData(w.data.primaryData.items);
    createContainer();
    render(transformedData);
}

// === ТРАНСФОРМАЦИЯ ДАННЫХ ===
function transformData(items) {
    return items.map(item => {
        return {
            categories: item.keys,
            data: item.values,
            name: item.cols,
            path: item.keys.join(' - ')
        };
    });
}

// === СОЗДАНИЕ КОНТЕЙНЕРА ===
function createContainer() {
    const html = `<div id="customWidget-${widgetGuid}" style="width:100%;height:100%;overflow:hidden;"></div>`;
    w.general.text = html;
    TextRender({ text: w.general, style: {} });
}

// === РЕНДЕРИНГ ВИЗУАЛИЗАЦИИ ===
function render(data) {
    const container = document.getElementById(`customWidget-${widgetGuid}`);
    chart = echarts.init(container);

    const categories = data.map(d => d.categories[0]);
    const metricNames = data[0].name.slice(1);
    const series = metricNames.map((metric, i) => ({
        name: metric,
        type: 'bar',
        data: data.map(d => d.data[i]),
        itemStyle: { color: widgetColors[i % widgetColors.length] },
        barMaxWidth: 40
    }));

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: params => {
                return `${params.name}<br>${params.seriesName}: ${params.value}`;
            }
        },
        legend: {
            top: 10,
            data: metricNames
        },
        grid: { left: '5%', right: '5%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisTick: { alignWithLabel: true }
        },
        yAxis: { type: 'value' },
        series: series
    };

    chart.setOption(option);
}

// === ЗАПУСК ===
init();
