// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;

// === ОСНОВНЫЕ ПЕРЕМЕННЫЕ ===
let chart = null;
let currentData = [];
let categories = [];

// === ФУНКЦИИ ===

// 1. Главная функция инициализации
function init() {
    // Загружаем Highcharts
    loadHighcharts();

    // Получаем данные из Visiology
    const items = w.data.primaryData.items;

    // Преобразуем данные в нужный формат
    currentData = transformData(items);

    // Получаем текущие фильтры
    const currentFilter = getCurrentFilter();

    // Создаем HTML-контейнер
    createContainer();

    // Инициализируем визуализацию
    initVisualization(currentData, currentFilter);

    // Настраиваем слушатели фильтров
    setupFilterListeners();
}

// Загрузка Highcharts
function loadHighcharts() {
    const scriptId = widgetGuid + '-highcharts';
    if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://code.highcharts.com/highcharts.js';
        document.head.appendChild(script);
    }
}

// 2. Преобразование данных Visiology
function transformData(items) {
    const keys = items[0].cols.slice(items[0].keys.length);
    categories = items.map(item => item.formattedKeys.join(' - '));

    return keys.map((key, j) => ({
        name: key,
        data: items.map((item, index) => ({
            y: item.values[j],
            category: categories[index],
            filterPath: [categories[index].split(' - ')],
            filterString: categories[index]
        }))
    }));
}

// 3. Создание контейнера
function createContainer() {
    w.general.text = `<div id="chart-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({
        text: w.general,
        style: {}
    });
}

// 4. Получение текущих фильтров
function getCurrentFilter() {
    const filters = visApi().getSelectedValues(widgetGuid);
    return filters && filters.length > 0 ? filters[0].join(' - ') : '';
}

// 5. Инициализация визуализации
function initVisualization(data, currentFilter) {
    const container = document.getElementById(`chart-${widgetGuid}`);
    if (!container) return;

    chart = Highcharts.chart(container, {
        xAxis: { categories },
        series: data,
        plotOptions: {
            series: {
                point: {
                    events: {
                        click: function() {
                            handleUserAction(this.series.data[this.index]);
                        }
                    }
                }
            }
        }
    });

    // Применяем начальное выделение
    updateVisualization(currentFilter);
}

// 6. Обработка пользовательских действий
function handleUserAction(clickedPoint) {
    const currentFilter = getCurrentFilter();
    const newFilter = currentFilter === clickedPoint.filterString
        ? []
        : clickedPoint.filterPath;

    visApi().setFilterSelectedValues(widgetGuid, newFilter);
}

// 7. Настройка слушателей фильтров
function setupFilterListeners() {
    visApi().onSelectedValuesChangedListener(
        {
            guid: widgetGuid + '-listener',
            widgetGuid: widgetGuid
        },
        (event) => {
            const currentFilter = event.selectedValues && event.selectedValues.length > 0
                ? event.selectedValues[0].join(' - ')
                : '';
            updateVisualization(currentFilter);
        }
    );
}

// 8. Обновление визуализации при изменении фильтров
function updateVisualization(currentFilter) {
    if (!chart) return;

    chart.series.forEach((series) => {
        series.data.forEach((point) => {
            point.update({
                marker: {
                    lineWidth: currentFilter === point.filterString ? 2 : 0,
                    lineColor: '#000'
                }
            }, false);
        });
    });

    chart.redraw();
}

// === ЗАПУСК ===
// Ждем загрузки Highcharts
const checkHighcharts = setInterval(() => {
    if (window.Highcharts) {
        clearInterval(checkHighcharts);
        init();
    }
}, 100);