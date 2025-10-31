// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;

// === ОСНОВНЫЕ ПЕРЕМЕННЫЕ ===
let chart = null; // Для хранения экземпляра визуализации
let currentData = []; // Для хранения преобразованных данных

// === ФУНКЦИИ ===

// 1. Главная функция инициализации
function init() {

        // Проверяем наличие данных
        if (!w.data.primaryData || !w.data.primaryData.items) {

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

// 2. Преобразование данных Visiology
function transformData(items) {
    // TODO: Реализовать преобразование данных под конкретную визуализацию
    // w.data.primaryData.items содержит:
    // item.keys        // [ "Россия", "Москва" ] - измерения
    // item.formattedKeys // [ "Россия", "Москва" ] - форматированные ключи
    // item.values      // [ 1500000, 443 ] - значения показателей/ мер
    // item.cols        // [ "Страна", "Город", "Население", "ВВП" ] - названия колонок (keys + values)

    return items;
}

// 3. Создание контейнера
function createContainer() {
    w.general.text = `<div id="myChart-${widgetGuid}" style="width:100%; height:100%;"></div>`;
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
    const container = document.getElementById(`myChart-${widgetGuid}`);

    // TODO: Реализовать инициализацию конкретной визуализации
    // Пример для ECharts:
    // chart = echarts.init(container);
    // const option = { ... };
    // chart.setOption(option);

    // Настройка обработчиков событий:
    // chart.on('click', function(params) {
    //     if (params.data) {
    //         handleUserAction(params.data);
    //     }
    // });
}

// 6. Обработка пользовательских действий
function handleUserAction(clickedData) {
    const currentFilter = getCurrentFilter();

    // Toggle логика: если кликаем на уже выбранный элемент - снимаем фильтр
    const newFilter = currentFilter === clickedData.filterString
        ? []
        : clickedData.filterPath;

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
    // TODO: Реализовать обновление визуализации в соответствии с новым фильтром
    // Пример:
    // chart.dispatchAction
}

// === ЗАПУСК ===
init();