const widgetGuid = w.general.renderTo;
let chart = null;
let currentData = [];

// === ФУНКЦИИ ===

// 1. Главная функция инициализации
function init() {
    // GET: Получаем актуальное состояние фильтров
    const initialFilters = visApi().getSelectedValues(widgetGuid);

    // Преобразуем данные
    currentData = transformData(w.data.primaryData.items, initialFilters);

    // Создаем и рендерим визуализацию
    renderVisualization();

    // LISTEN: Настраиваем слушатель изменений
    setupFilterListener();
}

// 2. Преобразование данных
function transformData(items, selectedValues) {
    const currentFilter = formatFilter(selectedValues);
    const categories = [...new Set(items.map(item => item.formattedKeys[0]))];

    return categories.map((category, index) => {
        const categoryItems = items.filter(item => item.formattedKeys[0] === category);

        const data = categoryItems.map(item => {
            const fullPath = item.formattedKeys.join(' - ');
            const isSelected = currentFilter === fullPath;

            return {
                x: parseFloat(item.values[0]) || 0,
                y: parseFloat(item.values[1]) || 0,
                name: fullPath,
                item: item,
                filterPath: [item.keys],
                filterString: fullPath,
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
}

// 3. Создание контейнера
function createContainer() {
    w.general.text = `<div id="scatter-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({
        text: w.general,
        style: {}
    });

    return document.getElementById(`scatter-${widgetGuid}`);
}

// 4. Рендеринг визуализации
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

// 5. SET: Обработчик клика по точкам
function handleClick() {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);

    // Toggle логика: если кликаем на уже выбранный элемент - снимаем фильтр
    const newFilter = currentFilter === this.filterString
        ? []
        : this.filterPath;

    visApi().setFilterSelectedValues(widgetGuid, newFilter);
}

// 6. Обновление визуализации
function updateVisualization(selectedValues) {
    if (!chart) return;

    // Преобразуем данные с учетом новых фильтров
    const updatedData = transformData(w.data.primaryData.items, selectedValues);

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

// 7. LISTEN: Настройка слушателя фильтров
function setupFilterListener() {
    visApi().onSelectedValuesChangedListener(
        {
            guid: widgetGuid + '-listener',
            widgetGuid: widgetGuid
        },
        (event) => {
            // Получаем актуальное состояние из события
            updateVisualization(event.selectedValues);
        }
    );
}

// Вспомогательная функция для форматирования фильтра
function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0
        ? selectedValues[0].join(' - ')
        : '';
}

// === ЗАПУСК ===
init();