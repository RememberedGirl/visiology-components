// custom-filter-interaction-widget.js

/**
 * Виджет для кастомного взаимодействия с фильтрами Visiology
 * Паттерны: подписка на события, обработка значений фильтра, синхронизация состояния
 */

// Получаем ID фильтра из константы
const FILTER_ID = '2d024b4ab5904f069197ab83a9eeb12c';
// Получаем ID виджета, к которому привязан скрипт, из конфигурации виджета
const WIDGET_ID = w.general.renderTo;

// Название CSS класса для элементов управления
const controlClassName = 'filter-control';

// Определяем CSS стили для элементов управления
const css = `
.${controlClassName} {
    width: 200px;
    padding: 12px 16px;
    margin: 8px;
    background-color: #2c3e50;
    color: #ecf0f1;
    border: none;
    text-align: center;
    display: inline-block;
    font-size: 14px;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.${controlClassName}:hover {
    background-color: #34495e;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.${controlClassName}.selected {
    background-color: #e74c3c;
    color: white;
    font-weight: bold;
}

.${controlClassName}.disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
    opacity: 0.6;
}

.controls-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    padding: 20px;
    gap: 10px;
}

.control-group {
    margin: 15px 0;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f8f9fa;
}

.group-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
    color: #2c3e50;
}
`;

// Подписываемся на событие загрузки виджета-фильтра
visApi().onWidgetLoadedListener(
    {
        // Создаем уникальный идентификатор слушателя
        guid: FILTER_ID + WIDGET_ID + "filterInteractionListener",
        // Указываем GUID виджета-фильтра, загрузку которого отслеживаем
        widgetGuid: FILTER_ID
    },
    // Асинхронная функция-обработчик, вызывается после загрузки виджета-фильтра
    async () => {
        try {
            // Получаем данные из виджета-фильтра
            const result = await visApi().getWidgetDataByGuid(FILTER_ID);

            // Извлекаем элементы данных из ответа
            const items = result.data.primaryData.items;
            // Логируем полученные данные для отладки
            console.log('Данные фильтра:', items);

            // Преобразуем массив items в массив значений для элементов управления
            const filterValues = items.map(item => item.values[0]);

            // Создаем интерфейс управления фильтром
            createFilterControls(filterValues);

        } catch (error) {
            console.error('Ошибка при загрузке данных фильтра:', error);
        }
    }
);

