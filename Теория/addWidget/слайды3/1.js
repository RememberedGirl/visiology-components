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
    const categories = [];
    const seriesMap = {};

    items.forEach(item => {
        const dim0 = item.keys[0];
        const dim1 = item.keys[1];
        const value = item.values[0];

        if (!categories.includes(dim0)) {
            categories.push(dim0);
        }

        if (!seriesMap[dim1]) {
            seriesMap[dim1] = {
                name: dim1,
                data: new Array(categories.length).fill(null),
                type: 'bar',
                yAxisIndex: Object.keys(seriesMap).length
            };
        }

        const index = categories.indexOf(dim0);
        seriesMap[dim1].data[index] = value;
    });

    return {
        categories: categories,
        series: Object.values(seriesMap),
        seriesCount: Object.keys(seriesMap).length
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

    const showYAxes = data.seriesCount <= 2;

    const yAxes = data.series.map((series, index) => ({
        type: 'value',
        position: index === 0 ? 'left' : 'right',
        show: showYAxes,
        axisLine: {
            show: showYAxes,
            lineStyle: {
                color: widgetColors[index % widgetColors.length]
            }
        },
        axisLabel: {
            show: showYAxes,
            color: widgetColors[index % widgetColors.length]
        },
        splitLine: {
            show: showYAxes
        }
    }));

    const option = {
        color: widgetColors,
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                const dim0 = data.categories[params[0].dataIndex];
                let result = `${dim0}<br/>`;
                params.forEach(param => {
                    result += `${param.seriesName}: ${param.value}<br/>`;
                });
                return result;
            }
        },
        legend: {
            data: data.series.map(s => s.name)
        },
        grid: {
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: data.categories
        },
        yAxis: yAxes,
        series: data.series.map((series, index) => ({
            ...series,
            yAxisIndex: index,
            label: {
                show: true,
                position: 'top',
                formatter: '{c}'
            }
        }))
    };

    chart.setOption(option);
}

// === ЗАПУСК ===
init();