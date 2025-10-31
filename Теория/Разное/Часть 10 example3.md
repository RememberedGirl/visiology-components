# Универсальный шаблон виджета Visiology

## Основной шаблон (скопируй и адаптируй)

```javascript
const widgetGuid = w.general.renderTo;
let chart = null;
let currentData = [];

// === ИНИЦИАЛИЗАЦИЯ ===
function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    currentData = transformData(w.data.primaryData.items);
    createContainer();
    renderUI(formatFilter(initialFilters));
    setupFilterListener();
}

// === ТРАНСФОРМАЦИЯ ДАННЫХ ===
function transformData(items) {
    // ТВОЙ КОД: преобразуй items в нужный формат
    return items;
}

// === СОЗДАНИЕ КОНТЕЙНЕРА ===
function createContainer() {
    w.general.text = `<div id="widget-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({ text: w.general, style: {} });
}

// === РЕНДЕРИНГ ВИЗУАЛИЗАЦИИ ===
function renderUI(currentFilter) {
    const container = document.getElementById(`widget-${widgetGuid}`);
    if (!container) return;
    
    // ТВОЙ КОД: инициализация графика/таблицы/элемента
}

// === ОБРАБОТЧИК КЛИКА (SET) ===
function handleUserAction(clickedItem) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    const newFilterString = clickedItem.formattedKeys.join(' - ');
    
    const newFilter = currentFilter === newFilterString ? [] : [clickedItem.keys];
    visApi().setFilterSelectedValues(widgetGuid, newFilter);
}

// === ОБНОВЛЕНИЕ UI (LISTEN) ===
function updateUI(currentFilter) {
    // ТВОЙ КОД: обновление визуализации при изменении фильтра
}

// === СЛУШАТЕЛЬ ФИЛЬТРОВ ===
function setupFilterListener() {
    visApi().onSelectedValuesChangedListener(
        { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
        (event) => {
            updateUI(formatFilter(event.selectedValues));
        }
    );
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0 ? selectedValues[0].join(' - ') : '';
}

init();
```

---

## Пример 1: DataGrid (Таблица)

```javascript
const widgetGuid = w.general.renderTo;
let grid = null;
let currentData = [];

function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    currentData = transformData(w.data.primaryData.items);
    createContainer();
    initDataGrid(currentData, initialFilters);
    setupFilterListener();
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

    const cols = Object.keys(data[0] || {}).filter(key => !key.startsWith('_') && key !== 'id');
    const currentFilter = formatFilter(selectedValues);

    grid = $(container).dxDataGrid({
        dataSource: data,
        keyExpr: 'id',
        showBorders: true,
        columns: cols,
        width: '100%',
        height: '100%',
        selection: { mode: 'single' },
        onRowClick: (e) => handleUserAction(e.data),
        onContentReady: (e) => {
            if (currentFilter) {
                const row = data.find(item => item._pathString === currentFilter);
                if (row) e.component.selectRows([row.id], false);
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

function updateUI(selectedValues) {
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

function setupFilterListener() {
    visApi().onSelectedValuesChangedListener(
        { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
        (event) => updateUI(event.selectedValues)
    );
}

function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0 ? selectedValues[0].join(' - ') : '';
}

init();
```

---

## Пример 2: Treemap (ECharts)

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
                        color: w.colors[(i % w.colors.length)],
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
    chart.on('click', (params) => {
        if (params.data && params.data.filterPath) handleNodeClick(params.data);
    });

    updateUI(currentFilter);
}

function handleNodeClick(node) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    const filterToSet = currentFilter === node.filterString ? [] : node.filterPath;
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
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
            itemStyle: { ...node.itemStyle, borderColor: '#333', borderWidth: 2 }
        };
        if (node.children && node.children.length > 0) {
            resetNode.children = resetTreeDataSelection(node.children);
        }
        return resetNode;
    });
}

function setupFilterListener() {
    visApi().onSelectedValuesChangedListener(
        { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
        (event) => updateUI(formatFilter(event.selectedValues))
    );
}

function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0 ? selectedValues[0].join(' - ') : '';
}

init();
```

---

## Пример 3: Граф (Graph)

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

            links.push({ source, target });
        }
    });

    renderUI(currentFilter);
}

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
                select: {
                    itemStyle: {
                        color: '#ff4d4f',
                        borderWidth: 4,
                        shadowBlur: 10,
                        shadowColor: 'rgba(255, 77, 79, 0.5)'
                    }
                }
            })),
            links,
            force: { repulsion: 1000 },
            label: { show: true, position: 'inside', color: '#fff' },
            roam: true,
            selectedMode: 'single'
        }]
    });

    chart.on('click', (params) => {
        if (params.dataType === 'node') handleNodeClick(params.data);
    });

    updateUI(currentFilter);
}

