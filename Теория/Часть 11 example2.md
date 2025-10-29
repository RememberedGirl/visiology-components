Создай пользовательскую визуализацию для платформы Visiology, используя следующий шаблон как основу. Визуализация должна поддерживать фильтрацию и взаимодействие с другими виджетами дашборда.

## ТРЕБОВАНИЯ К ВИЗУАЛИЗАЦИИ:


### 2. ФУНКЦИОНАЛ:
- **GET**: При инициализации получай текущие фильтры через `visApi().getSelectedValues(widgetGuid)`
- **SET**: При клике пользователя устанавливай фильтры через `visApi().setFilterSelectedValues(widgetGuid, filterPath)`
- **LISTEN**: Настрой слушатель изменений фильтров через `visApi().onSelectedValuesChangedListener()`
- **Toggle логика**: Если кликаешь на уже выбранный элемент - снимай фильтр

### 3. ДАННЫЕ VISIOLOGY:
Используй следующую структуру данных:
```javascript
w.data.primaryData.items = [
    {
        keys: ["raw_key1", "raw_key2"],        // Исходные ключи
        formattedKeys: ["Label1", "Label2"],   // Форматированные ключи  
        values: [12345],                       // Значения показателей
        cols: ["Column1", "Column2", "Value"]  // Названия колонок
    }
]
```


## ШАБЛОН КОДА ДЛЯ РАЗРАБОТКИ:
```javascript
// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;

// === ОСНОВНЫЕ ПЕРЕМЕННЫЕ ===
let chart = null; // Для хранения экземпляра
let currentData = []; // Для хранения преобразованных данных

// === ФУНКЦИИ ===

// 1. Главная функция инициализации
function init() {
    // Получаем данные из Visiology
    const items = w.data.primaryData.items;

    // Преобразуем данные в нужный формат
    currentData = transformData(items);

    // Получаем текущие фильтры
    const currentFilter = getCurrentFilter();

    // Создаем HTML-контейнер
    createContainer();

    // Инициализируем визуализацию
    initVisualization(currentData, currentFilter);

    // Настраиваем слушатели фильтров
    setupFilterListeners();
}

// 2. Преобразование данных Visiology
function transformData(items) {
    return items.map(item => ({
        // Обязательные поля для фильтрации
        name: item.formattedKeys.join(' - '),
        value: item.values[0] || 0,
        filterPath: [item.keys], // Путь для установки фильтра
        filterString: item.formattedKeys.join(' - '), // Строка для сравнения

        // Дополнительные поля (опционально)
        id: item.formattedKeys.join('|'),
        rawValue: item.values[0] || 0,
        category: item.formattedKeys[0],
        subCategory: item.formattedKeys[1] || ''
    }));
}

// 3. Создание контейнера
function createContainer() {
    w.general.text = `<div id="myChart-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({
        text: w.general,
        style: {}
    });
}

// 4. Получение текущих фильтров
function getCurrentFilter() {
    const filters = visApi().getSelectedValues(widgetGuid);
    return filters && filters.length > 0 ? filters[0].join(' - ') : '';
}

// 5. Инициализация визуализации
function initVisualization(data, currentFilter) {
    const container = document.getElementById(`myChart-${widgetGuid}`);
    if (!container) {
        console.error('Container not found');
        return;
    }

    // Здесь создается ваша визуализация
    renderCustomViz(container, data, currentFilter);
}

// 6. Обработка пользовательских действий
function handleUserAction(clickedData) {
    const currentFilter = getCurrentFilter();

    // Toggle логика: если кликаем на уже выбранный элемент - снимаем фильтр
    const newFilter = currentFilter === clickedData.filterString
        ? []
        : clickedData.filterPath;

    visApi().setFilterSelectedValues(widgetGuid, newFilter);
}

// 7. Настройка слушателей фильтров
function setupFilterListeners() {
    visApi().onSelectedValuesChangedListener(
        {
            guid: widgetGuid + '-listener',
            widgetGuid: widgetGuid
        },
        (event) => {
            const currentFilter = event.selectedValues && event.selectedValues.length > 0
                ? event.selectedValues[0].join(' - ')
                : '';
            updateVisualization(currentFilter);
        }
    );
}

