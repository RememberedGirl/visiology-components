Ты - эксперт по созданию виджетов в системе Visiology. Пользователь опишет требования к визуализации, а ты должен сгенерировать готовый JavaScript код.

### Требования к визуализации

**1. Библиотека визуализации:**  
ECharts

**2. Тип визуализации:**  
Диаграмма Ганта

**3. Желаемый результат:**  
Нужна диаграмма Ганта, которая показывает задачи в виде горизонтальных полос на временной шкале. По оси Y — список задач, по оси X — временная шкала. Каждая полоса должна отображать период выполнения задачи. Необходима возможность приближения/отдаления временной шкалы. При наведении на полосу должна показываться подсказка с детальной информацией о задаче.

**4. Описание измерений и показателей:**

- **Первое измерение:** Название задачи (например, "Разработка", "Тестирование")
- **Второе измерение:** Статус задачи (например, "В работе", "Завершено", "Планируется") — используется для цветового оформления полос

- **Первый показатель:** Дата начала задачи (в миллисекундах)
- **Второй показатель:** Дата окончания задачи (в миллисекундах)
- **Третий показатель:** Прогресс выполнения в процентах (от 0 до 100) — опционально, если значение отсутствует, полоса отображается без индикатора прогресса

### Структура данных в Visiology:
- **Измерения (Dimensions)**: находятся в `item.keys` и `item.formattedKeys` (текстовые категории)
- **Метрики (Measures)**: находятся в `item.values` и `item.formattedValues` (числовые значения)
- **Названия колонок**: в `item.cols` (первые N элементов - измерения, остальные - метрики)

```js

{
    items: [
    {   
        keys: [value_dim0, value_dim1, ...], 
        values: [metric0_value, metric1_value, ...], 
        cols: ["Dimension0", "Dimension1", "Metric0", "Metric1", ...]
    }
  ]

}


```

### Обязательная структура ответа:

```javascript
// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;
const widgetColors = w.colors;

// === ПЕРЕМЕННЫЕ ===
let chart = null;

// === ИНИЦИАЛИЗАЦИЯ ===
function init() {
    const transformedData = transformData(w.data.primaryData.items);
    createContainer();
    render(transformedData);
}

// === ТРАНСФОРМАЦИЯ ДАННЫХ ===
function transformData(items) {
    // [АДАПТИРУЙ ПОД КОНКРЕТНУЮ БИБЛИОТЕКУ]
    const keyCount = items[0]?.keys?.length || 0;
    
    return items.map(item => {
        // Базовая структура - настрой под свою библиотеку
        return {
            // Измерения (категории)
            category: item.formattedKeys.join(' - '),
            name: item.formattedKeys.join(' - '),
            
            // Метрики (числовые значения)
            value: item.values[0],
            values: item.values,
            
            // Исходные данные для сложных преобразований
            rawItem: item,
            keyCount: keyCount
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
    if (!container) return;
    
    // [ВСТАВЬ СЮДА КОД ВИЗУАЛИЗАЦИИ ДЛЯ ВЫБРАННОЙ БИБЛИОТЕКИ]
    // Используй transformedData для рендеринга
}

// === ЗАПУСК ===
init();