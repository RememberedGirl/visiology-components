### Инструкция по добавлению любой визуализации в Visiology

Visiology — это платформа бизнес-аналитики (BI), где виджеты (дашборды, графики, таблицы и т.д.) создаются с помощью JavaScript. Виджеты могут интегрировать внешние библиотеки визуализации, такие как ECharts, Highcharts, DevExpress DataGrid или даже простые HTML-элементы (например, чекбоксы). На основе предоставленных примеров (чекбоксы, treemap на ECharts, граф на ECharts, график на Highcharts и таблица на DevExpress) я опишу универсальную инструкцию по добавлению любой визуализации.

Инструкция следует шаблону **GET-SET-LISTEN**:
- **GET**: Получение данных и инициализация при загрузке.
- **SET**: Обработка действий пользователя (например, клик) для установки фильтров.
- **LISTEN**: Слушание изменений фильтров для обновления UI.

Это обеспечивает интеграцию с системой фильтров Visiology через `visApi()`. Все коды должны быть в формате JavaScript и выполняться в контексте виджета (доступны глобальные объекты `w` для данных и `visApi()` для API).

#### Предварительные требования
- **Данные в виджете**: Настройте виджет в Visiology, чтобы он получал данные через `w.data.primaryData.items`. Это массив объектов с ключами (`keys`, `formattedKeys`), значениями (`values`) и колонками (`cols`).
- **Библиотеки**:
    - Для ECharts/Highcharts: Загружайте их динамически через `<script>` или используйте встроенные (если доступны).
    - Для DevExpress: Убедитесь, что библиотека подключена (обычно через CDN или встроено в Visiology).
    - Нет интернета? Используйте локальные пути или встроенные библиотеки.
- **GUID виджета**: Используйте `w.general.renderTo` как уникальный ID контейнера.
- **Фильтры**: Фильтры — это массивы путей (например, `[[ 'Category1', 'Subcategory' ]]`). Форматируйте их как строки для сравнения (например, `'Category1 - Subcategory'`).

#### Шаги по добавлению визуализации

1. **Подготовьте структуру кода**
    - Объявите переменные: `const widgetGuid = w.general.renderTo;` (ID виджета).
    - Создайте глобальные переменные для чарта/визуализации (например, `let chart = null;`), данных (например, `let currentTreeData = [];`) и текущего фильтра (например, `let currentFilter = '';`).
    - Определите вспомогательные функции:
        - `formatFilter(selectedValues)`: Преобразует фильтры в строку (например, `selectedValues[0].join(' - ')`).
        - Функции для построения данных (например, `buildTreeData(items)` для treemap или графов).
        - Функции для обновления стилей (например, `updateTreeDataWithSelection` для выделения).

2. **Инициализация (GET: Загрузка и рендеринг)**
    - Вызовите функцию `init()` в конце скрипта.
    - В `init()`:
        - Получите текущие фильтры: `const initialFilters = visApi().getSelectedValues(widgetGuid); currentFilter = formatFilter(initialFilters);`.
        - Обработайте данные: `const items = w.data.primaryData.items;`. Преобразуйте в нужный формат (например, дерево для treemap, узлы/связи для графа, серии для Highcharts, массив объектов для таблицы).
        - Создайте HTML-контейнер: `const html = '<div id="your-chart-id" style="width:100%; height:100%;"></div>';`.
        - Отобразите контейнер: `TextRender({ text: { ...w.general, text: html }, style: {} });`.
        - Инициализируйте визуализацию:
            - ECharts: `chart = echarts.init(document.getElementById('your-chart-id')); chart.setOption({ ...options });`.
            - Highcharts: `const chart = Highcharts.chart('your-chart-id', { ...options });`.
            - DevExpress DataGrid: `$('#your-chart-id').dxDataGrid({ dataSource: data, ...options }).dxDataGrid('instance');`.
            - Простой HTML (чекбоксы): `container.innerHTML = ...map(item => '<label><input type="checkbox" ...></label>');`.
        - Добавьте обработчики событий (например, `chart.on('click', handleNodeClick);` или `onRowClick` для таблицы).
        - Примените начальный фильтр: Вызовите `updateUI(currentFilter);` для выделения.