function handleNodeClick(node) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    const filterToSet = currentFilter === node.filterString ? [] : node.filterPath;
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
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

function setupFilterListener() {
    visApi().onSelectedValuesChangedListener(
        { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
        (event) => updateUI(formatFilter(event.selectedValues))
    );
}

function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0 ? selectedValues[0].join(' - ') : '';
}

setupFilterListener();
init();
```

---

## Пример 4: Scatter (Highcharts)

```javascript
const widgetGuid = w.general.renderTo;
let chart = null;
let currentData = [];

function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    currentData = transformData(w.data.primaryData.items, initialFilters);
    renderVisualization();
    setupFilterListener();
}

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

function renderVisualization() {
    const items = w.data.primaryData.items;
    w.general.text = `<div id="scatter-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({ text: w.general, style: {} });

    const container = document.getElementById(`scatter-${widgetGuid}`);
    if (!container) return;

    const xAxisName = items[0].cols[items[0].keys.length] || 'Показатель 1';
    const yAxisName = items[0].cols[items[0].keys.length + 1] || 'Показатель 2';

    chart = Highcharts.chart(container.id, {
        chart: { type: 'scatter', zoomType: 'xy' },
        title: { text: '' },
        xAxis: {
            title: { enabled: true, text: xAxisName },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: { title: { text: yAxisName } },
        legend: { layout: 'vertical', align: 'right', verticalAlign: 'middle' },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 6,
                    states: { hover: { enabled: true, lineColor: 'rgb(100,100,100)' } }
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.name}<br>{point.x:.2f}, {point.y:.2f}'
                }
            },
            series: {
                point: {
                    events: {
                        click: function() {
                            if (this.item) handleUserAction(this.item);
                        }
                    }
                }
            }
        },
        series: currentData
    });
}

function handleUserAction(item) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    const newFilter = item.formattedKeys.join(' - ');
    const filterToSet = currentFilter === newFilter ? [] : [item.keys];
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

function updateVisualization(selectedValues) {
    if (!chart) return;
    const updatedData = transformData(w.data.primaryData.items, selectedValues);
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

function setupFilterListener() {
    visApi().onSelectedValuesChangedListener(
        { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
        (event) => updateVisualization(event.selectedValues)
    );
}

function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0 ? selectedValues[0].join(' - ') : '';
}

init();
```

---

## Пример 5: 3D Bar Chart (ECharts GL)

```javascript
const script1 = document.createElement('script');
script1.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
document.head.appendChild(script1);

const script2 = document.createElement('script');
script2.src = 'https://cdn.jsdelivr.net/npm/echarts-gl@2.0.9/dist/echarts-gl.min.js';
document.head.appendChild(script2);

Promise.all([
    new Promise(resolve => script1.onload = resolve),
    new Promise(resolve => script2.onload = resolve)
]).then(() => init());

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
            shading: 'color'
        };
    });
}

function renderUI(currentFilter, seriesData) {
    const html = `<div id="bar3d-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({ text: { ...w.general, text: html }, style: {} });

    const container = document.getElementById(`bar3d-${widgetGuid}`);
    if (!container) return;

    chart = echarts.init(container);

    const option = {
        tooltip: {
            formatter: (params) => `${params.data.name}<br/>X: ${params.data.value[0].toFixed(2)}<br/>Y: ${params.data.value[1].toFixed(2)}<br/>Z: ${params.data.value[2].toFixed(2)}`
        },
        legend: { data: seriesData.map(s => s.name) },
        xAxis3D: { type: 'value', name: 'X' },
        yAxis3D: { type: 'value', name: 'Y' },
        zAxis3D: { type: 'value', name: 'Z' },
        grid3D: {
            boxWidth: 200,
            boxDepth: 200,
            boxHeight: 100,
            viewControl: { rotateSensitivity: 1, zoomSensitivity: 1 }
        },
        series: seriesData
    };

    chart.setOption(option);
    chart.on('click', (params) => {
        if (params.data) handleNodeClick(params.data);
    });
    updateUI(currentFilter);
}

function handleNodeClick(node) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    const filterToSet = currentFilter === node.name ? [] : [node.item.formattedKeys];
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

function updateUI(currentFilter) {
    if (!chart || !currentData.length) return;
    const updatedData = transformData(w.data.primaryData.items, currentFilter);
    chart.setOption({ series: updatedData });
}

function setupFilterListener() {
    visApi().onSelectedValuesChangedListener(
        { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
        (event) => updateUI(formatFilter(event.selectedValues))
    );
}

function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0 ? selectedValues[0].join(' - ') : '';
}

setupFilterListener();
```