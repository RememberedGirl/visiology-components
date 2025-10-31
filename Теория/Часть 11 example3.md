# Как создать виджет в Visiology - для аналитика

## Что такое виджет?

**Виджет** — это элемент дашборда, который показывает данные в определённом формате (таблица, график, диаграмма и т.д.)
и может взаимодействовать с другими виджетами через **фильтры**.

---

## Основные компоненты данных

### 1. **Измерения (Keys)**
Это **категории или группы** ваших данных:
- Страна: Россия, США, Франция
- Регион: Москва, СПб, Казань
- Год: 2020, 2021, 2022

### 2. **Показатели/Меры (Values)**
Это **числовые значения**, которые вы хотите отобразить:
- Объем продаж: 1 500 000
- Количество клиентов: 443
- Доход: 2 300 000

### 3. **Пример данных из Visiology**

```
Страна    | Город   | Население | ВВП
----------|---------|-----------|--------
Россия    | Москва  | 12 500 000| 2 300 000
Россия    | СПб     | 5 400 000 | 950 000
США       | Нью-Йорк| 8 300 000 | 1 800 000
```

- **Измерения (Keys)**: Страна, Город
- **Показатели (Values)**: Население, ВВП

---

## Структура виджета

### Шаг 1: Получить данные (GET)
```javascript
const initialFilters = visApi().getSelectedValues(widgetGuid);
const items = w.data.primaryData.items;
```
*Что происходит*: Берём текущие фильтры и получаем данные

---

### Шаг 2: Преобразовать данные (TRANSFORM)
```javascript
function transformData(items) {
    // Преобразуем данные в нужный формат для графика/таблицы
    return items.map(item => ({
        name: item.formattedKeys.join(' - '),      // "Россия - Москва"
        value: item.values[0],                      // 12 500 000
        keys: item.keys,                            // ["Россия", "Москва"]
        filterString: item.formattedKeys.join(' - ')
    }));
}
```

---

