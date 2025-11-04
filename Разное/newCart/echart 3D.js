// Подключаем скрипт echarts и echarts-gl
const script1 = document.createElement('script');
script1.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
document.head.appendChild(script1);

const script2 = document.createElement('script');
script2.src = 'https://cdn.jsdelivr.net/npm/echarts-gl@2.0.9/dist/echarts-gl.min.js';
document.head.appendChild(script2);

// Ждем загрузки библиотек
Promise.all([
    new Promise(resolve => script1.onload = resolve),
    new Promise(resolve => script2.onload = resolve)
]).then(() => {
    init();
});

const widgetGuid = w.general.renderTo;
let chart = null;
let currentData = [];

function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(initialFilters);

    const items = w.data.primaryData.items;
    currentData = transformData(items, currentFilter);

    renderUI(currentFilter, currentData);
}

function transformData(items, currentFilter) {
    const categories = [...new Set(items.map(item => item.formattedKeys[0]))];

    return categories.map((category, index) => {
        const categoryItems = items.filter(item => item.formattedKeys[0] === category);

        const data = categoryItems.map(item => {
            const fullPath = item.formattedKeys.join(' - ');
            const isSelected = currentFilter === fullPath;

            return {
                value: [
                    parseFloat(item.values[0]) || 0, // X
                    parseFloat(item.values[1]) || 0, // Y
                    parseFloat(item.values[2]) || 0, // Z
                    item.formattedKeys[0],           // category for color
                    fullPath                         // full path for tooltip
                ],
                name: fullPath,
                item: item,
                itemStyle: {
                    color: isSelected ? '#ff0000' : w.colors[index % w.colors.length],
                    opacity: isSelected ? 1 : 0.8
                }
            };
        });

        return {
            name: category,
            type: 'bar3D',
            data: data,
            shading: 'color',
            emphasis: {
                label: {
                    show: true,
                    formatter: function(params) {
                        return params.data.name;
                    }
                }
            }
        };
    });
}

function handleNodeClick(node) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    const filterToSet = currentFilter === node.name ? [] : [node.item.formattedKeys];
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

visApi().onSelectedValuesChangedListener(
    {guid: widgetGuid + '-listener', widgetGuid: widgetGuid},
    (event) => {
        const currentFilter = formatFilter(event.selectedValues);
        updateUI(currentFilter);
    }
);

function renderUI(currentFilter, seriesData) {
    const html = `<div id="bar3d-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({ text: { ...w.general, text: html }, style: {} });

    const container = document.getElementById(`bar3d-${widgetGuid}`);
    if (!container) return;

    chart = echarts.init(container);

    const option = {
        tooltip: {
            formatter: function(params) {
                return `${params.data.name}<br/>
                        X: ${params.data.value[0].toFixed(2)}<br/>
                        Y: ${params.data.value[1].toFixed(2)}<br/>
                        Z: ${params.data.value[2].toFixed(2)}`;
            }
        },
        legend: {
            data: seriesData.map(s => s.name),
            selected: Object.fromEntries(seriesData.map(s => [s.name, true]))
        },
        xAxis3D: {
            type: 'value',
            name: 'X'
        },
        yAxis3D: {
            type: 'value',
            name: 'Y'
        },
        zAxis3D: {
            type: 'value',
            name: 'Z'
        },
        grid3D: {
            boxWidth: 200,
            boxDepth: 200,
            boxHeight: 100,
            viewControl: {
                rotateSensitivity: 1,
                zoomSensitivity: 1
            },
            light: {
                main: {
                    intensity: 1.2,
                    shadow: true
                },
                ambient: {
                    intensity: 0.3
                }
            }
        },
        series: seriesData
    };

    chart.setOption(option);

    chart.on('click', function(params) {
        if (params.data) {
            handleNodeClick(params.data);
        }
    });

    chart.on('legendselectchanged', function(params) {
        const selected = params.selected;
        const option = chart.getOption();

        option.series.forEach((series, index) => {
            series.data.forEach(point => {
                point.itemStyle = {
                    ...point.itemStyle,
                    opacity: selected[series.name] ? (currentFilter === point.name ? 1 : 0.8) : 0.2
                };
            });
        });

        chart.setOption(option);
    });

    updateUI(currentFilter);
}

function updateUI(currentFilter) {
    if (!chart || !currentData.length) return;

    const items = w.data.primaryData.items;
    const updatedData = transformData(items, currentFilter);

    chart.setOption({
        series: updatedData
    });
}

function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0
        ? selectedValues[0].join(' - ')
        : '';
}