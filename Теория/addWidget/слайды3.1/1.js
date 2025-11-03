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
    // Группируем данные: dimension[0] -> X axis, dimension[1] -> series
    const grouped = {};
    const seriesNames = new Set();

    items.forEach(item => {
        const dim0 = item.keys[0]; // Категория X
        const dim1 = item.keys[1]; // Категория легенды
        const value = item.values[0]; // Значение Y

        if (!grouped[dim0]) {
            grouped[dim0] = {};
        }
        grouped[dim0][dim1] = value;
        seriesNames.add(dim1);
    });

    return {
        xAxisData: Object.keys(grouped),
        seriesData: grouped,
        seriesNames: Array.from(seriesNames),
        rawItems: items
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

    const uniqueSeriesCount = data.seriesNames.length;
    const showYAxis = uniqueSeriesCount <= 2;

    // Строим серии данных
    const series = data.seriesNames.map((seriesName, index) => {
        const seriesData = data.xAxisData.map(xVal => data.seriesData[xVal][seriesName] || 0);

        return {
            name: seriesName,
            type: 'bar',
            data: seriesData,
            itemStyle: {
                color: widgetColors[index % widgetColors.length]
            },
            yAxisIndex: showYAxis ? (index % 2) : 0,
            tooltip: {
                formatter: function(params) {
                    const dataIndex = params.dataIndex;
                    const xVal = data.xAxisData[dataIndex];
                    return `${xVal}<br/>${seriesName}: ${params.value}`;
                }
            }
        };
    });

    // Конфигурация осей Y
    const yAxes = showYAxis && uniqueSeriesCount === 2
        ? [
            { type: 'value', position: 'left', gridIndex: 0 },
            { type: 'value', position: 'right', gridIndex: 0 }
        ]
        : [{ type: 'value', gridIndex: 0 }];

    const option = {
        color: widgetColors,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        legend: {
            data: data.seriesNames
        },
        grid: {
            left: '10%',
            right: '10%',
            bottom: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: data.xAxisData,
            gridIndex: 0
        },
        yAxis: yAxes.map((axis, idx) => ({
            ...axis,
            show: showYAxis,
            gridIndex: 0
        })),
        series: series
    };

    chart.setOption(option);
}

// === ЗАПУСК ===
init();