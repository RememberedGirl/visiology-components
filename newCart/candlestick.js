console.log(w)
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
    const dates = [];
    const candlestickData = [];

    items.forEach(item => {
        dates.push(item.keys[0]);
        candlestickData.push([
            item.values[0], // open
            item.values[1], // close
            item.values[2], // low
            item.values[3]  // high
        ]);
    });

    return {
        dates: dates,
        data: candlestickData
    };
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

    const option = {
        tooltip: {
            trigger: 'axis',

        },
        xAxis: {
            type: 'category',
            data: data.dates
        },
        yAxis: {
            type: 'value',
            scale: true
        },
        series: [{
            type: 'candlestick',
            data: data.data,
            itemStyle: {
                color: widgetColors[1],
                color0: widgetColors[0],
                borderColor: widgetColors[1],
                borderColor0: widgetColors[0]
            }
        }]
    };

    chart.setOption(option);
}

// === ЗАПУСК ===
init();