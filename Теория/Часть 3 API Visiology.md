# API Visiology - полное руководство

## 3.1 Методы управления фильтрами

### `setFilterSelectedValues()` - полное руководство

**Назначение**: Установка значений фильтра для виджета

**Синтаксис**:
```javascript
visApi().setFilterSelectedValues(widgetGuid, values)
```

**Параметры**:
- `widgetGuid` (string) - идентификатор виджета
- `values` (Array) - массив значений фильтра

**Форматы значений**:

#### 1. Простые значения (один уровень)
```javascript
// Для измерения "region"
visApi().setFilterSelectedValues(w.general.renderTo, [["North"]]);
visApi().setFilterSelectedValues(w.general.renderTo, [["South"], ["West"]]); // множественный выбор
```

#### 2. Иерархические значения (несколько уровней)
```javascript
// Для иерархии "region → city → customer"
visApi().setFilterSelectedValues(w.general.renderTo, [
    ["North", "Chicago", "Sarah Johnson"]
]);

// Multiple hierarchical values
visApi().setFilterSelectedValues(w.general.renderTo, [
    ["North", "Chicago", "Sarah Johnson"],
    ["South", "Houston", "Emily Davis"]
]);
```

#### 3. Очистка фильтра
```javascript
// Полная очистка
visApi().setFilterSelectedValues(w.general.renderTo, []);

// Сброс конкретного значения
visApi().setFilterSelectedValues(w.general.renderTo, null);
```

**Практические примеры**:

```javascript
// Фильтрация по клику на элемент графика
function handleChartClick(event) {
    const selectedPath = event.data.path; // ["North", "Chicago"]
    
    // Установка фильтра
    visApi().setFilterSelectedValues(w.general.renderTo, [selectedPath]);
    
    // Toggle логика - снятие фильтра при повторном клике
    const currentFilter = visApi().getSelectedValues(w.general.renderTo);
    const isSameFilter = currentFilter.some(filter => 
        JSON.stringify(filter) === JSON.stringify(selectedPath)
    );
    
    if (isSameFilter) {
        visApi().setFilterSelectedValues(w.general.renderTo, []);
    } else {
        visApi().setFilterSelectedValues(w.general.renderTo, [selectedPath]);
    }
}

// Множественный выбор с проверкой лимитов
function addToMultiSelect(path) {
    const currentFilters = visApi().getSelectedValues(w.general.renderTo);
    const maxSelections = 5;
    
    if (currentFilters.length >= maxSelections) {
        console.warn(`Maximum ${maxSelections} selections allowed`);
        return;
    }
    
    // Проверяем, не добавлено ли уже значение
    const exists = currentFilters.some(filter =>
        JSON.stringify(filter) === JSON.stringify(path)
    );
    
    if (!exists) {
        const newFilters = [...currentFilters, path];
        visApi().setFilterSelectedValues(w.general.renderTo, newFilters);
    }
}
```

### `setDateFilterSelectedValues()` - работа с датами

**Назначение**: Специализированный метод для фильтрации по датам

**Синтаксис**:
```javascript
visApi().setDateFilterSelectedValues(widgetGuid, dateValues)
```

**Форматы дат**:

```javascript
// Одиночная дата
visApi().setDateFilterSelectedValues(w.general.renderTo, [
    { start: "2024-01-01", end: "2024-01-31" }
]);

// Период
visApi().setDateFilterSelectedValues(w.general.renderTo, [
    { start: "2024-01-01", end: "2024-03-31" }
]);

// Multiple date ranges
visApi().setDateFilterSelectedValues(w.general.renderTo, [
    { start: "2024-01-01", end: "2024-01-15" },
    { start: "2024-02-01", end: "2024-02-15" }
]);

// Relative dates (текущий месяц)
const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

visApi().setDateFilterSelectedValues(w.general.renderTo, [
    { 
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0]
    }
]);
```

### `getSelectedValues()` - получение текущих фильтров

