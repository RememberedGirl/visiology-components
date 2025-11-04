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
    const xCategories = [];
    const yCategories = [];
    const data = [];

    items.forEach(item => {
        const xCat = item.keys[0];
        const yCat = item.keys[1];
        const heightValue = item.values[0];
        const colorValue = item.values[1];

        if (!xCategories.includes(xCat)) xCategories.push(xCat);
        if (!yCategories.includes(yCat)) yCategories.push(yCat);

        data.push({
            xIndex: xCategories.indexOf(xCat),
            yIndex: yCategories.indexOf(yCat),
            height: heightValue,
            color: colorValue
        });
    });

    return {
        xCategories: xCategories,
        yCategories: yCategories,
        data: data
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

    const colorValues = data.data.map(item => item.color);
    const minColorValue = Math.min(...colorValues);
    const maxColorValue = Math.max(...colorValues);

    const option = {
        tooltip: {
            formatter: function(params) {
                const item = params.value;
                return `
                    X: ${data.xCategories[item[0]]}<br/>
                    Y: ${data.yCategories[item[1]]}<br/>
                    Высота: ${item[2]}<br/>
                    Цвет: ${item[3]}
                `;
            }
        },
        visualMap: {
            min: minColorValue,
            max: maxColorValue,
            dimension: 3,
            inRange: {
                color: [widgetColors[0], widgetColors[1]]
            }
        },
        xAxis3D: {
            type: 'category',
            data: data.xCategories
        },
        yAxis3D: {
            type: 'category',
            data: data.yCategories
        },
        zAxis3D: {
            type: 'value'
        },
        grid3D: {
            boxWidth: 200,
            boxDepth: 80,
            viewControl: {
                rotateSensitivity: 1,
                zoomSensitivity: 1,
                panSensitivity: 1
            }
        },
        series: [{
            type: 'bar3D',
            data: data.data.map(item => {
                return [item.xIndex, item.yIndex, item.height, item.color];
            }),
            shading: 'color',
            label: {
                show: false
            },
            itemStyle: {
                opacity: 0.8
            },
            emphasis: {
                itemStyle: {
                    opacity: 1
                }
            }
        }]
    };

    chart.setOption(option);
}

// === ЗАПУСК ===
init();