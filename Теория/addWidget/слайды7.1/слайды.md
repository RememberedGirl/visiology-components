Ты - эксперт по созданию виджетов в системе Visiology. Пользователь опишет требования к визуализации, а ты должен сгенерировать готовый JavaScript код.

# Требования к визуализации: Интерактивная карта с маркерами

## 1. Библиотека визуализации
**Leaflet**

## 2. Тип визуализации
**Интерактивная карта с цветными полигонами**

## 3. Желаемый результат

Создай интерактивную карту Москвы, где полигоны достопримечательностей окрашены в зависимости от числового значения. При наведении показывать название и значение.

### Визуальные характеристики:
*   **Цвет полигона:** градиент от зеленого к красному based на значении (78-95)
*   **Обводка:** темно-серая, толщина 2px
*   **Всплывающие подсказки:** название + значение при hover
*   **Попапы:** детальная информация при клике

## 4. Структура данных

### Измерения:
*   **Измерение[0]:** Название достопримечательности (keys[0])
*   **Измерение[1]:** GeoJSON полигона (keys[1])

### Показатели:
*   **Показатель[0]:** Числовое значение (values[0])



## Структура данных в Visiology:
- **Измерения (Dimensions)**: находятся в `item.keys` и `item.formattedKeys` (текстовые категории)
- **Метры/показатели (Measures)**: находятся в `item.values` и `item.formattedValues` (числовые значения)
- **Названия колонок**: в `item.cols` (первые N элементов - измерения, остальные - метры)

### Пример структуры данных:
```javascript
{
    items: [
    {   
        keys: [value_dim0, value_dim1, ...], 
        values: [metric0_value, metric1_value, ...], 
        cols: ["nameimension0", "nameDimension1", ..., "nameMetric0", "nameMetric1", ...]
    }
  ]
}
```

## Обязательная структура ответа:

```javascript
// === КОНФИГУРАЦИЯ ===
// Уникальный идентификатор виджета для создания DOM-элемента
// Используется: document.getElementById(`customWidget-${widgetGuid}`)
const widgetGuid = w.general.renderTo;

// Цветовая палитра виджета из настроек Visiology
// Используется: widgetColors[0] - первый цвет из палитры для заливки элементов
const widgetColors = w.colors;

// === ПЕРЕМЕННЫЕ ===
// Переменная для хранения экземпляра chart (ECharts, Chart.js и т.д.)
// Используется: chart = echarts.init(container); chart.setOption(option);
let chart = null;

// === ИНИЦИАЛИЗАЦИЯ ===
function init() {
    const transformedData = transformData(w.data.primaryData.items);
    createContainer();
    render(transformedData);
}

// === ТРАНСФОРМАЦИЯ ДАННЫХ ===
function transformData(items) {
    // [АДАПТИРУЙ ЭТОТ ПРМЕР ПОД КОНКРЕТНУЮ БИБЛИОТЕКУ]
    return items.map(item => {
        return {     
            // Измерения (категории)
            categories : item.keys,                 
            // Метры/показатели (числовые значения)
            data: item.values,
            // Названия колонок (кeys + values)
            name: item.cols,
            // Путь
            path: item.keys.join(' - ')
        };
    });
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
    
    // [ВСТАВЬ СЮДА КОД ВИЗУАЛИЗАЦИИ ДЛЯ ВЫБРАННОЙ БИБЛИОТЕКИ]
    // Используй transformedData для рендеринга
}

// === ЗАПУСК ===
init();
```

Ограничения реализации:
Код должен строго соответствовать предоставленной структуре
Не добавлять дополнительные проверки данных
Не добавлять обработчики resize
Не добавлять обработку ошибок
Использовать только существующие переменные и функции шаблона