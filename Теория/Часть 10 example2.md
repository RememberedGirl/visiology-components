# Полное руководство по созданию виджетов в Visiology

## 1. Основы архитектуры виджетов

### Базовая структура виджета
```javascript
// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;

// === ОСНОВНЫЕ ПЕРЕМЕННЫЕ ===
let chart = null;
let currentData = [];

// === ФУНКЦИИ ===

function init() {
    // Инициализация виджета
}

// === ЗАПУСК ===
init();
```

## 2. Работа с данными

### Получение данных из Visiology
```javascript
function transformData(items) {
    return items.map((item, index) => {
        return {
            id: index,
            // Ключевые поля
            ...Object.fromEntries(
                item.keys.map((key, i) => [item.cols[i], key])
            ),
            // Значения
            ...Object.fromEntries(
                item.values.map((val, i) => [
                    item.cols[item.keys.length + i], 
                    val
                ])
            ),
            // Служебные поля для фильтрации
            _path: item.keys,
            _pathString: item.formattedKeys.join(' - ')
        };
    });
}
```

## 3. Работа с фильтрами

### Паттерн GET-SET-LISTEN
```javascript
// 1. GET - получение текущих фильтров
function getCurrentFilter() {
    const filters = visApi().getSelectedValues(widgetGuid);
    return formatFilter(filters);
}

// 2. SET - установка фильтров
function handleUserAction(clickedData) {
    const currentFilter = getCurrentFilter();
    const newFilter = currentFilter === clickedData.filterString 
        ? [] 
        : clickedData.filterPath;
    
    visApi().setFilterSelectedValues(widgetGuid, newFilter);
}

// 3. LISTEN - слушатель изменений
function setupFilterListeners() {
    visApi().onSelectedValuesChangedListener(
        {
            guid: widgetGuid + '-listener',
            widgetGuid: widgetGuid
        },
        (event) => {
            const currentFilter = formatFilter(event.selectedValues);
            updateVisualization(currentFilter);
        }
    );
}

// Вспомогательная функция
function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0
        ? selectedValues[0].join(' - ')
        : '';
}
```

## 4. Создание контейнера

### Базовый шаблон HTML
```javascript
function createContainer() {
    w.general.text = `
        <div id="widget-${widgetGuid}" style="width:100%; height:100%;">
            <div class="loading">Загрузка...</div>
        </div>
    `;
    TextRender({
        text: w.general,
        style: {}
    });
}
```

## 5. Типы виджетов и примеры

### A. Древовидная диаграмма (Treemap)
```javascript
function initTreemap() {
    const items = w.data.primaryData.items;
    const treeData = buildTreeData(items);
    
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
}
```

### B. Таблица данных (DataGrid)
```javascript
function initDataGrid(data) {
    const container = document.getElementById(`table-${widgetGuid}`);
    
    grid = $(container).dxDataGrid({
        dataSource: data,
        keyExpr: 'id',
        showBorders: true,
        selection: { mode: 'single' },
        onRowClick: function(e) {
            handleUserAction(e.data);
        }
    }).dxDataGrid('instance');
}
```

### C. Граф связей
```javascript
function initGraph() {
    const option = {
        series: [{
            type: 'graph',
            layout: 'force',
            data: nodes,
            links: links,
            force: { repulsion: 1000 },
            label: { show: true },
            roam: true,
            emphasis: { scale: true },
            selectedMode: 'single'
        }]
    };
}
```

### D. 3D визуализации
```javascript
function init3DChart() {
    // Подключение библиотек
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
    
    const script2 = document.createElement('script');
    script2.src = 'https://cdn.jsdelivr.net/npm/echarts-gl@2.0.9/dist/echarts-gl.min.js';
    
    Promise.all([
        new Promise(resolve => script1.onload = resolve),
        new Promise(resolve => script2.onload = resolve)
    ]).then(() => {
        init();
    });
}
```

### E. Чекбоксы
```javascript
function initCheckboxes() {
    const items = w.data.primaryData.items;
    const currentFilter = visApi().getSelectedValues(widgetGuid);
    
    container.innerHTML = items.map(item => `
        <label style="display: block; margin: 10px 0;">
            <input type="checkbox" 
                   value="${item.formattedKeys[0]}"
                   ${currentFilter.includes(item.formattedKeys[0]) ? 'checked' : ''}
                   onchange="handleCheckboxChange()">
            ${item.formattedKeys[0]}
        </label>
    `).join('');
}
```

## 6. Обработка событий

### Взаимодействие с элементами
```javascript
// Для ECharts
chart.on('click', function(params) {
    if (params.data) {
        handleUserAction(params.data);
    }
});

// Для DataGrid
grid.onRowClick = function(e) {
    handleUserAction(e.data);
};

// Для нативных элементов
function handleCheckboxChange() {
    const values = [...document.querySelectorAll('input:checked')]
        .map(cb => [cb.value]);
    visApi().setFilterSelectedValues(widgetGuid, values);
}
```

## 7. Обновление интерфейса

### Реактивное обновление
```javascript
function updateVisualization(currentFilter) {
    if (!chart) return;
    
    // Сброс выделения
    chart.dispatchAction({ type: 'unselect', seriesIndex: 0 });
    
    // Применение нового выделения
    if (currentFilter) {
        const selectedIndices = findSelectedIndices(currentFilter);
        chart.dispatchAction({
            type: 'select',
            seriesIndex: 0,
            dataIndex: selectedIndices
        });
    }
}
```