// 8. Обновление визуализации при изменении фильтров
function updateVisualization(currentFilter) {
    // Обновляем визуализацию в соответствии с новым фильтром
    updateCustomViz(currentFilter);
}

// === ЗАПУСК ===
init();
```

## 3. Примеры реализации для разных типов визуализаций

### A. Столбчатая диаграмма (ECharts)
```javascript
function renderCustomViz(container, data, currentFilter) {
    // Загрузка ECharts (если не загружена)
    if (typeof echarts === 'undefined') {
        console.error('ECharts not loaded');
        return;
    }

    chart = echarts.init(container);

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        xAxis: {
            type: 'category',
            data: data.map(item => item.name)
        },
        yAxis: { type: 'value' },
        series: [{
            data: data.map(item => ({
                name: item.name,
                value: item.value,
                itemStyle: {
                    color: item.filterString === currentFilter ? '#ff4d4f' : '#5470c6'
                }
            })),
            type: 'bar'
        }]
    };

    chart.setOption(option);

    // Обработчик кликов
    chart.on('click', function(params) {
        const clickedData = data.find(item => item.name === params.name);
        if (clickedData) {
            handleUserAction(clickedData);
        }
    });
}

function updateCustomViz(currentFilter) {
    if (!chart) return;

    const option = chart.getOption();
    option.series[0].data = option.series[0].data.map(item => ({
        ...item,
        itemStyle: {
            color: item.name === currentFilter ? '#ff4d4f' : '#5470c6'
        }
    }));

    chart.setOption(option);
}
```

### B. Круговая диаграмма (Chart.js)
```javascript
function renderCustomViz(container, data, currentFilter) {
    // Очищаем контейнер
    container.innerHTML = '';

    // Создаем canvas элемент с фиксированными размерами
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    chart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: data.map(item => item.name),
            datasets: [{
                data: data.map(item => item.value),
                backgroundColor: data.map(item =>
                    item.filterString === currentFilter ? '#ff4d4f' : '#5470c6'
                ),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    handleUserAction(data[index]);
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

function updateCustomViz(currentFilter) {
    if (!chart) return;

    chart.data.datasets[0].backgroundColor = chart.data.labels.map((label, index) => {
        const item = currentData.find(d => d.name === label);
        return item && item.filterString === currentFilter ? '#ff4d4f' : '#5470c6';
    });

    chart.update();
}
```

### C. HTML/CSS визуализация (без библиотек)
```javascript
function renderCustomViz(container, data, currentFilter) {
    container.innerHTML = data.map(item => `
        <div class="viz-item" 
             data-filter="${encodeURIComponent(JSON.stringify(item.filterPath))}"
             style="background: ${item.filterString === currentFilter ? '#ff4d4f' : '#5470c6'};
                    padding: 10px; 
                    margin: 5px; 
                    color: white;
                    cursor: pointer;
                    border-radius: 4px;">
            ${item.name}: ${item.value}
        </div>
    `).join('');
    
    // Назначаем обработчики событий
    container.querySelectorAll('.viz-item').forEach(element => {
        element.addEventListener('click', function() {
            const filterPath = JSON.parse(decodeURIComponent(this.dataset.filter));
            handleUserAction({ filterPath, filterString: this.textContent.split(':')[0].trim() });
        });
    });
}

function updateCustomViz(currentFilter) {
    const container = document.getElementById(`widget-${widgetGuid}`);
    const items = container.querySelectorAll('.viz-item');
    
    items.forEach(element => {
        const itemText = element.textContent.split(':')[0].trim();
        element.style.background = itemText === currentFilter ? '#ff4d4f' : '#5470c6';
    });
}
```

## ЗАДАЧА:
На основе этого шаблона создай полнофункциональную визуализацию echarts bar3d, которая:
- Измените `transformData()` под вашу визуализацию
- Заполните `renderCustomViz()` для вашей библиотеки
- Реализуйте `handleUserAction()` для обработки кликов
- Настройте `updateCustomViz()` для обновления при фильтрации

Предоставь полный готовый код визуализации, готовый к использованию в Visiology. Кроме кола ничего не пиши.
