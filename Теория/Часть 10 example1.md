# Рабочие примеры и паттерны Visiology

## Паттерн 1: Таблица (DataGrid) с фильтрацией

```javascript
const widgetGuid = w.general.renderTo;
let grid = null;
let currentData = [];

function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    currentData = transformData(w.data.primaryData.items);
    createContainer();
    initDataGrid(currentData, initialFilters);
    setupFilterListeners();
}

function transformData(items) {
    if (!items || items.length === 0) return [];
    const keyLen = items[0].keys.length;

    return items.map((item, index) => {
        const obj = { id: index };
        item.keys.forEach((key, i) => {
            obj[item.cols[i]] = key;
        });
        item.values.forEach((val, i) => {
            obj[item.cols[keyLen + i]] = val;
        });
        obj._path = item.keys;
        obj._pathString = item.formattedKeys.join(' - ');
        return obj;
    });
}

function createContainer() {
    w.general.text = `<div id="table-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({ text: w.general, style: {} });
}

function initDataGrid(data, selectedValues) {
    const container = document.getElementById(`table-${widgetGuid}`);
    if (!container) return;

    const cols = w.data.primaryData.items[0]?.cols.filter(col => !col.startsWith('_')) || [];
    const currentFilter = formatFilter(selectedValues);

    grid = $(container).dxDataGrid({
        dataSource: data,
        keyExpr: 'id',
        showBorders: true,
        columns: cols,
        width: '100%',
        height: '100%',
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
    const newFilter = currentFilter === clickedData._pathString ? [] : [clickedData._path];
    visApi().setFilterSelectedValues(widgetGuid, newFilter);
}

function setupFilterListeners() {
    visApi().onSelectedValuesChangedListener(
        { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
        function(event) {
            updateDataGridSelection(event.selectedValues);
        }
    );
}

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

function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0 ? selectedValues[0].join(' - ') : '';
}

init();
```

---

## Паттерн 2: Treemap (ECharts) с выделением

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

visApi().onSelectedValuesChangedListener(
    { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
    (event) => {
        const currentFilter = formatFilter(event.selectedValues);
        updateUI(currentFilter);
    }
);

function renderUI(currentFilter, treeData) {
    const html = `<div id="treemap-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({ text: { ...w.general, text: html }, style: {} });

    const container = document.getElementById(`treemap-${widgetGuid}`);
    if (!container) return;

    chart = echarts.init(container);

    const option = {
        series: [{
            type: 'treemap',
            roam: false,
            nodeClick: false,
            label: { show: true, fontSize: 12, color: '#fff' },
            upperLabel: {
                show: true,
                height: 30,
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 'bold'
            },
            breadcrumb: { show: false },
            itemStyle: { borderColor: '#333', borderWidth: 2, gapWidth: 2 },
            emphasis: {
                itemStyle: {
                    borderColor: '#ff0000',
                    borderWidth: 4,
                    shadowBlur: 10,
                    shadowColor: 'rgba(255, 0, 0, 0.5)'
                }
            },
            data: treeData
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

function updateUI(currentFilter) {
    if (!chart || !currentTreeData.length) return;

    chart.dispatchAction({ type: 'downplay', seriesIndex: 0 });

    if (currentFilter) {
        const updatedData = updateTreeDataWithSelection(currentTreeData, currentFilter);
        chart.setOption({
            series: [{
                data: updatedData,
                emphasis: {
                    itemStyle: {
                        borderColor: '#ff0000',
                        borderWidth: 4,
                        shadowBlur: 10,
                        shadowColor: 'rgba(255, 0, 0, 0.5)'
                    }
                }
            }]
        }, false);
    } else {
        const resetData = resetTreeDataSelection(currentTreeData);
        chart.setOption({ series: [{ data: resetData }] }, false);
    }
}

function updateTreeDataWithSelection(data, filterString) {
    return data.map(node => {
        const isSelected = node.filterString === filterString;
        const updatedNode = {
            ...node,
            itemStyle: {
                ...node.itemStyle,
                borderColor: isSelected ? '#ff0000' : '#333',
                borderWidth: isSelected ? 4 : 2
            }
        };
        if (node.children && node.children.length > 0) {
            updatedNode.children = updateTreeDataWithSelection(node.children, filterString);
        }
        return updatedNode;
    });
}

function resetTreeDataSelection(data) {
    return data.map(node => {
        const resetNode = {
            ...node,
            itemStyle: {
                ...node.itemStyle,
                borderColor: '#333',
                borderWidth: 2
            }
        };
        if (node.children && node.children.length > 0) {
            resetNode.children = resetTreeDataSelection(node.children);
        }
        return resetNode;
    });
}

function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0 ? selectedValues[0].join(' - ') : '';
}

init();
```

---

## Паттерн 3: Граф (Graph) с силовой физикой

```javascript
const widgetGuid = w.general.renderTo;
let chart = null;
let nodes = [];
let links = [];

function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(initialFilters);

    const items = w.data.primaryData.items;
    const nodeMap = new Map();

    items.forEach(item => {
        for (let i = 0; i < item.keys.length - 1; i++) {
            const source = item.formattedKeys[i];
            const target = item.formattedKeys[i + 1];
            const value = item.values[0] || 1;

            if (!nodeMap.has(source)) {
                nodes.push({
                    id: source,
                    name: source,
                    value: value,
                    filterPath: [item.keys.slice(0, i + 1)],
                    filterString: item.keys.slice(0, i + 1).join(' - ')
                });
                nodeMap.set(source, true);
            }

            if (!nodeMap.has(target)) {
                nodes.push({
                    id: target,
                    name: target,
                    value: value,
                    filterPath: [item.keys.slice(0, i + 2)],
                    filterString: item.keys.slice(0, i + 2).join(' - ')
                });
                nodeMap.set(target, true);
            }

            links.push({ source: source, target: target });
        }
    });

    renderUI(currentFilter);
}

function handleNodeClick(node) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    const filterToSet = currentFilter === node.filterString ? [] : node.filterPath;
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

visApi().onSelectedValuesChangedListener(
    { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
    (event) => {
        const currentFilter = formatFilter(event.selectedValues);
        updateUI(currentFilter);
    }
);

function renderUI(currentFilter) {
    const html = `<div id="graph-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({ text: { ...w.general, text: html }, style: {} });

    const container = document.getElementById(`graph-${widgetGuid}`);
    if (!container) return;

    chart = echarts.init(container);

    chart.setOption({
        series: [{
            type: 'graph',
            layout: 'force',
            data: nodes.map(node => ({
                ...node,
                symbolSize: Math.max(10, node.value / 50),
                itemStyle: {
                    color: '#5470c6',
                    borderColor: '#fff',
                    borderWidth: 2
                },
                emphasis: { itemStyle: { color: '#ff4d4f', borderWidth: 4 } },
                select: {
                    itemStyle: {
                        color: '#ff4d4f',
                        borderWidth: 4,
                        shadowBlur: 10,
                        shadowColor: 'rgba(255, 77, 79, 0.5)'
                    }
                }
            })),
            links: links,
            force: { repulsion: 1000 },
            label: { show: true, position: 'inside', color: '#fff' },
            roam: true,
            emphasis: { scale: true },
            selectedMode: 'single'
        }]
    });

    chart.on('click', function(params) {
        if (params.dataType === 'node') {
            handleNodeClick(params.data);
        }
    });

    updateUI(currentFilter);
}

function updateUI(currentFilter) {
    if (!chart) return;

    chart.dispatchAction({ type: 'unselect', seriesIndex: 0 });

    const selectedIndices = nodes
        .map((node, index) => currentFilter === node.filterString ? index : -1)
        .filter(index => index !== -1);

    if (selectedIndices.length > 0) {
        chart.dispatchAction({
            type: 'select',
            seriesIndex: 0,
            dataIndex: selectedIndices
        });
    }
}

function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0 ? selectedValues[0].join(' - ') : '';
}

init();
```

---

## Паттерн 4: 3D Bar Chart (с подключением библиотеки)

```javascript
// Подключаем библиотеки
const script1 = document.createElement('script');
script1.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
document.head.appendChild(script1);

const script2 = document.createElement('script');
script2.src = 'https://cdn.jsdelivr.net/npm/echarts-gl@2.0.9/dist/echarts-gl.min.js';
document.head.appendChild(script2);

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
                    parseFloat(item.values[0]) || 0,
                    parseFloat(item.values[1]) || 0,
                    parseFloat(item.values[2]) || 0,
                    item.formattedKeys[0],
                    fullPath
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
    { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
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
                return `${params.data.name}<br/>X: ${params.data.value[0].toFixed(2)}<br/>Y: ${params.data.value[1].toFixed(2)}<br/>Z: ${params.data.value[2].toFixed(2)}`;
            }
        },
        legend: {
            data: seriesData.map(s => s.name),
            selected: Object.fromEntries(seriesData.map(s => [s.name, true]))
        },
        xAxis3D: { type: 'value', name: 'X' },
        yAxis3D: { type: 'value', name: 'Y' },
        zAxis3D: { type: 'value', name: 'Z' },
        grid3D: {
            boxWidth: 200,
            boxDepth: 200,
            boxHeight: 100,
            viewControl: { rotateSensitivity: 1, zoomSensitivity: 1 },
            light: {
                main: { intensity: 1.2, shadow: true },
                ambient: { intensity: 0.3 }
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
    return selectedValues && selectedValues.length > 0 ? selectedValues[0].join(' - ') : '';
}
```

---

## Паттерн 5: HTML Чекбоксы (простой вариант без библиотек)

```javascript
const container = document.getElementById(w.general.renderTo);
const items = w.data.primaryData.items;
const widgetGuid = w.general.renderTo;
const currentFilter = visApi().getSelectedValues(widgetGuid).map(x => x[0]);

container.innerHTML = items.map(item => `
  <label style="display: block; margin: 10px 0;">
    <input type="checkbox" 
           value="${item.formattedKeys[0]}"
           ${currentFilter.includes(item.formattedKeys[0]) ? 'checked' : ''}
           onchange="handleCheckboxChange('${widgetGuid}')">
    ${item.formattedKeys[0]}
  </label>
`).join('');

window.handleCheckboxChange = (renderTo) => {
    const values = [...document.querySelectorAll(`#${renderTo} input:checked`)].map(cb => [cb.value]);
    visApi().setFilterSelectedValues(renderTo, values);
};

visApi().onSelectedValuesChangedListener(
    { guid: widgetGuid, widgetGuid: widgetGuid },
    (event) => {
        const selected = event.selectedValues.map(x => x[0]);
        container.querySelectorAll('input').forEach(cb => {
            cb.checked = selected.includes(cb.value);
        });
    }
);
```

---

## Ключевые паттерны и функции

### Преобразование данных (основное)
```javascript
// GET - один раз при загрузке
const items = w.data.primaryData.items;
// items[i].keys - исходные значения
// items[i].formattedKeys - форматированные значения
// items[i].values - метрики
// items[i].cols - названия колонок

// Создаём путь фильтрации
obj._path = item.keys;                          // ["Россия", "Москва"]
obj._pathString = item.formattedKeys.join(' - '); // "Россия - Москва"
```

### Работа с фильтрами (GET-SET)
```javascript
// GET текущее состояние
const filters = visApi().getSelectedValues(widgetGuid);
// [["Россия", "Москва"]] или []

// SET новое состояние
visApi().setFilterSelectedValues(widgetGuid, [["Россия", "Москва"]]);

// Форматирование
const filterString = filters.length > 0 ? filters[0].join(' - ') : '';
```

### Синхронизация (LISTEN)
```javascript
visApi().onSelectedValuesChangedListener(
    { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
    (event) => {
        const selectedValues = event.selectedValues; // [["Россия", "Москва"]]
        updateUI(selectedValues);
    }
);
```

### Toggle логика (клик = выбрать или отменить)
```javascript
function handleUserAction(clickedData) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    
    const newFilter = currentFilter === clickedData._pathString
        ? []  // Снять фильтр
        : [clickedData._path];  // Выбрать
    
    visApi().setFilterSelectedValues(widgetGuid, newFilter);
}
```

### Инициализация ECharts и обновление
```javascript
// Инициализация
chart = echarts.init(container);
chart.setOption(option);

// События
chart.on('click', (params) => { ... });

// Обновление данных БЕЗ пересоздания
chart.setOption({ series: updatedData });

// Выделение элементов
chart.dispatchAction({
    type: 'select',
    seriesIndex: 0,
    dataIndex: [indexToSelect]
});
```

### Инициализация DataGrid
```javascript
grid = $(container).dxDataGrid({
    dataSource: data,
    keyExpr: 'id',
    columns: columnNames,
    onRowClick: (e) => handleUserAction(e.data),
    onContentReady: (e) => {
        // Выделить нужную строку
        e.component.selectRows([rowId], false);
        e.component.scrollToRow(rowId);
    }
}).dxDataGrid('instance');

// Обновление
grid.clearSelection();
grid.selectRows([rowId], false);
grid.scrollToRow(rowId);
```

### Создание HTML контейнера
```javascript
const widgetGuid = w.general.renderTo;
w.general.text = `<div id="viz-${widgetGuid}" style="width:100%; height:100%;"></div>`;
TextRender({ text: w.general, style: {} });
const container = document.getElementById(`viz-${widgetGuid}`);
```

---

## Порядок разработки виджета

1. Определи тип (таблица/граф/диаграмма)
2. Возьми нужный паттерн выше
3. Адаптируй `transformData()` для своих данных
4. Проверь `handleUserAction()` - правильно ли формируется фильтр
5. Проверь `updateUI()` - правильно ли обновляется визуализация
6. Тестируй toggle логику (повторный клик = отмена фильтра)