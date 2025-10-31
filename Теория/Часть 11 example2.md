# Универсальный шаблон виджета Visiology

## Базовая структура (скопируй и заполни)

```javascript
// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;

// === ПЕРЕМЕННЫЕ ===
let visualization = null;  // Хранилище объекта графика
let data = [];             // Данные

// === ИНИЦИАЛИЗАЦИЯ ===
function init() {
    if (!w.data.primaryData?.items) return;
    
    const items = w.data.primaryData.items;
    data = transformData(items);
    
    createContainer();
    render(data);
    setupListener();
}

// === ТРАНСФОРМАЦИЯ ДАННЫХ ===
function transformData(items) {
    // ЗАПОЛНИ: преобразование items в формат для твоей визуализации
    return items;
}

// === КОНТЕЙНЕР ===
function createContainer() {
    w.general.text = `<div id="widget-${widgetGuid}" style="width:100%;height:100%;"></div>`;
    TextRender({ text: w.general, style: {} });
}

// === РЕНДЕРИНГ ===
function render(items) {
    const container = document.getElementById(`widget-${widgetGuid}`);
    if (!container) return;
    
    // ЗАПОЛНИ: инициализация графика (ECharts, Highcharts, HTML и т.д.)
    
    // ЗАПОЛНИ: обработчик клика
    // visualization.on('click', handleClick);
}

// === ОБРАБОТЧИК КЛИКА (SET) ===
function handleClick(clickedItem) {
    const current = getFilter();
    const clicked = getItemString(clickedItem);  // ЗАПОЛНИ: как получить строку фильтра
    
    // Toggle: если уже выбран - отменить, иначе - выбрать
    const newFilter = current === clicked ? [] : [clickedItem.keys];
    
    visApi().setFilterSelectedValues(widgetGuid, newFilter);
}

// === ПОЛУЧЕНИЕ ФИЛЬТРА ===
function getFilter() {
    const f = visApi().getSelectedValues(widgetGuid);
    return f?.length > 0 ? f[0].join(' - ') : '';
}

// === ОБНОВЛЕНИЕ UI (LISTEN) ===
function updateUI(filter) {
    // ЗАПОЛНИ: как обновить визуализацию при изменении фильтра
}

// === СЛУШАТЕЛЬ ФИЛЬТРОВ ===
function setupListener() {
    visApi().onSelectedValuesChangedListener(
        { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
        (event) => {
            const filter = event.selectedValues?.length > 0 ? event.selectedValues[0].join(' - ') : '';
            updateUI(filter);
        }
    );
}

// === ЗАПУСК ===
init();
```

---

## Что ЗАПОЛНИТЬ

### 1. `transformData(items)`
**Вход:** массив объектов с полями `keys`, `formattedKeys`, `values`, `cols`  
**Выход:** данные в формате для твоей библиотеки

**Примеры:**

Для таблицы:
```javascript
function transformData(items) {
    return items.map((item, i) => ({
        id: i,
        ...Object.fromEntries(item.cols.map((col, idx) => 
            [col, idx < item.keys.length ? item.keys[idx] : item.values[idx - item.keys.length]]
        )),
        _keys: item.keys
    }));
}
```

Для диаграммы:
```javascript
function transformData(items) {
    return items.map(item => ({
        name: item.formattedKeys.join(' - '),
        value: item.values[0],
        keys: item.keys
    }));
}
```

---

### 2. `render(items)`
**Задача:** инициализировать графику и добавить обработчик клика

**Пример для ECharts:**
```javascript
function render(items) {
    const container = document.getElementById(`widget-${widgetGuid}`);
    visualization = echarts.init(container);
    
    visualization.setOption({
        series: [{
            type: 'bar',
            data: items.map(item => ({ value: item.value, name: item.name }))
        }]
    });
    
    visualization.on('click', params => {
        if (params.data) handleClick({ keys: data[params.dataIndex].keys });
    });
}
```

**Пример для DataGrid:**
```javascript
function render(items) {
    const container = document.getElementById(`widget-${widgetGuid}`);
    const cols = Object.keys(items[0] || {}).filter(k => !k.startsWith('_'));
    
    visualization = $(container).dxDataGrid({
        dataSource: items,
        columns: cols,
        onRowClick: (e) => handleClick({ keys: e.data._keys })
    }).dxDataGrid('instance');
}
```

---

### 3. `getItemString(item)`
**Задача:** вернуть строку фильтра из элемента

```javascript
function getItemString(item) {
    return Array.isArray(item.keys) ? item.keys.join(' - ') : '';
}
```

---

### 4. `updateUI(filter)`
**Задача:** обновить визуализацию при изменении фильтра

**Пример для ECharts:**
```javascript
function updateUI(filter) {
    if (!visualization) return;
    
    visualization.setOption({
        series: [{
            data: data.map(item => ({
                value: item.value,
                name: item.name,
                itemStyle: {
                    color: item.name === filter ? '#ff0000' : '#0066cc'
                }
            }))
        }]
    });
}
```

**Пример для DataGrid:**
```javascript
function updateUI(filter) {
    if (!visualization) return;
    visualization.clearSelection();
    const row = data.find(item => item.name === filter);
    if (row) visualization.selectRows([row.id], false);
}
```

---

## Пошаговый чек-лист

- [ ] Понял структуру входных данных (`keys`, `values`, `cols`)
- [ ] Выбрал тип визуализации (таблица/граф/диаграмма)
- [ ] Заполнил `transformData()` - преобразование данных
- [ ] Заполнил `render()` - инициализация графики + клик
- [ ] Заполнил `getItemString()` - как получить строку фильтра
- [ ] Заполнил `updateUI()` - как обновить при фильтрации
- [ ] Протестировал клик (должен подсвечиваться)
- [ ] Протестировал toggle (повторный клик = отмена)
- [ ] Протестировал синхронизацию с другими виджетами

---

## Логика работы

```
ИНИЦИАЛИЗАЦИЯ:
  init() → transformData() → createContainer() → render()
  
КЛИК ПОЛЬЗОВАТЕЛЯ:
  handleClick() → getFilter() → setFilterSelectedValues()
  
ПОЛУЧЕНИЕ СОБЫТИЯ ОТ ДРУГИХ ВИДЖЕТОВ:
  setupListener() слышит → updateUI() обновляет
  
TOGGLE ЛОГИКА:
  Если текущий фильтр == кликнутый элемент → очистить []
  Иначе → установить [keys]
```

---

## Переменные в контексте

| Переменная | Откуда | Описание |
|-----------|--------|---------|
| `widgetGuid` | `w.general.renderTo` | Уникальный ID виджета |
| `items` | `w.data.primaryData.items` | Данные из источника |
| `w.colors` | Контекст Visiology | Палитра цветов дашборда |
| `visApi()` | Контекст Visiology | API для работы с фильтрами |

---

## Методы API Visiology

```javascript
// Получить текущие фильтры
visApi().getSelectedValues(widgetGuid)
// → [["Россия"], ["Москва"]] или []

// Установить новый фильтр
visApi().setFilterSelectedValues(widgetGuid, [["Россия", "Москва"]])

// Слушать изменения фильтров
visApi().onSelectedValuesChangedListener({...}, callback)
```

---

## Готовые примеры в отдельных документах

Используй этот шаблон как основу и заполни нужные части для:
- **DataGrid** (таблица)
- **Treemap** (иерархия)
- **Graph** (граф)
- **Bar/Pie Chart** (диаграммы)
- **Scatter** (точечная диаграмма)