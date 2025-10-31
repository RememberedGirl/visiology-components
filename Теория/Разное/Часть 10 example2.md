# Полное руководство по созданию виджетов в Visiology

## 1. Базовая структура виджета

### Шаблон минимального виджета
```javascript
// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;

// === ОСНОВНЫЕ ПЕРЕМЕННЫЕ ===
let chart = null; // Для хранения экземпляра библиотеки визуализации

// === ГЛАВНАЯ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ ===
function init() {
    renderUI();
    setupFilterListener();
}

// === ФУНКЦИЯ РЕНДЕРИНГА ИНТЕРФЕЙСА ===
function renderUI() {
    const items = w.data.primaryData.items;
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    
    // Создаем контейнер для виджета
    const container = document.getElementById(widgetGuid);
    container.innerHTML = `
        <div id="chart-${widgetGuid}" style="width:100%;height:100%"></div>
    `;
    
    // Логика построения визуализации
    // ...
}

// === ОБРАБОТКА ПОЛЬЗОВАТЕЛЬСКИХ ДЕЙСТВИЙ ===
function handleUserAction(clickedItem) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    
    // Toggle-логика: если кликаем на уже выбранный элемент - снимаем фильтр
    const newFilter = currentFilter === clickedItem.filterString 
        ? [] 
        : [clickedItem.filterPath];
    
    visApi().setFilterSelectedValues(widgetGuid, newFilter);
}

// === НАСТРОЙКА СЛУШАТЕЛЕЙ ИЗМЕНЕНИЙ ===
function setupFilterListener() {
    visApi().onSelectedValuesChangedListener(
        {
            guid: widgetGuid + '-listener',
            widgetGuid: widgetGuid
        },
        function(event) {
            updateSelection(event.selectedValues);
        }
    );
}

// === ОБНОВЛЕНИЕ ВИЗУАЛИЗАЦИИ ===
function updateSelection(selectedValues) {
    if (!chart) return;
    
    const currentFilter = formatFilter(selectedValues);
    // Логика обновления графиков/таблиц
    // ...
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0 
        ? selectedValues[0].join(' - ') 
        : '';
}

// === ЗАПУСК ===
init();
```

## 2. Типовые паттерны виджетов

### Паттерн 2.1: Чекбокс-фильтр
```javascript
const container = document.getElementById(w.general.renderTo);
const items = w.data.primaryData.items;
const currentFilter = visApi().getSelectedValues(w.general.renderTo).map(x => x[0]);

// Создаем чекбоксы
container.innerHTML = items.map(item => `
  <label style="display: block; margin: 10px 0;">
    <input type="checkbox" 
           value="${item.formattedKeys[0]}"
           ${currentFilter.includes(item.formattedKeys[0]) ? 'checked' : ''}
           onchange="handleCheckboxChange('${w.general.renderTo}')">
    ${item.formattedKeys[0]}
  </label>
`).join('');

// Обработчик изменений
window.handleCheckboxChange = (renderTo) => {
    const values = [...document.querySelectorAll(`#${renderTo} input:checked`)].map(cb => [cb.value]);
    visApi().setFilterSelectedValues(renderTo, values);
};

// Синхронизация
visApi().onSelectedValuesChangedListener(
    { guid: w.general.renderTo, widgetGuid: w.general.renderTo },
    (event) => {
        const selected = event.selectedValues.map(x => x[0]);
        container.querySelectorAll('input').forEach(cb => {
            cb.checked = selected.includes(cb.value);
        });
    }
);
```

### Паттерн 2.2: Древовидная карта (Treemap)
```javascript
const widgetGuid = w.general.renderTo;
let chart = null;
let currentTreeData = [];

function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(initialFilters);

    const items = w.data.primaryData.items;
    currentTreeData = buildTreeData(items);

    renderUI(currentFilter, currentTreeData);
}

function buildTreeData(items) {
    const root = { name: 'root', children: [] };
    const nodeMap = new Map();

    items.forEach(item => {
        let currentLevel = root.children;
        let currentPath = [];

        for (let i = 0; i < item.keys.length; i++) {
            const key = item.formattedKeys[i];
            const rawKey = item.keys[i];
            currentPath.push(rawKey);

            let node = nodeMap.get(key);

            if (!node) {
                node = {
                    name: key,
                    value: item.values[0] || 1,
                    filterPath: [currentPath.slice()],
                    filterString: currentPath.join(' - '),
                    itemStyle: {
                        color: getColorByLevel(i),
                        borderColor: '#333',
                        borderWidth: 2
                    },
                    children: []
                };
                nodeMap.set(key, node);
                currentLevel.push(node);
            } else {
                node.value += item.values[0] || 1;
                node.filterPath.push(currentPath.slice());
            }

            currentLevel = node.children;
        }
    });

    return root.children;
}