### Шаг 3: Создать контейнер (RENDER)
```javascript
function createContainer() {
    w.general.text = `<div id="chart-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({ text: w.general, style: {} });
}
```
*Что происходит*: Создаём пустое место на дашборде для графика

---

### Шаг 4: Обработать клик пользователя (SET)
```javascript
function handleUserAction(clickedData) {
    const currentFilter = formatFilter(visApi().getSelectedValues(widgetGuid));
    
    // Если кликнули на уже выбранный элемент - снять фильтр
    const newFilter = currentFilter === clickedData.filterString ? [] : [clickedData.keys];
    
    visApi().setFilterSelectedValues(widgetGuid, newFilter);
}
```
*Что происходит*: Передаём выбранное значение в фильтр (другие виджеты это получат)

---

### Шаг 5: Обновить интерфейс (LISTEN)
```javascript
function setupFilterListener() {
    visApi().onSelectedValuesChangedListener(
        { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
        (event) => {
            const currentFilter = formatFilter(event.selectedValues);
            updateUI(currentFilter);  // Обновляем графику
        }
    );
}
```
*Что происходит*: Когда другой виджет изменит фильтр - этот виджет обновится

---

## Практический пример: Создать Treemap (Иерархическую диаграмму)

### Описание:
Аналитик хочет видеть **иерархию данных** (например: Страна → Регион → Город) в виде разноцветных прямоугольников. При клике на прямоугольник должен применяться фильтр к другим виджетам.

### Как это работает:

#### 1️⃣ **Инициализация**
```javascript
function init() {
    // ШАГ 1: GET - получаем текущие фильтры
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(initialFilters);

    // ШАГ 2: Получаем данные
    const items = w.data.primaryData.items;
    
    // ШАГ 3: Строим иерархию из данных
    const treeData = buildTreeData(items);

    // ШАГ 4: Рендерим график
    renderUI(currentFilter, treeData);
}
```

#### 2️⃣ **Построение иерархии**
```javascript
function buildTreeData(items) {
    // Создаём корневой элемент
    const root = { name: 'root', children: [] };
    const nodeMap = new Map();

    // Для каждой строки данных
    items.forEach(item => {
        let currentLevel = root.children;
        let currentPath = [];

        // Проходим по каждому измерению (уровень иерархии)
        for (let i = 0; i < item.keys.length; i++) {
            const key = item.formattedKeys[i];
            const rawKey = item.keys[i];
            currentPath.push(rawKey);

            // Если узла ещё нет - создаём
            let node = nodeMap.get(key);
            if (!node) {
                node = {
                    name: key,                                    // "Москва"
                    value: item.values[0] || 1,                 // Показатель
                    filterPath: [currentPath.slice()],          // Путь для фильтра
                    filterString: currentPath.join(' - '),      // "Россия - Москва"
                    itemStyle: {
                        color: w.colors[i % w.colors.length],   // Цвет по уровню
                        borderColor: '#333',
                        borderWidth: 2
                    },
                    children: []
                };
                nodeMap.set(key, node);
                currentLevel.push(node);
            } else {
                // Если узел уже есть - добавляем к его значению
                node.value += item.values[0] || 1;
            }

            currentLevel = node.children;  // Переходим на уровень ниже
        }
    });

    return root.children;
}
```

#### 3️⃣ **Рендеринг диаграммы**
```javascript
function renderUI(currentFilter, treeData) {
    // Создаём контейнер
    const html = `<div id="treemap-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({ text: { ...w.general, text: html }, style: {} });

    const container = document.getElementById(`treemap-${widgetGuid}`);
    if (!container) return;

    // Инициализируем ECharts
    chart = echarts.init(container);

    // Настройка диаграммы
    const option = {
        series: [{
            type: 'treemap',           // Тип: иерархическая диаграмма
            roam: false,               // Нет масштабирования
            label: {
                show: true,
                fontSize: 12,
                color: '#fff'          // Белый текст
            },
            upperLabel: {
                show: true,
                height: 30,
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 'bold'
            },
            itemStyle: {
                borderColor: '#333',
                borderWidth: 2,
                gapWidth: 2            // Промежуток между прямоугольниками
            },
            emphasis: {
                itemStyle: {
                    borderColor: '#ff0000',    // При выделении - красная рамка
                    borderWidth: 4,
                    shadowBlur: 10,
                    shadowColor: 'rgba(255, 0, 0, 0.5)'
                }
            },
            data: treeData
        }]
    };

    chart.setOption(option);

    // ШАГ 4: SET - обработчик клика
    chart.on('click', (params) => {
        if (params.data && params.data.filterPath) {
            handleNodeClick(params.data);
        }
    });

    // ШАГ 5: LISTEN - обновляем визуал
    updateUI(currentFilter);
}
```

#### 4️⃣ **Обработка клика (передача фильтра)**
```javascript
function handleNodeClick(node) {
    // Получаем текущий фильтр
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    
    // Toggle: если кликнули на уже выбранное - отменяем
    const filterToSet = currentFilter === node.filterString ? [] : node.filterPath;
    
    // Передаём фильтр в систему
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}
```

#### 5️⃣ **Обновление при изменении фильтра (синхронизация)**
```javascript
visApi().onSelectedValuesChangedListener(
    { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
    (event) => {
        const currentFilter = formatFilter(event.selectedValues);
        updateUI(currentFilter);  // Перерисовываем диаграмму
    }
);

function updateUI(currentFilter) {
    if (!chart || !currentTreeData.length) return;

    // Сбрасываем выделение
    chart.dispatchAction({ type: 'downplay', seriesIndex: 0 });

    if (currentFilter) {
        // Если есть фильтр - обновляем стили (подсвечиваем нужный элемент)
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
        // Если фильтр отменён - возвращаем обычные стили
        const resetData = resetTreeDataSelection(currentTreeData);
        chart.setOption({ series: [{ data: resetData }] }, false);
    }
}

// Подсвечиваем нужный элемент
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

// Убираем выделение
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

// Вспомогательная функция
function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0 ? selectedValues[0].join(' - ') : '';
}
```

#### 6️⃣ **Запуск**
```javascript
init();
```

---

## Общая логика работы

```
┌─────────────────────────────────────┐
│   1. Пользователь кликает на график │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   2. handleUserAction() срабатывает │
│      (SET фильтр)                   │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   3. visApi().setFilterSelectedValues│
│      передаёт фильтр системе        │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   4. Все виджеты получают событие   │
│      (через onSelectedValuesChanged) │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   5. updateUI() обновляет график    │
│      (перекрашивает элементы)       │
└─────────────────────────────────────┘
```

---

## Чек-лист разработки для аналитика

1. **Определи тип данных**
    - Какие у тебя **измерения** (keys)?
    - Какие **показатели** (values) нужно показать?

2. **Выбери тип визуализации**
    - Таблица? Диаграмма? Граф?

3. **Подготовь данные**
    - Убедись, что данные в правильном формате в Visiology

4. **Скопируй шаблон**
    - Возьми готовый пример (Treemap, Graph, DataGrid и т.д.)

5. **Адаптируй под себя**
    - Измени названия полей
    - Настрой цвета и стили
    - Добавь свою логику обработки данных

6. **Тестируй**
    - Клик должен выбирать элемент
    - Повторный клик должен отменять выбор (toggle)
    - Другие виджеты должны обновляться при изменении фильтра