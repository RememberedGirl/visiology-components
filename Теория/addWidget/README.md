## Исправленный алгоритм создания виджета в Visiology без интерактивности

### Общий паттерн структуры кода:

```javascript
// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;

// === ПЕРЕМЕННЫЕ ===
let chart = null;

// === ЗАГРУЗКА БИБЛИОТЕК ===
function loadLibraries(callback) {
    const scripts = [
        // АДАПТИРУЙ: добавь нужные библиотеки
        // Пример для ECharts:
        // {
        //     id: '_echarts',
        //     src: 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js'
        // }
    ];
    
    const inlineScripts = [
        // АДАПТИРУЙ: добавь inline библиотеки
        // {
        //     id: '_customLib',
        //     code: `
        //         window.myCustomLib = {
        //             createChart: function(container, data) {
        //                 // реализация
        //             }
        //         };
        //     `
        // }
    ];
   
}

// === ИНИЦИАЛИЗАЦИЯ ===
function init() {
    // 1. Загрузка библиотек с ожиданием завершения
    loadLibraries()
    // 2. Преобразование данных
    const transformedData = transformData(w.data.primaryData.items);
    
    // 3. Создание контейнера
    createContainer();
    
    // 4. Рендеринг визуализации
    render(transformedData);

}

// === ТРАНСФОРМАЦИЯ ДАННЫХ ===
function transformData(items) {
    // АДАПТИРУЙ: преобразуй items в нужный формат
    return items.map(item => ({
        name: item.formattedKeys.join(' - '),
        value: item.values[0]
        // ... другие поля
    }));
}

// === СОЗДАНИЕ КОНТЕЙНЕРА ===
function createContainer() {
    const html = `<div id="customWidget-${widgetGuid}" style="width:100%;height:100%;overflow:hidden;"></div>`;
    w.general.text = html;
    TextRender({ text: w.general, style: {} });
}

// === РЕНДЕРИНГ ВИЗУАЛИЗАЦИИ ===
function render(data) {
    const container = document.getElementById(`customWidget-${widgetGuid}`);
    
    // АДАПТИРУЙ: выбери библиотеку визуализации
        chart = echarts.init(container);
        chart.setOption({
            series: [{ type: 'bar', data: data }]
        });
}

// === ЗАПУСК ===
init();
```

### Примеры для разных типов виджетов:

#### Пример 1: ECharts график
```javascript
const widgetGuid = w.general.renderTo;
let chart = null;

function init() {

    const data = transformData(w.data.primaryData.items);
    createContainer();
    render(data);

}

function transformData(items) {
    return items.map(item => ({
        name: item.formattedKeys.join(' - '),
        value: item.values[0]
    }));
}


function render(data) {
    const container = document.getElementById(`customWidget-${widgetGuid}`);
    if (!container) return;
    
    if (window.echarts) {
        chart = echarts.init(container);
        chart.setOption({
            series: [{
                type: 'bar',
                data: data
            }]
        });
    }
}

init();
```

#### Пример 2: DevExtreme таблица
```javascript
const widgetGuid = w.general.renderTo;

function init() {

    const data = transformData(w.data.primaryData.items);
    createContainer();
    render(data);

}

function transformData(items) {
    const keyLen = items[0].keys.length;
    return items.map(item => {
        const obj = {};
        item.keys.forEach((key, i) => obj[item.cols[i]] = key);
        item.values.forEach((val, i) => obj[item.cols[keyLen + i]] = val);
        return obj;
    });
}

function render(data) {
    const container = document.getElementById(`customWidget-${widgetGuid}`);
    if (!container) return;
    
    if (window.DevExpress) {
        $(container).dxDataGrid({
            dataSource: data,
            showBorders: true,
            columns: Object.keys(data[0] || {})
        });
    }
}

init();
```

#### Пример 3: Кастомный HTML (без библиотек)
```javascript
const widgetGuid = w.general.renderTo;

function init() {
    
    const data = transformData(w.data.primaryData.items);
    createContainer();
    render(data);

}

function transformData(items) {
    return items.map(item => ({
        name: item.formattedKeys.join(' - '),
        value: item.values[0]
    }));
}

