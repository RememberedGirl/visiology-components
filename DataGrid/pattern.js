// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;

// === ОСНОВНЫЕ ПЕРЕМЕННЫЕ ===
let grid = null; // Для хранения экземпляра DataGrid
let currentData = []; // Для хранения преобразованных данных
let currentFilter = ''; // Текущий активный фильтр

// === ФУНКЦИИ ===

// 1. Главная функция инициализации
function init() {
    // Преобразуем данные
    currentData = transformData(w.data.primaryData.items);

    // Получаем текущие фильтры
    currentFilter = getCurrentFilter();

    // Создаем HTML-контейнер
    createContainer();

    // Инициализируем таблицу
    initDataGrid(currentData, currentFilter);

    // Настраиваем слушатели фильтров
    setupFilterListeners();
}

// 2. Преобразование данных Visiology
function transformData(items) {
    if (!items || items.length === 0) return [];

    const keyLen = items[0].keys.length;

    return items.map((item, index) => {
        const obj = {
            id: index  // Добавляем ID для стабильного выделения
        };

        // Обрабатываем ключевые поля
        item.keys.forEach((key, i) => {
            obj[item.cols[i]] = key;
        });

        // Обрабатываем значения
        item.values.forEach((val, i) => {
            obj[item.cols[keyLen + i]] = val;
        });

        // Добавляем путь для фильтрации
        obj._path = item.keys;
        obj._pathString = item.formattedKeys.join(' - ');

        return obj;
    });
}

// 3. Создание контейнера
function createContainer() {
    w.general.text = `<div id="table-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({
        text: w.general,
        style: {}
    });
}

// 4. Получение текущих фильтров
function getCurrentFilter() {
    const filters = visApi().getSelectedValues(widgetGuid);
    return filters && filters.length > 0 ? filters.map(e => e.join(' - '))[0] : '';
}

// 5. Инициализация DataGrid
function initDataGrid(data, currentFilter) {
    const container = document.getElementById(`table-${widgetGuid}`);
    if (!container) {
        console.error('Container not found');
        return;
    }

    // Получаем колонки (исключаем служебные поля)
    const cols = w.data.primaryData.items[0]?.cols.filter(col => !col.startsWith('_')) || [];

    grid = $(container).dxDataGrid({
        dataSource: data,
        keyExpr: 'id',
        showBorders: true,
        columns: cols,
        width: '100%',
        height: '100%',
        selection: {
            mode: 'single'
        },
        onRowClick: function(e) {
            handleUserAction(e.data);
        },
        onContentReady: function(e) {
            // Выделяем строку при загрузке если есть активный фильтр
            if (currentFilter) {
                const row = data.find(item => item._pathString === currentFilter);
                if (row) {
                    e.component.selectRows([row.id], false);
                }
            }
        }
    }).dxDataGrid('instance');
}

// 6. Обработка пользовательских действий
function handleUserAction(clickedData) {
    // Toggle логика: если кликаем на уже выбранную строку - снимаем фильтр
    const newFilter = currentFilter === clickedData._pathString
        ? []
        : [clickedData._path];

    visApi().setFilterSelectedValues(widgetGuid, newFilter);
}

// 7. Настройка слушателей фильтров
function setupFilterListeners() {
    visApi().onSelectedValuesChangedListener(
        {
            guid: widgetGuid + '-listener',
            widgetGuid: widgetGuid
        },
        function(event) {
            const newFilters = event.selectedValues || [];
            currentFilter = newFilters.length > 0 ? newFilters.map(e => e.join(' - '))[0] : '';
            updateDataGridSelection(currentFilter);
        }
    );
}

// 8. Обновление выделения в таблице при изменении фильтров
function updateDataGridSelection(currentFilter) {
    if (!grid) return;

    grid.clearSelection();

    if (currentFilter) {
        const row = currentData.find(item => item._pathString === currentFilter);
        if (row) {
            grid.selectRows([row.id], false);
            grid.scrollToRow(row.id);
        }
    }
}

// === ЗАПУСК ===
init();