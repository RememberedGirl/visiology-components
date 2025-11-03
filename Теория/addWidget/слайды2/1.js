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

    const categories = data.map(d => d.path);
    const values = data.map(d => d.data[0]);

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: params => `${params.name}<br/>${params.value}`
        },
        grid: { left: '5%', right: '5%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { rotate: 30, overflow: 'truncate' },
            axisTick: { alignWithLabel: true }
        },
        yAxis: { type: 'value' },
        series: [
            {
                type: 'bar',
                data: values,
                itemStyle: { color: widgetColors[0] },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}'
                },
                barMaxWidth: 40
            }
        ]
    };

    chart.setOption(option);
}

// === ЗАПУСК ===
init();
