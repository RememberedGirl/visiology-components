// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;

// === ОСНОВНЫЕ ПЕРЕМЕННЫЕ ===
let grid = null; // Для хранения экземпляра DataGrid
let currentData = []; // Для хранения преобразованных данных

// === ФУНКЦИИ ===

// 1. Главная функция инициализации
function init() {
    // GET: Получаем актуальное состояние фильтров при инициализации
    const initialFilters = visApi().getSelectedValues(widgetGuid);

    // Преобразуем данные
    currentData = transformData();

    // Создаем HTML-контейнер
    createContainer();

    // Инициализируем таблицу с текущими фильтрами
    initDataGrid(currentData, initialFilters);

    // LISTEN: Настраиваем слушатели фильтров
    setupFilterListeners();
}

// 2. Преобразование данных Visiology
function transformData() {
    if (!w.data.primaryData.items || w.data.primaryData.items.length === 0) return [];

    const keyLen = w.data.primaryData.items[0].keys.length;

    return w.data.primaryData.items.map((item, index) => {
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

// 4. Инициализация DataGrid
function initDataGrid(data, selectedValues) {
    const container = document.getElementById(`table-${widgetGuid}`);
    if (!container) {
        console.error('Container not found');
        return;
    }

    // Получаем колонки (исключаем служебные поля)
    const cols = Object.keys(data[0] || {}).filter(key => !key.startsWith('_') && key !== 'id');
    const currentFilter = formatFilter(selectedValues);

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

// 5. SET: Обработка пользовательских действий
function handleUserAction(clickedData) {
    // GET: Получаем актуальное состояние перед принятием решения
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);

    // Toggle логика: если кликаем на уже выбранную строку - снимаем фильтр
    const newFilter = currentFilter === clickedData._pathString
        ? []
        : [clickedData._path];

    // SET: Передаем новое состояние в API
    visApi().setFilterSelectedValues(widgetGuid, newFilter);
}

// 6. LISTEN: Настройка слушателей фильтров
function setupFilterListeners() {
    visApi().onSelectedValuesChangedListener(
        {
            guid: widgetGuid + '-listener',
            widgetGuid: widgetGuid
        },
        function(event) {
            // Получаем актуальное состояние из события
            updateDataGridSelection(event.selectedValues);
        }
    );
}

// 7. Обновление выделения в таблице при изменении фильтров
function updateDataGridSelection(selectedValues) {
    if (!grid) return;

    grid.clearSelection();

    const currentFilter = formatFilter(selectedValues);

    if (currentFilter) {
        const row = currentData.find(item => item._pathString === currentFilter);
        if (row) {
            grid.selectRows([row.id], false);
            grid.scrollToRow(row.id);
        }
    }
}

// Вспомогательная функция для форматирования фильтра
function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0
        ? selectedValues.map(e => e.join(' - '))[0]
        : '';
}

// === ЗАПУСК ===
init();