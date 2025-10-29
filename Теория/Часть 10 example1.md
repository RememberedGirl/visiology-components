**КОНТЕКСТ:** Ты - эксперт по разработке виджетов для платформы Visiology. Сгенерируй полный JavaScript код виджета, строго соблюдая архитектурные особенности платформы.

**ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ VISIOLOGY:**

**1. СТРУКТУРА ДАННЫХ:**
- Использовать `w.data.primaryData.items` с полями: `keys`, `values`, `formattedKeys`, `formattedValues`, `cols`, `metadata`
- Поддержка ЛЮБОЙ вложенности измерений и количества метрик

**2. КОРРЕКТНЫЙ ПАТТЕРН ФИЛЬТРАЦИИ (БЕЗ ЦИКЛИЧЕСКИХ СОБЫТИЙ):**
```javascript
const widgetGuid = w.general.renderTo;
let currentFilter = null;

// GET начального состояния
const initialFilters = visApi().getSelectedValues(widgetGuid);
currentFilter = initialFilters?.[0] || null;

// SET фильтра с проверкой на изменение
function handleClick(item) {
    const newFilter = currentFilter?.join(' - ') === item.formattedKeys.join(' - ') ? null : [item.keys];
    if (JSON.stringify(newFilter) !== JSON.stringify(currentFilter)) {
        visApi().setFilterSelectedValues(widgetGuid, newFilter || []);
    }
}

// LISTEN с защитой от рекурсии
visApi().onSelectedValuesChangedListener(
    {guid: widgetGuid + '-listener', widgetGuid: widgetGuid},
    (event) => {
        const newFilter = event.selectedValues?.[0] || null;
        if (JSON.stringify(newFilter) !== JSON.stringify(currentFilter)) {
            currentFilter = newFilter;
            updateVisualization();
        }
    }
);
```

**3. КОНТЕЙНЕР:**
```javascript
w.general.text = `<div id="widget-${w.general.renderTo}" style="width:100%; height:100%;"></div>`;
TextRender({ text: w.general, style: {} });
```

**ЗАПРОС НА ВИЗУАЛИЗАЦИЮ:**

**Библиотека:** [ECharts]
**Тип визуализации:** [treemap]
**Пример абстрактной визуализации:**
```javascript
const chart = echarts.init(container);
chart.setOption({
    series: [{
        type: 'treemap',
        data: [{
            name: 'Parent',
            value: 100,
            children: [
                {name: 'Child1', value: 60},
                {name: 'Child2', value: 40}
            ]
        }]
    }]
});
```

**ПРЕОБРАЗОВАНИЕ ДАННЫХ:**
- Анализировать структуру `keys` для определения уровней иерархии
- Строить древовидную структуру из элементов `items`
- Агрегировать значения метрик на родительских уровнях
- Использовать `formattedKeys` для отображаемых имен
- Сохранять исходные `keys` в листовых узлах для фильтрации

**ИНТЕРАКТИВНОСТЬ:**
- Кликабельные элементы: все узлы treemap
- Визуальное выделение: изменение цвета выбранного узла
- Toggle логика: да

**ТРЕБУЕМЫЙ ВЫВОД:**
Полный JS код виджета Visiology с поддержкой ЛЮБОЙ структуры данных. Код должен быть минималистичным, без лишних функций. Не использовать `onDataUpdated`, `onResize`, `formatNumber`. Только необходимый код виджета.