**Назначение**: Получение текущих значений фильтров виджета

**Синтаксис**:
```javascript
const selectedValues = visApi().getSelectedValues(widgetGuid)
```

**Возвращаемое значение**: `Array` массив значений фильтра

**Примеры использования**:

```javascript
// Получение текущих фильтров
const currentFilters = visApi().getSelectedValues(w.general.renderTo);

// Анализ фильтров
function analyzeFilters() {
    const filters = visApi().getSelectedValues(w.general.renderTo);
    
    if (filters.length === 0) {
        return "Фильтры не установлены";
    }
    
    return {
        count: filters.length,
        values: filters.map(filter => filter.join(' → ')),
        hasHierarchy: filters.some(filter => filter.length > 1),
        isMultiSelect: filters.length > 1
    };
}

// Синхронизация нескольких виджетов
function syncWidgetFilters(sourceWidget, targetWidgets) {
    const sourceFilters = visApi().getSelectedValues(sourceWidget);
    
    targetWidgets.forEach(widgetGuid => {
        visApi().setFilterSelectedValues(widgetGuid, sourceFilters);
    });
}

// Проверка активного фильтра
function isFilterActive() {
    const filters = visApi().getSelectedValues(w.general.renderTo);
    return filters.length > 0 && filters[0].length > 0;
}

// Получение фильтра в формате для отображения
function getDisplayFilters() {
    return visApi().getSelectedValues(w.general.renderTo)
        .map(filter => filter.join(' - '))
        .join(', ');
}
```

## 3.3 Система событий

### `onSelectedValuesChangedListener()` - полное руководство

**Назначение**: Подписка на изменения значений фильтров

**Синтаксис**:
```javascript
visApi().onSelectedValuesChangedListener(config, callback)
```

**Параметры**:
- `config` (Object) - конфигурация подписки
- `callback` (Function) - функция-обработчик

**Конфигурация**:
```javascript
const config = {
    guid: widgetGuid,           // ID контейнера
    widgetGuid: widgetGuid,     // ID виджета
    // опционально:
    group: 'groupName',         // группа виджетов
    groupGroup: 'dashboard'     // тип группы
}
```

**Обработчик события**:
```javascript
function callback(event) {
    // event содержит:
    // - selectedValues: Array - новые значения фильтров
    // - oldSelectedValues: Array - предыдущие значения
    // - widgetGuid: string - ID виджета
    // - source: string - источник изменения
}
```

**Полное руководство по использованию**:

#### 1. Базовая подписка
```javascript
visApi().onSelectedValuesChangedListener(
    { guid: w.general.renderTo, widgetGuid: w.general.renderTo },
    function(event) {
        console.log('Фильтр изменен:', event.selectedValues);
        
        // Обновление визуализации
        updateChart(event.selectedValues);
    }
);
```

#### 2. Обработка различных сценариев
```javascript
visApi().onSelectedValuesChangedListener(
    { guid: w.general.renderTo, widgetGuid: w.general.renderTo },
    function(event) {
        const newFilters = event.selectedValues || [];
        const oldFilters = event.oldSelectedValues || [];
        
        // Определение типа изменения
        const changeType = analyzeFilterChange(newFilters, oldFilters);
        
        switch (changeType) {
            case 'cleared':
                handleFilterCleared();
                break;
            case 'added':
                handleFilterAdded(newFilters);
                break;
            case 'removed':
                handleFilterRemoved(oldFilters, newFilters);
                break;
            case 'replaced':
                handleFilterReplaced(newFilters);
                break;
        }
        
        // Обновление UI
        updateFilterDisplay(newFilters);
    }
);

function analyzeFilterChange(newFilters, oldFilters) {
    if (newFilters.length === 0 && oldFilters.length > 0) return 'cleared';
    if (newFilters.length > oldFilters.length) return 'added';
    if (newFilters.length < oldFilters.length) return 'removed';
    return 'replaced';
}
```