function createContainer() {
    const html = `<div id="customWidget-${widgetGuid}" style="width:100%;height:100%;overflow:hidden;"></div>`;
    w.general.text = html;
    TextRender({ text: w.general, style: {} });
}

function render(data) {
    const container = document.getElementById(`customWidget-${widgetGuid}`);
    if (!container) return;
    
    // Простой HTML рендеринг
    container.innerHTML = `
        <div style="padding: 20px;">
            <h3>Данные виджета</h3>
            ${data.map(item => `
                <div style="margin: 10px 0; padding: 10px; background: #f5f5f5;">
                    <strong>${item.name}</strong>: ${item.value}
                </div>
            `).join('')}
        </div>
    `;
}

init();
```
## Структура данных `w` в Visiology

### Основные компоненты объекта `w`:

```javascript
w = {
    // 1. ОБЩИЕ НАСТРОЙКИ ВИДЖЕТА
    "general": {
        "renderTo": "ccdd4b5b4e694fe887d255918accc345", // ID контейнера в DOM
    },
    
    // 2. ЦВЕТОВАЯ ПАЛИТРА
    "colors": [
        "rgba(40, 238, 150, 1)",
        "rgba(255, 217, 0, 1)",
        // ... массив цветов для визуализации
    ],
    
    // 3. ДАННЫЕ
    "data": {
        "primaryData": {
            "items": [ // ОСНОВНОЙ МАССИВ ДАННЫХ
                {
                    // Измерения
                    "keys": ["North", "Chicago"],
                    "formattedKeys": ["North", "Chicago"],
                    
                    // ЧИСЛОВЫЕ ЗНАЧЕНИЯ (метрики)
                    "values": [910.625, 1821.25, 945.75],
                    "formattedValues": ["910,625", "1821,25", "945,75"],
                    
                    // Порядок и названия колонок (keys + values)
                    "cols": ["region", "city", "ВВП", "Сумма продаж с учётом скидки", "Население"],
                    
                    // МЕТАДАННЫЕ КОЛОНОК
                    "metadata": [
                        {
                            "columnName": "Avg_Value",
                            "displayName": "ВВП",
                            "tableName": "factonlinesales",
                            "dataType": "Double",
                            "columnType": 1  // 1 = метрика, 0 = измерение
                        }
                        // ...
                    ]
                }ы
            ]
        }
    },
    
    // 4. ПОЛЬЗОВАТЕЛЬСКИЕ СВОЙСТВА
    "props": {
        "u1": "12",
        "u2": "56"
    }
}
```

## Принцип работы с DOM в Visiology

### 1. Создание контейнера через TextRender

```javascript
// Visiology создает контейнер автоматически
// Наш код добавляет в него контент:

function createContainer() {
    // Устанавливаем HTML в свойство text
    w.general.text = `<div id="customWidget-${widgetGuid}" style="width:100%;height:100%;overflow:hidden;"></div>`;
    
    // Visiology рендерит этот HTML в DOM
    TextRender({ 
        text: w.general, 
        style: {} 
    });
    
    // Результат в DOM:
    // <div id="ccdd4b5b4e694fe887d255918accc345">
    //     <div id="customWidget-ccdd4b5b4e694fe887d255918accc345" style="..."></div>
    // </div>
}
```

### 2. Структура DOM после рендеринга:

```html
<!-- Visiology создает корневой контейнер -->
<div id="ccdd4b5b4e694fe887d255918accc345">
    
    <!-- Наш кастомный контейнер -->
    <div id="customWidget-ccdd4b5b4e694fe887d255918accc345" style="...">
        <!-- Здесь будет наша визуализация -->
    </div>
    
</div>
```

### 3. Практические примеры использования данных

#### Пример 1: Простая таблица
```javascript
function transformForTable(items) {
    const keyLen = items[0].keys.length; // количество измерений
    
    return items.map(item => {
        const row = {};
        
        // Измерения (ключи)
        item.keys.forEach((key, i) => {
            row[item.cols[i]] = key; // region: "North", city: "Chicago"
        });
        
        // Метрики (значения)
        item.values.forEach((value, i) => {
            row[item.cols[keyLen + i]] = value; // Avg_Order_Value: 910.625
        });
        
        return row;
    });
}
```