3. **Обработка взаимодействий (SET: Установка фильтров)**
    - Создайте функцию-обработчик (например, `handleNodeClick(node)` или `handleCheckboxChange(renderTo)`).
    - В обработчике:
        - Получите текущий фильтр: `const currentFilters = visApi().getSelectedValues(widgetGuid); currentFilter = formatFilter(currentFilters);`.
        - Определите новый фильтр: Если элемент уже выбран — сбросьте (`[]`), иначе установите путь (например, `node.filterPath` или `[cb.value]`).
        - Установите фильтр: `visApi().setFilterSelectedValues(widgetGuid, filterToSet);`.
    - Привяжите к событиям:
        - Клик на узле/точке: Toggle фильтра.
        - Изменение чекбокса: Соберите выбранные значения и установите.
        - Для таблиц: `onRowClick` с toggle-логикой.

4. **Слушание изменений (LISTEN: Обновление UI)**
    - Зарегистрируйте слушатель:
      ```
      visApi().onSelectedValuesChangedListener(
          { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
          (event) => {
              currentFilter = formatFilter(event.selectedValues);
              updateUI(currentFilter);
          }
      );
      ```
    - В `updateUI(currentFilter)`:
        - Снимите все выделения (например, `chart.dispatchAction({ type: 'downplay' });` для ECharts, `grid.clearSelection();` для DataGrid, обновите маркеры в Highcharts).
        - Примените выделение: Найдите соответствующий элемент по `currentFilter` и выделите (например, обновите `itemStyle` в ECharts, `selectRows` в DataGrid, `point.update` в Highcharts).
        - Перерисуйте: `chart.setOption({...}, false);` или `chart.redraw();`.

5. **Дополнительные настройки и обработка ошибок**
    - **Стили и цвета**: Используйте функции вроде `getColorByLevel(level)` для динамических цветов. Добавьте `emphasis` для hover/фокуса.
    - **Загрузка библиотек**: Для Highcharts/ECharts добавьте динамическую загрузку:
      ```
      const script = document.createElement('script');
      script.src = 'https://code.highcharts.com/highcharts.js';
      document.head.appendChild(script);
      ```
        - Ждите загрузки: Используйте `script.onload = () => { initChart(); };`.
    - **Иерархические данные**: Для treemap/графов стройте дерево/граф с `filterPath` и `filterString` для каждого узла.
    - **Производительность**: Для больших данных оптимизируйте (например, `false` в `setOption` для ECharts, чтобы не перезагружать всё).
    - **Ошибки**: Проверяйте наличие контейнера (`if (!container) return;`). Логгируйте с `console.log`.
    - **Синхронизация**: Убедитесь, что UI обновляется только при реальных изменениях (сравнивайте `currentFilter`).

#### Пример применения для новой визуализации (например, Pie Chart на ECharts)
- В `init()`: Постройте данные как `{ name: key, value: sum }`.
- Рендеринг: `chart.setOption({ series: [{ type: 'pie', data: pieData }] });`.
- Обработчик: Клик на секторе — установка фильтра по пути.
- Обновление: Выделите сектор через `dispatchAction({ type: 'highlight' });`.

#### Тестирование и отладка
- В Visiology: Создайте виджет типа "Custom JavaScript", вставьте код.
- Тестируйте: Примените фильтры из других виджетов, кликните — UI должен обновляться.
- Документация Visiology: Проверьте API `visApi()` на официальном сайте для обновлений.

Эта инструкция универсальна и может быть адаптирована для любой библиотеки (D3.js, Chart.js и т.д.), сохраняя интеграцию с фильтрами Visiology. Если нужны уточнения для конкретной визуализации, предоставьте детали!