#### 3. Синхронизация нескольких виджетов
```javascript
// Ведущий виджет
visApi().onSelectedValuesChangedListener(
    { guid: masterWidget, widgetGuid: masterWidget },
    function(event) {
        // Передача фильтров ведомым виджетам
        slaveWidgets.forEach(slave => {
            visApi().setFilterSelectedValues(slave, event.selectedValues);
        });
    }
);
```

#### 4. Дебаунсинг для производительности
```javascript
let filterUpdateTimeout;

visApi().onSelectedValuesChangedListener(
    { guid: w.general.renderTo, widgetGuid: w.general.renderTo },
    function(event) {
        // Дебаунсинг частых обновлений
        clearTimeout(filterUpdateTimeout);
        filterUpdateTimeout = setTimeout(() => {
            performHeavyUpdate(event.selectedValues);
        }, 300);
    }
);
```

#### 5. Обработка ошибок
```javascript
visApi().onSelectedValuesChangedListener(
    { guid: w.general.renderTo, widgetGuid: w.general.renderTo },
    function(event) {
        try {
            if (!event.selectedValues) {
                throw new Error('Invalid filter data');
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
visApi().onWidgetLoadedListener(config, callback)
```

**Использование**:

```javascript
// Подписка на загрузку текущего виджета
visApi().onWidgetLoadedListener(
    { guid: w.general.renderTo, widgetGuid: w.general.renderTo },
    function(event) {
        console.log('Виджет загружен:', event.widgetGuid);
        
        // Инициализация после загрузки
        initializeChart();
        setupEventListeners();
        loadInitialData();
    }
);

// Подписка на загрузку других виджетов
visApi().onWidgetLoadedListener(
    { guid: otherWidgetGuid, widgetGuid: otherWidgetGuid },
    function(event) {
        console.log('Зависимый виджет загружен:', event.widgetGuid);
        
        // Синхронизация после загрузки всех виджетов
        syncWidgets();
    }
);
```

**Комплексный пример использования событий**:

```javascript
class WidgetManager {
    constructor(widgetGuid) {
        this.widgetGuid = widgetGuid;
        this.isLoaded = false;
        this.currentFilters = [];
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Подписка на загрузку
        visApi().onWidgetLoadedListener(
            { guid: this.widgetGuid, widgetGuid: this.widgetGuid },
            (event) => this.handleLoad(event)
        );
        
        // Подписка на изменения фильтров
        visApi().onSelectedValuesChangedListener(
            { guid: this.widgetGuid, widgetGuid: this.widgetGuid },
            (event) => this.handleFilterChange(event)
        );
    }
    
    handleLoad(event) {
        this.isLoaded = true;
        console.log(`Widget ${this.widgetGuid} loaded`);
        
        // Инициализация после загрузки
        this.initialize();
        this.loadInitialFilters();
    }
    
    handleFilterChange(event) {
        this.currentFilters = event.selectedValues || [];
        
        console.log('Filters changed:', {
            from: event.oldSelectedValues,
            to: this.currentFilters,
            source: event.source
        });
        
        // Обновление данных
        this.updateData();
        
        // Визуальное обновление
        this.updateVisualization();
    }
    
    initialize() {
        // Инициализация компонентов
    }
    
    loadInitialFilters() {
        this.currentFilters = visApi().getSelectedValues(this.widgetGuid);
    }
    
    updateData() {
        // Загрузка данных с учетом фильтров
    }
    
    updateVisualization() {
        // Обновление графиков и визуальных элементов
    }
}

// Использование
const widgetManager = new WidgetManager(w.general.renderTo);
```

**Best Practices**:

1. **Всегда очищайте подписки** при уничтожении виджета
2. **Используйте дебаунсинг** для частых событий
3. **Обрабатывайте ошибки** в колбэках
4. **Проверяйте данные** в событиях перед использованием
5. **Используйте конфигурацию групп** для сложных дашбордов