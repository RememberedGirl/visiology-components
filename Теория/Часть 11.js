# Паттерн разработки виджетов для Visiology

## Особенности выполнения кода

**Важное замечание**: Весь код виджета выполняется заново при каждом обновлении данных (`w`). `TextRender` полностью перезаписывает DOM-элемент при каждом обновлении.

## Корректный паттерн жизненного цикла

### Единовременная инициализация
    ```javascript
// Глобальное состояние (сохраняется между выполнениями)
if (!window.visiologyWidgets) {
    window.visiologyWidgets = {};
}

const widgetId = w.general.renderTo;
```

### Проверка инициализации
    ```javascript
// Проверяем, был ли виджет уже инициализирован
if (!window.visiologyWidgets[widgetId]) {
    // Первичная инициализация
    window.visiologyWidgets[widgetId] = {
        initialized: false,
        currentFilter: '',
        chart: null,
        listenerGuid: null
    };
}

const widgetState = window.visiologyWidgets[widgetId];
```

### Полный паттерн с учетом переинициализации
    ```javascript
const widgetId = w.general.renderTo;

// Инициализация глобального состояния
if (!window.visiologyWidgets) window.visiologyWidgets = {};
if (!window.visiologyWidgets[widgetId]) {
    window.visiologyWidgets[widgetId] = {
        initialized: false,
        currentFilter: '',
        visualComponent: null,
        data: null
    };
}

const state = window.visiologyWidgets[widgetId];
```

## Корректная обработка обновлений данных

### 1. Обновление данных при каждом выполнении
    ```javascript
// Данные всегда актуальные из текущего `w`
state.data = w.data.primaryData.items.map((item, index) => ({
    id: index,
    _path: item.keys,
    _pathString: item.formattedKeys.join(' - '),
    // ... остальные поля
}));
```

### 2. Проверка необходимости реинициализации
    ```javascript
// Если DOM контейнер был удален (при полном обновлении через TextRender)
const containerExists = document.getElementById(`widget-${widgetId}`);
if (!containerExists || !state.initialized) {
    initializeWidget();
} else {
    updateWidget();
}
```

## Паттерн инициализации визуализации

### Полная инициализация
    ```javascript
function initializeWidget() {
    // 1. Создание контейнера (выполняется каждый раз)
    const html = `<div id="widget-${widgetId}" style="width:100%; height:100%;"></div>`;
TextRender({
    text: { ...w.general, text: html },
    style: {}
});

// 2. Ждем появления DOM элемента
setTimeout(() => {
    const container = document.getElementById(`widget-${widgetId}`);
    if (!container) return;

    // 3. Инициализация компонента
    state.visualComponent = createVisualization(container, state.data);

    // 4. Настройка обработчиков событий
    setupEventHandlers();

    // 5. Настройка слушателя фильтров (только один раз)
    if (!state.listenerSetup) {
        setupFilterListener();
        state.listenerSetup = true;
    }

    // 6. Получение текущего состояния фильтров
    updateCurrentFilter();

    // 7. Первоначальный рендер
    renderVisualization();

    state.initialized = true;
}, 0);
}
```

### Обновление существующей визуализации
```javascript
function updateWidget() {
    // Обновляем данные в существующем компоненте
    if (state.visualComponent && typeof state.visualComponent.updateData === 'function') {
        state.visualComponent.updateData(state.data);
    }

    // Обновляем фильтры
    updateCurrentFilter();
    renderVisualization();
}
```

## Обработка событий с учетом пересоздания DOM

### Глобальные обработчики
```javascript
// Обработчики должны быть глобальными, так как DOM пересоздается
window[`handleWidgetClick_${widgetId}`] = function(itemId) {
    const item = state.data.find(d => d.id === itemId);
    if (!item) return;

    const newFilter = state.currentFilter === item._pathString ? [] : [item._path];
    visApi().setFilterSelectedValues(widgetId, newFilter);
};
```

### Привязка обработчиков после рендера
```javascript
function setupEventHandlers() {
    const container = document.getElementById(`widget-${widgetId}`);
    if (!container) return;

    // Используем делегирование событий, так как элементы могут пересоздаваться
    container.addEventListener('click', (event) => {
        const target = event.target.closest('[data-item-id]');
        if (target) {
            const itemId = parseInt(target.dataset.itemId);
            window[`handleWidgetClick_${widgetId}`](itemId);
        }
    });
}
```

## Управление слушателями фильтров

### Единоразовая настройка слушателя
```javascript
function setupFilterListener() {
    // Слушатель создается только один раз
    visApi().onSelectedValuesChangedListener(
        { guid: `${widgetId}-listener`, widgetGuid: widgetId },
        (event) => {
            state.currentFilter = event.selectedValues && event.selectedValues.length > 0
                ? event.selectedValues[0].join(' - ')
                : '';

            // Обновляем визуализацию при изменении фильтров
            renderVisualization();
        }
    );
}
```

## Обновление текущего фильтра
```javascript
function updateCurrentFilter() {
    const currentFilters = visApi().getSelectedValues(widgetId);
    state.currentFilter = currentFilters && currentFilters.length > 0
        ? currentFilters[0].join(' - ')
        : '';
}
```

## Рендеринг визуализации
```javascript
function renderVisualization() {
    if (!state.visualComponent) return;

    // Обновляем стили в зависимости от текущего фильтра
    state.data.forEach(item => {
        const element = document.querySelector(`[data-item-id="${item.id}"]`);
        if (element) {
            const isSelected = state.currentFilter === item._pathString;
            element.classList.toggle('selected', isSelected);
        }
    });

    // Если используется сторонняя библиотека (Highcharts, ECharts, etc.)
    if (state.chart && typeof state.chart.update === 'function') {
        state.chart.update({
            // ... опции с учетом текущего фильтра
        });
    }
}
```

## Очистка ресурсов
```javascript
// При необходимости очистки (например, при удалении виджета)
function cleanupWidget() {
    if (state.visualComponent && typeof state.visualComponent.destroy === 'function') {
        state.visualComponent.destroy();
    }
    delete window.visiologyWidgets[widgetId];
    delete window[`handleWidgetClick_${widgetId}`];
}
```

## Резюме паттерна

1. **Глобальное состояние** - сохраняется между выполнениями кода
2. **Проверка инициализации** - определяет, нужно ли создавать DOM и компоненты заново
3. **Пересоздание DOM** - через `TextRender` при каждом выполнении
4. **Реинициализация компонентов** - только при потере DOM элементов
5. **Единоразовые слушатели** - настройка listeners происходит один раз
6. **Глобальные обработчики** - для работы с пересоздаваемыми DOM элементами
7. **Обновление данных** - при каждом выполнении кода с новыми данными из `w`

Этот паттерн обеспечивает корректную работу виджета при постоянном перевыполнении кода и обновлении DOM через TextRender.