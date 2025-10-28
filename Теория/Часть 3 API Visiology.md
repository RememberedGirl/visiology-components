# API Visiology - полное руководство

## 3.1 Методы управления фильтрами

### `setFilterSelectedValues()` - полное руководство

**Назначение**: Основной метод для установки фильтров в виджетах

**Синтаксис**:
```javascript
visApi().setFilterSelectedValues(widgetGuid, values, handler)
```

**Параметры**:
- `widgetGuid: string` - GUID целевого виджета
- `values: string[][]` - массив значений фильтра. Пример: `[["2017", "Январь"], ["2018", "Февраль"]]`
- `handler: Function() => void` - опциональный колбэк после установки

**Форматы значений**:

```javascript
// Одиночный фильтр
visApi().setFilterSelectedValues("widget-123", [["North"]]);

// Множественный выбор
visApi().setFilterSelectedValues("widget-123", [["North"], ["South"]]);

// Иерархический фильтр (несколько уровней)
visApi().setFilterSelectedValues("widget-123", [["North", "Chicago", "Customer1"],["West", "Phoenix"]]);

// Очистка фильтра
visApi().setFilterSelectedValues("widget-123", []);

// С колбэком
visApi().setFilterSelectedValues("widget-123", [["North"]], function() {
    console.log("Фильтр установлен");
});
```

**Паттерн использования**:
```javascript
// Правильный паттерн: GET → SET → LISTEN
const widgetGuid = w.general.renderTo;
let currentFilter = '';

// 1. GET - один раз при загрузке
function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    currentFilter = formatFilter(initialFilters);
    renderUI();
}

// 2. SET - при действии пользователя
function handleUserAction(newFilterValue) {
    const filterToSet = currentFilter === newFilterValue ? [] : [newFilterValue.split(' - ')];
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

// 3. LISTEN - для обновлений UI
visApi().onSelectedValuesChangedListener(
    {guid: widgetGuid + '-listener', widgetGuid: widgetGuid}, 
    (event) => {
        currentFilter = formatFilter(event.selectedValues);
        renderUI();
    }
);
```

### `setDateFilterSelectedValues()` - работа с датами

**Назначение**: Специализированный метод для фильтров по датам

**Синтаксис**:
```javascript
visApi().setDateFilterSelectedValues(widgetGuid, values)
```

**Примеры использования**:

```javascript
// Одиночная дата
visApi().setDateFilterSelectedValues("date-widget-123", [new Date('2024-01-01')]);

// Диапазон дат
visApi().setDateFilterSelectedValues("date-widget-123", [
    new Date('2024-01-01'), 
    new Date('2024-01-31')
]);

// Относительные даты
const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

visApi().setDateFilterSelectedValues("date-widget-123", [firstDay, lastDay]);

// Очистка датного фильтра
visApi().setDateFilterSelectedValues("date-widget-123", []);
```

### `getSelectedValues()` - получение текущих фильтров

**Назначение**: Получение текущих значений фильтров виджета

**Синтаксис**:
```javascript
const selectedValues = visApi().getSelectedValues(widgetGuid)
```

**Возвращаемое значение**: `string[][]` - массив массивов строк

**Примеры использования**:

```javascript
// Получение фильтров
const filters = visApi().getSelectedValues("widget-123");

// Анализ фильтров
function analyzeFilters(widgetGuid) {
    const filters = visApi().getSelectedValues(widgetGuid);
    
    return {
        hasFilter: filters.length > 0,
        filterCount: filters.length,
        isMultiSelect: filters.length > 1,
        values: filters.map(filter => filter.join(' → ')),
        rawValues: filters
    };
}

// Синхронизация фильтров между виджетами
function syncFilters(sourceWidget, targetWidgets) {
    const sourceFilters = visApi().getSelectedValues(sourceWidget);
    
    targetWidgets.forEach(widget => {
        visApi().setFilterSelectedValues(widget, sourceFilters);
    });
}

// Валидация фильтров
function validateFilters(widgetGuid, allowedValues) {
    const filters = visApi().getSelectedValues(widgetGuid);
    
    return filters.every(filter => 
        filter.every(value => allowedValues.includes(value))
    );
}
```

## 3.3 Система событий

### `onSelectedValuesChangedListener()` - полное руководство

**Назначение**: Подписка на изменения фильтров виджета

**Синтаксис**:
```javascript
visApi().onSelectedValuesChangedListener({ guid, widgetGuid }, handler)
```

**Параметры**:
- `guid: string` - уникальный идентификатор подписки
- `widgetGuid: string` - GUID виджета для отслеживания
- `handler: Function` - функция-обработчик

**Структура события**:
```javascript
{
    widgetGuid: string,           // ID виджета
    selectedValues: string[][],   // Новые значения фильтра
    useExcluding: boolean,        // Исключающий фильтр
    filter: WidgetDataFilter      // Полная информация о фильтре
}
```

**Полное руководство**:

#### Базовая подписка
```javascript
visApi().onSelectedValuesChangedListener(
    { 
        guid: 'my-filter-listener', 
        widgetGuid: w.general.renderTo 
    },
    function(event) {
        console.log('Фильтр изменен:', {
            widget: event.widgetGuid,
            values: event.selectedValues,
            isExcluding: event.useExcluding
        });
        
        updateVisualization(event.selectedValues);
    }
);
```