// Функция создания элементов управления фильтром
function createFilterControls(filterValues) {
    // Находим контейнер виджета по ID
    const container = document.getElementById(WIDGET_ID);
    // Очищаем контейнер перед созданием новых элементов
    container.innerHTML = '';

    // Создаем основной контейнер для элементов управления
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';

    // Создаем группу для отдельных значений
    const valuesGroup = document.createElement('div');
    valuesGroup.className = 'control-group';

    const valuesTitle = document.createElement('div');
    valuesTitle.className = 'group-title';
    valuesTitle.textContent = 'Выбор значений:';
    valuesGroup.appendChild(valuesTitle);

    // Создаем группу для действий
    const actionsGroup = document.createElement('div');
    actionsGroup.className = 'control-group';

    const actionsTitle = document.createElement('div');
    actionsTitle.className = 'group-title';
    actionsTitle.textContent = 'Действия:';
    actionsGroup.appendChild(actionsTitle);

    // Используем Set для хранения выбранных значений
    let selectedValues = new Set();

    // Создаем элемент управления для каждого значения фильтра
    filterValues.forEach(function(value) {
        const control = document.createElement('button');
        // Добавляем CSS класс
        control.classList.add(controlClassName);
        // Устанавливаем текст элемента
        control.textContent = value;
        // Сохраняем значение в data-атрибуте для последующего использования
        control.dataset.controlValue = value;

        // Добавляем обработчик клика на элемент
        control.addEventListener('click', function() {
            handleControlClick(value, control);
        });

        // Добавляем элемент в группу значений
        valuesGroup.appendChild(control);
    });

    // Создаем кнопку "Выбрать все"
    const selectAllButton = document.createElement('button');
    selectAllButton.className = controlClassName;
    selectAllButton.textContent = 'Выбрать все';
    selectAllButton.addEventListener('click', function() {
        selectAllValues(filterValues);
    });
    actionsGroup.appendChild(selectAllButton);

    // Создаем кнопку "Сбросить все"
    const clearAllButton = document.createElement('button');
    clearAllButton.className = controlClassName;
    clearAllButton.textContent = 'Сбросить все';
    clearAllButton.addEventListener('click', function() {
        clearAllValues();
    });
    actionsGroup.appendChild(clearAllButton);

    // Создаем кнопку "Инвертировать выбор"
    const invertButton = document.createElement('button');
    invertButton.className = controlClassName;
    invertButton.textContent = 'Инвертировать выбор';
    invertButton.addEventListener('click', function() {
        invertSelection(filterValues);
    });
    actionsGroup.appendChild(invertButton);

    // Добавляем группы в основной контейнер
    controlsContainer.appendChild(valuesGroup);
    controlsContainer.appendChild(actionsGroup);

    // Добавляем контейнер с элементами управления в основной контейнер виджета
    container.appendChild(controlsContainer);

    /**
     * Обработчик клика по элементу управления
     * @param {string} value - значение фильтра
     * @param {Element} control - HTML элемент управления
     */
    function handleControlClick(value, control) {
        // Переключаем класс 'selected' и получаем текущее состояние
        const isSelected = control.classList.toggle('selected');

        // Обновляем Set выбранных значений в зависимости от состояния
        if (isSelected) {
            selectedValues.add(value);
        } else {
            selectedValues.delete(value);
        }

        // Применяем выбранные значения к фильтрам
        applySelectedValues();

        console.log('Выбранные значения:', Array.from(selectedValues));
    }

    /**
     * Применяет выбранные значения к виджетам
     */
    function applySelectedValues() {
        // Преобразуем Set выбранных значений в массив массивов
        const selectedArray = Array.from(selectedValues).map(value => [value]);

        // Применяем выбранные значения к обоим виджетам
        visApi().setFilterSelectedValues(WIDGET_ID, selectedArray);
        visApi().setFilterSelectedValues(FILTER_ID, selectedArray);
    }

    /**
     * Выбирает все значения
     * @param {Array} allValues - все доступные значения
     */
    function selectAllValues(allValues) {
        selectedValues = new Set(allValues);
        updateControlsVisualState();
        applySelectedValues();
    }

    /**
     * Сбрасывает все значения
     */
    function clearAllValues() {
        selectedValues.clear();
        updateControlsVisualState();
        applySelectedValues();
    }

    /**
     * Инвертирует текущий выбор
     * @param {Array} allValues - все доступные значения
     */
    function invertSelection(allValues) {
        const newSelection = new Set();
        allValues.forEach(value => {
            if (!selectedValues.has(value)) {
                newSelection.add(value);
            }
        });
        selectedValues = newSelection;
        updateControlsVisualState();
        applySelectedValues();
    }

    /**
     * Обновляет визуальное состояние всех элементов управления
     */
    function updateControlsVisualState() {
        valuesGroup.querySelectorAll(`.${controlClassName}`).forEach(control => {
            const controlValue = control.dataset.controlValue;
            control.classList[selectedValues.has(controlValue) ? 'add' : 'remove']('selected');
        });
    }

    /**
     * Функция обновления состояния элементов управления при изменении фильтра
     * @param {Object} selectedData - данные о выбранных значениях
     */
    const updateControlsSelection = (selectedData) => {
        // Извлекаем выбранные значения
        const externalSelectedValues = selectedData.selectedValues || selectedData;
        // Создаем Set из выбранных значений
        const selected = new Set(externalSelectedValues.map(x => x[0]));

        // Обновляем глобальный Set выбранных значений
        selectedValues = selected;

        // Обновляем визуальное состояние всех элементов управления
        updateControlsVisualState();

        console.log('Внешнее изменение фильтра:', Array.from(selectedValues));
    };

    // Инициализируем состояние элементов управления текущими выбранными значениями фильтра
    updateControlsSelection(visApi().getSelectedValues(FILTER_ID));

    // Подписываемся на изменения выбранных значений в виджете-фильтре
    visApi().onSelectedValuesChangedListener({
        guid: WIDGET_ID + '_filter_interaction',
        widgetGuid: FILTER_ID
    }, updateControlsSelection);

    // Подписываемся на изменения выбранных значений в текущем виджете
    visApi().onSelectedValuesChangedListener({
        guid: WIDGET_ID + '_widget_interaction',
        widgetGuid: WIDGET_ID
    }, updateControlsSelection);

    // Подписываемся на событие загрузки всех виджетов для дополнительной инициализации
    visApi().onAllWidgetsLoadedListener({
        guid: WIDGET_ID + '_all_loaded'
    }, () => {
        console.log('Все виджеты загружены, виджет взаимодействия с фильтром готов к работе');
    });
}

// Функция для добавления или обновления CSS стилей на странице
function addStyle(styleId, css) {
    // Создаем уникальный ID для тега style
    styleId += "_style";
    let style = document.getElementById(styleId);

    // Если тег style еще не существует, создаем его
    if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
    }

    // Устанавливаем содержимое тега style
    style.textContent = css;
}

// Добавляем CSS стили на страницу
addStyle(WIDGET_ID + '_filter_interaction', css);

console.log('Виджет взаимодействия с фильтром инициализирован');