function getColorByLevel(level) {
    const colors = w.colors;
    return colors[level % colors.length];
}

function handleNodeClick(node) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    const filterToSet = currentFilter === node.filterString ? [] : node.filterPath;
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

function renderUI(currentFilter, treeData) {
    const html = `<div id="treemap-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({ text: { ...w.general, text: html }, style: {} });

    const container = document.getElementById(`treemap-${widgetGuid}`);
    if (!container) return;

    chart = echarts.init(container);

    const option = {
        series: [{
            type: 'treemap',
            data: treeData,
            roam: false,
            nodeClick: false,
            label: { show: true },
            upperLabel: { show: true },
            breadcrumb: { show: false }
        }]
    };

    chart.setOption(option);

    chart.on('click', function(params) {
        if (params.data && params.data.filterPath) {
            handleNodeClick(params.data);
        }
    });

    updateUI(currentFilter);
}
```

### Паттерн 2.3: Таблица с выделением
```javascript
const widgetGuid = w.general.renderTo;
let grid = null;
let currentData = [];

function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    currentData = transformData();
    createContainer();
    initDataGrid(currentData, initialFilters);
    setupFilterListeners();
}

function transformData() {
    if (!w.data.primaryData.items || w.data.primaryData.items.length === 0) return [];

    const keyLen = w.data.primaryData.items[0].keys.length;

    return w.data.primaryData.items.map((item, index) => {
        const obj = { id: index };

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

function initDataGrid(data, selectedValues) {
    const container = document.getElementById(`table-${widgetGuid}`);
    if (!container) return;

    const cols = Object.keys(data[0] || {}).filter(key => !key.startsWith('_') && key !== 'id');
    const currentFilter = formatFilter(selectedValues);

    grid = $(container).dxDataGrid({
        dataSource: data,
        keyExpr: 'id',
        showBorders: true,
        columns: cols,
        selection: { mode: 'single' },
        onRowClick: function(e) {
            handleUserAction(e.data);
        },
        onContentReady: function(e) {
            if (currentFilter) {
                const row = data.find(item => item._pathString === currentFilter);
                if (row) {
                    e.component.selectRows([row.id], false);
                }
            }
        }
    }).dxDataGrid('instance');
}

function handleUserAction(clickedData) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);

    const newFilter = currentFilter === clickedData._pathString
        ? []
        : [clickedData._path];

    visApi().setFilterSelectedValues(widgetGuid, newFilter);
}
```

### Паттерн 2.4: Столбчатая диаграмма Highcharts
```javascript
const widgetGuid = w.general.renderTo;
let chart = null;

function init() {
    renderUI();
    setupFilterListener();
}

function handleUserAction(item) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    const newFilter = item.formattedKeys.join(' - ');
    const filterToSet = currentFilter === newFilter ? [] : [item.formattedKeys];
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

function renderUI() {
    const items = w.data.primaryData.items;
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);

    const container = document.getElementById(widgetGuid);
    container.innerHTML = `<div id="chart-${widgetGuid}" style="width:100%;height:100%"></div>`;

    const series = items[0].metadata.map((meta, idx) => ({
        name: meta.displayName,
        data: items.map(item => {
            const fullPath = item.formattedKeys.join(' - ');
            const isSelected = currentFilter === fullPath;
            return {
                name: fullPath,
                y: item.values[idx],
                color: isSelected ? '#ff0000' : w.colors[idx % w.colors.length],
                item: item
            };
        })
    }));

    chart = Highcharts.chart(`chart-${widgetGuid}`, {
        chart: { type: 'bar' },
        xAxis: {
            categories: items.map(item => item.formattedKeys.join(' - '))
        },
        series: series,
        plotOptions: {
            bar: {
                point: {
                    events: {
                        click: function() {
                            if (this.item) handleUserAction(this.item);
                        }
                    }
                }
            }
        }
    });
}
```

## 3. Ключевые принципы

### 3.1 Работа с данными
- **w.data.primaryData.items** - основной массив данных
- **item.keys** - ключевые поля (иерархия)
- **item.values** - числовые значения
- **item.formattedKeys** - отформатированные ключи
- **item.cols** - названия колонок (keys + values)

### 3.2 Управление фильтрами
```javascript
// GET: Получение текущих фильтров
const currentFilters = visApi().getSelectedValues(widgetGuid);

// SET: Установка новых фильтров
visApi().setFilterSelectedValues(widgetGuid, newFilter);

// LISTEN: Подписка на изменения
visApi().onSelectedValuesChangedListener(config, callback);
```

### 3.3 Toggle-логика
```javascript
function handleUserAction(item) {
    const currentFilter = getCurrentFilter();
    const newFilter = currentFilter === item.filterString ? [] : [item.filterPath];
    setNewFilter(newFilter);
}
```