#### Обработка различных сценариев
```javascript
visApi().onSelectedValuesChangedListener(
    { guid: 'advanced-listener', widgetGuid: w.general.renderTo },
    function(event) {
        const newFilters = event.selectedValues || [];
        const changeType = detectFilterChange(newFilters);
        
        switch(changeType) {
            case 'filter-applied':
                handleFilterApplied(newFilters);
                break;
            case 'filter-cleared':
                handleFilterCleared();
                break;
            case 'filter-modified':
                handleFilterModified(newFilters);
                break;
        }
        
        // Всегда обновляем UI через событие
        updateUI(newFilters);
    }
);

function detectFilterChange(newFilters) {
    if (newFilters.length === 0) return 'filter-cleared';
    if (newFilters.length === 1) return 'filter-applied';
    return 'filter-modified';
}
```

#### Группировка виджетов
```javascript
// Ведущий виджет управляет фильтрами
visApi().onSelectedValuesChangedListener(
    { guid: 'master-filter', widgetGuid: 'master-widget' },
    function(event) {
        // Распространяем фильтры на ведомые виджеты
        ['slave-widget-1', 'slave-widget-2'].forEach(slave => {
            visApi().setFilterSelectedValues(slave, event.selectedValues);
        });
    }
);
```

#### Дебаунсинг для производительности
```javascript
let filterUpdateTimeout;

visApi().onSelectedValuesChangedListener(
    { guid: 'debounced-listener', widgetGuid: w.general.renderTo },
    function(event) {
        clearTimeout(filterUpdateTimeout);
        filterUpdateTimeout = setTimeout(() => {
            performHeavyUpdate(event.selectedValues);
        }, 300);
    }
);
```

#### Обработка ошибок
```javascript
visApi().onSelectedValuesChangedListener(
    { guid: 'error-handled-listener', widgetGuid: w.general.renderTo },
    function(event) {
        try {
            if (!event.selectedValues) {
                throw new Error('Invalid filter data received');
            }
            
            processFilterUpdate(event.selectedValues);
            
        } catch (error) {
            console.error('Filter update error:', error);
            showErrorMessage('Ошибка обновления фильтра');
        }
    }
);
```

### `onWidgetLoadedListener()` - отслеживание загрузки

**Назначение**: Подписка на событие загрузки виджета

**Синтаксис**:
```javascript
visApi().onWidgetLoadedListener({ guid, widgetGuid }, handler)
```

**Примеры использования**:

```javascript
// Подписка на загрузку текущего виджета
visApi().onWidgetLoadedListener(
    { 
        guid: 'my-widget-loaded', 
        widgetGuid: w.general.renderTo 
    },
    function(event) {
        console.log('Виджет загружен:', event.widgetGuid);
        
        // Инициализация компонентов
        initializeChart();
        setupEventListeners();
        loadInitialData();
    }
);

// Подписка на загрузку зависимых виджетов
visApi().onWidgetLoadedListener(
    { guid: 'dependency-loaded', widgetGuid: 'dependent-widget' },
    function(event) {
        console.log('Зависимый виджет загружен');
        synchronizeWidgets();
    }
);

// Комплексная инициализация дашборда
const dashboardWidgets = ['widget-1', 'widget-2', 'widget-3'];
let loadedCount = 0;

dashboardWidgets.forEach(widgetId => {
    visApi().onWidgetLoadedListener(
        { guid: `loader-${widgetId}`, widgetGuid: widgetId },
        function(event) {
            loadedCount++;
            console.log(`Загружен ${loadedCount}/${dashboardWidgets.length}`);
            
            if (loadedCount === dashboardWidgets.length) {
                initializeDashboard();
            }
        }
    );
});
```

## Best Practices

### Правильный паттерн работы с фильтрами
```javascript
class FilterManager {
    constructor(widgetGuid) {
        this.widgetGuid = widgetGuid;
        this.currentFilter = '';
        
        this.init();
    }
    
    init() {
        // 1. GET - однократная инициализация
        this.updateFromGetSelectedValues();
        
        // 2. SET - настройка обработчиков пользователя
        this.setupUserHandlers();
        
        // 3. LISTEN - подписка на изменения
        this.setupListener();
        
        this.render();
    }
    
    updateFromGetSelectedValues() {
        const initialFilters = visApi().getSelectedValues(this.widgetGuid);
        this.currentFilter = this.formatFilter(initialFilters);
    }
    
    setupUserHandlers() {
        // Настройка кликов, выборов и т.д.
    }
    
    setupListener() {
        visApi().onSelectedValuesChangedListener(
            { guid: this.widgetGuid + '-manager', widgetGuid: this.widgetGuid },
            (event) => {
                this.currentFilter = this.formatFilter(event.selectedValues);
                this.render();
            }
        );
    }
    
    formatFilter(selectedValues) {
        return selectedValues && selectedValues.length > 0 
            ? selectedValues.map(e => e.join(' - '))[0] 
            : '';
    }
    
    render() {
        // Обновление UI
    }
}
```

## Паттерн: GET → SET → LISTEN
```javascript

// Правильный паттерн: GET → SET → LISTEN
const widgetGuid = w.general.renderTo;
let currentFilter = '';

// 1. GET - один раз при загрузке
function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    currentFilter = formatFilter(initialFilters);
    renderUI();
}

// 2. SET - при действии пользователя
function handleUserAction(newFilterValue) {
    const filterToSet = currentFilter === newFilterValue ? [] : [newFilterValue.split(' - ')];
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

// 3. LISTEN - для обновлений UI
visApi().onSelectedValuesChangedListener(
    {guid: widgetGuid + '-listener', widgetGuid: widgetGuid},
    (event) => {
        currentFilter = formatFilter(event.selectedValues);
        renderUI();
    }
);



```

### Ключевые принципы:
1. **GET → SET → LISTEN** - последовательность операций
2. **Единственный источник истины** - обновляем UI только через события
3. **Дебаунсинг** для частых обновлений
4. **Обработка ошибок** в колбэках
5. **Уникальные GUID** для подписок

Этот подход гарантирует стабильную работу фильтров и предотвращает гонки состояний в приложении.