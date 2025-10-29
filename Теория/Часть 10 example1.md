Вот подробная пошаговая инструкция о том, как добавить **любую визуализацию в Visiology** на основе твоих примеров с TreeMap, графом, Highcharts и таблицей. Я постарался оформить её как практическое руководство, пригодное для использования как новичками, так и опытными пользователями.

---

## **Шаг 1. Подготовка данных**

Все визуализации в Visiology используют данные из объекта `w.data.primaryData.items`. Перед визуализацией данные обычно обрабатываются, чтобы добавить вспомогательные поля, пути и фильтры.

Пример универсального преобразования данных:

```javascript
const keyLen = w.data.primaryData.items[0].keys.length;

const data = w.data.primaryData.items.map((item, index) => {
    const obj = { id: index }; // уникальный ID для стабильного выделения
    
    // Добавляем все ключи как свойства
    item.keys.forEach((key, i) => obj[item.cols[i]] = key);
    
    // Добавляем все значения как свойства
    item.values.forEach((val, i) => obj[item.cols[keyLen + i]] = val);
    
    // Добавляем путь и строку пути для фильтров
    obj._path = item.keys;
    obj._pathString = item.formattedKeys.join(' - ');
    
    return obj;
});
```

> 🔹 Рекомендация: всегда добавляй `_path` и `_pathString`, чтобы потом легко синхронизировать визуализацию с фильтрами Visiology.

---

## **Шаг 2. Получение текущего фильтра**

Visiology позволяет работать с фильтрами через API:

```javascript
let currentFilter = '';
const currentFilters = visApi().getSelectedValues(w.general.renderTo);
if (currentFilters && currentFilters.length > 0) {
    currentFilter = currentFilters.map(e => e.join(' - '))[0];
}
```

> 🔹 `currentFilter` нужен для отображения текущего состояния выделения.

---

## **Шаг 3. Создание контейнера для визуализации**

Используем `TextRender` для рендера HTML-контейнера внутри виджета:

```javascript
const html = `<div id="chart-${w.general.renderTo}" style="width:100%; height:100%;"></div>`;

TextRender({
    text: { ...w.general, text: html },
    style: {}
});
```

---

## **Шаг 4. Рендер визуализации**

### **Пример 1: TreeMap с ECharts**

```javascript
const container = document.getElementById(`chart-${w.general.renderTo}`);
const chart = echarts.init(container);

chart.setOption({
    series: [{
        type: 'treemap',
        data: buildTreeData(w.data.primaryData.items), // функция сборки дерева
        label: { show: true, color: '#fff' },
        emphasis: { itemStyle: { borderColor: '#ff0000', borderWidth: 4 } },
        roam: false
    }]
});

// Клик по узлу для фильтра
chart.on('click', function(params) {
    if (params.data && params.data._path) {
        const filter = [params.data._path];
        visApi().setFilterSelectedValues(w.general.renderTo, filter);
    }
});
```

---

### **Пример 2: Force-Graph с ECharts**

```javascript
const nodes = [...]; // подготовленные узлы
const links = [...]; // связи между узлами

chart.setOption({
    series: [{
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        label: { show: true },
        roam: true,
        selectedMode: 'single'
    }]
});

chart.on('click', function(params) {
    if (params.dataType === 'node') {
        const filter = [params.data._path];
        visApi().setFilterSelectedValues(w.general.renderTo, filter);
    }
});
```

---

### **Пример 3: Highcharts (линейный, столбчатый график)**

```javascript
const series = keys.map((key, j) => ({
    name: key,
    data: data.map(item => ({
        y: item[key],
        marker: {
            lineWidth: currentFilter === item._pathString ? 2 : 0,
            lineColor: '#000'
        }
    }))
}));

const chart = Highcharts.chart(`chart-${w.general.renderTo}`, {
    xAxis: { categories: data.map(d => d._pathString) },
    series,
    plotOptions: {
        series: {
            point: {
                events: {
                    click: function() {
                        const category = [data[this.index]._path];
                        visApi().setFilterSelectedValues(w.general.renderTo, category);
                    }
                }
            }
        }
    }
});
```

---

### **Пример 4: Таблица (dxDataGrid / DevExtreme)**

```javascript
const grid = $(`#table-${w.general.renderTo}`).dxDataGrid({
    dataSource: data,
    keyExpr: 'id',
    columns: Object.keys(data[0]).filter(col => !col.startsWith('_')),
    selection: { mode: 'single' },
    onRowClick: function(e) {
        const filter = [e.data._path];
        visApi().setFilterSelectedValues(w.general.renderTo, filter);
    },
    onContentReady: function(e) {
        if (currentFilter) {
            const row = data.find(item => item._pathString === currentFilter);
            if (row) e.component.selectRows([row.id], false);
        }
    }
}).dxDataGrid('instance');
```

---

## **Шаг 5. Слушаем изменения фильтров**

Чтобы визуализация синхронизировалась с другими виджетами:

```javascript
visApi().onSelectedValuesChangedListener(
    { guid: w.general.renderTo + '-listener', widgetGuid: w.general.renderTo },
    function(event) {
        const newFilters = event.selectedValues || [];
        currentFilter = newFilters.length > 0 ? newFilters.map(e => e.join(' - '))[0] : '';

        // Обновляем визуализацию (TreeMap, граф, Highcharts или таблицу)
        updateVisualization(currentFilter);
    }
);
```

> 🔹 `updateVisualization` — функция, которая обновляет стиль выбранного элемента.

---

## **Шаг 6. Обновление UI после фильтра**

Пример для TreeMap / графа:

```javascript
function updateVisualization(currentFilter) {
    // TreeMap
    chart.setOption({
        series: [{
            data: treeData.map(node => ({
                ...node,
                itemStyle: {
                    borderColor: node._pathString === currentFilter ? '#ff0000' : '#333',
                    borderWidth: node._pathString === currentFilter ? 4 : 2
                }
            }))
        }]
    });
}
```

> Для Highcharts и таблицы обновление уже показано в предыдущих примерах через `point.update` или `selectRows`.

---

## **Итог**

Чтобы добавить любую визуализацию в Visiology:

1. **Подготовить данные** (`_path`, `_pathString`).
2. **Получить текущий фильтр** через `visApi().getSelectedValues`.
3. **Создать HTML-контейнер** через `TextRender`.
4. **Инициализировать график/таблицу** (ECharts, Highcharts, DevExtreme).
5. **Добавить обработку кликов** на элементы и синхронизацию с фильтрами.
6. **Подписаться на события фильтров** и обновлять визуализацию при изменении.
7. **Обновлять стиль выбранных элементов** через API визуализации.
