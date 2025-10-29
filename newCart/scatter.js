const widgetGuid = w.general.renderTo;
let chart = null;
let currentData = [];
let currentFilter = '';

// === ФУНКЦИИ ===

// 1. init() - инициализация приложения
function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    currentFilter = formatFilter(initialFilters);
    currentData = transformData(w);
    renderVisualization();
    setupFilterListener();
}

// 2. transformData() - преобразование данных
function transformData(w) {
    const items = w.data.primaryData.items;
    const categories = [...new Set(items.map(item => item.formattedKeys[0]))];

    const seriesData = categories.map((category, index) => {
        const categoryItems = items.filter(item => item.formattedKeys[0] === category);

        const data = categoryItems.map(item => {
            const fullPath = item.formattedKeys.join(' - ');
            const isSelected = currentFilter === fullPath;

            return {
                x: parseFloat(item.values[0]) || 0,
                y: parseFloat(item.values[1]) || 0,
                name: fullPath,
                item: item,
                marker: {
                    lineWidth: isSelected ? 3 : 0,
                    lineColor: '#000',
                    radius: 6
                }
            };
        });

        return {
            name: category,
            data: data,
            color: w.colors[index % w.colors.length]
        };
    });

    return seriesData;
}

// 3. createContainer() - создание контейнера
function createContainer() {
    const container = document.getElementById(widgetGuid);
    if (!container) return null;

    container.innerHTML = '';
    const chartDiv = document.createElement('div');
    chartDiv.id = `scatter-${widgetGuid}`;
    chartDiv.style.width = '100%';
    chartDiv.style.height = '100%';
    container.appendChild(chartDiv);

    return chartDiv;
}

// 4. renderVisualization() - рендеринг визуализации
function renderVisualization() {
    const container = createContainer();
    if (!container) return;

    const items = w.data.primaryData.items;
    const xAxisName = items[0].cols[items[0].keys.length] || 'Показатель 1';
    const yAxisName = items[0].cols[items[0].keys.length + 1] || 'Показатель 2';

    chart = Highcharts.chart(container.id, {
        chart: {
            type: 'scatter',
            zoomType: 'xy'
        },
        title: {
            text: ''
        },
        xAxis: {
            title: {
                enabled: true,
                text: xAxisName
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            title: {
                text: yAxisName
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 6,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.name}<br>{point.x:.2f}, {point.y:.2f}'
                }
            },
            series: {
                point: {
                    events: {
                        click: handleClick
                    }
                }
            }
        },
        series: currentData
    });
}

// 5. handleClick() - обработчик клика по точкам
function handleClick() {
    const item = this.item;
    const categoryPath = [item.formattedKeys];
    const newFilter = formatFilter(categoryPath);

    const filterToSet = currentFilter === newFilter ? [] : categoryPath;
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

// 6. updateVisualization() - обновление визуализации
function updateVisualization() {
    if (!chart) return;

    const updatedData = transformData(w);

    // Обновляем серии
    chart.series.forEach((series, index) => {
        if (updatedData[index]) {
            series.update({
                data: updatedData[index].data,
                color: updatedData[index].color
            }, false);
        }
    });

    chart.redraw();
}

// 7. setupFilterListener() - настройка слушателя фильтров
function setupFilterListener() {
    visApi().onSelectedValuesChangedListener(
        {guid: widgetGuid, widgetGuid: widgetGuid},
        function(event) {
            currentFilter = formatFilter(event.selectedValues);
            updateVisualization();
        }
    );
}

// Вспомогательная функция
function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0
        ? selectedValues[0].join(' - ')
        : '';
}

// === ЗАПУСК ПРИЛОЖЕНИЯ ===
init();