// Получаем ID фильтра из константы
const FILTER_ID = '393abcaa18d845619f3d0f09efef8da6';
// Получаем ID виджета, к которому привязан скрипт, из конфигурации виджета
const WIDGET_ID = w.general.renderTo; 

// Название CSS класса для кнопок фильтра
const buttonClassName = 'filter-button';

// Определяем CSS стили для кнопок
const css = `
.${buttonClassName} {
    width: 175px;
    padding: 15px 20px;
    margin: 10px;
    background-color: #403d39;
    color: #ffffff;
    border: none;
    text-align: center;
    display: inline-block;
    font-size: 16px;
    cursor: pointer;
    border-radius: 4px;
}

.${buttonClassName}:hover {
    background-color: #5a5550;
}

.${buttonClassName}.selected {
    background-color: #ccc5b9;
    color: #333;
} 
`;

// Подписываемся на событие загрузки виджета-фильтра
visApi().onWidgetLoadedListener( 
    { 
        // Создаем уникальный идентификатор слушателя
        guid: FILTER_ID + WIDGET_ID + "onWidgetLoadedListener",  
        // Указываем GUID виджета-фильтра, загрузку которого отслеживаем
        widgetGuid: FILTER_ID 
    },
    // Асинхронная функция-обработчик, вызывается после загрузки виджета-фильтра
    async () => {
        // Получаем данные из виджета-фильтра
        const result = await visApi().getWidgetDataByGuid(FILTER_ID);

        // Извлекаем элементы данных из ответа
        const items = result.data.primaryData.items;
        // Логируем полученные данные для отладки
        console.log(items)
        // Преобразуем массив items в массив заголовков для кнопок
        const buttonTitles = items.map(item => item.values[0]);
        
        // Создаем кнопки фильтра с полученными заголовками
        createFilterButtons(buttonTitles)
    }
)

// Функция создания кнопок фильтра
function createFilterButtons(buttonTitles) {
    // Находим контейнер виджета по ID
    const container = document.getElementById(WIDGET_ID);
    // Очищаем контейнер перед созданием новых кнопок
    container.innerHTML = '';
    
    // Создаем контейнер для кнопок
    const buttonsContainer = document.createElement('div');
    
    // Используем Set для хранения выбранных значений
    let selectedButtons = new Set();
    
    // Создаем кнопку для каждого заголовка
    buttonTitles.forEach(function(title) {
        const button = document.createElement('button');
        // Добавляем CSS класс
        button.classList.add(buttonClassName);
        // Устанавливаем текст кнопки
        button.innerHTML = title;
        // Сохраняем название в data-атрибуте для последующего использования
        button.dataset.buttonName = title;
        
        // Добавляем обработчик клика на кнопку
        button.addEventListener('click', function() {
            // Переключаем класс 'selected' и получаем текущее состояние
            const isSelected = button.classList.toggle('selected');
            
            // Обновляем Set выбранных кнопок в зависимости от состояния
            selectedButtons[isSelected ? 'add' : 'delete'](title);
            
            // Преобразуем Set выбранных значений в массив массивов
            const selectedArray = Array.from(selectedButtons).map(value => [value]);
            
            // Применяем выбранные значения к обоим виджетам
            visApi().setFilterSelectedValues(WIDGET_ID, selectedArray);
            visApi().setFilterSelectedValues(FILTER_ID, selectedArray);
        });
        
        // Добавляем кнопку в контейнер
        buttonsContainer.appendChild(button);
    });
    
    // Добавляем контейнер с кнопками в основной контейнер виджета
    container.appendChild(buttonsContainer);
    
    // Функция обновления состояния кнопок при изменении фильтра
    const updateButtonSelection = (selectedData) => {
        // Извлекаем выбранные значения
        const selectedValues = selectedData.selectedValues || selectedData;
        // Создаем Set из выбранных значений
        const selected = new Set(selectedValues.map(x => x[0]));
        
        // Обновляем глобальный Set выбранных кнопок
        selectedButtons = selected;
        
        // Обновляем визуальное состояние всех кнопок
        buttonsContainer.querySelectorAll(`.${buttonClassName}`).forEach(button => {
            const buttonName = button.dataset.buttonName;
            // Добавляем или удаляем класс 'selected' в зависимости от состояния
            button.classList[selected.has(buttonName) ? 'add' : 'remove']('selected');
        });
        
        // Если ничего не выбрано, сбрасываем фильтры
        if (selected.size === 0) {
            visApi().setFilterSelectedValues(FILTER_ID, []);
            visApi().setFilterSelectedValues(WIDGET_ID, []);
        }
    };
    
    // Инициализируем состояние кнопок текущими выбранными значениями фильтра
    updateButtonSelection(visApi().getSelectedValues(FILTER_ID))
    
    // Подписываемся на изменения выбранных значений в виджете-фильтре
    visApi().onSelectedValuesChangedListener({
        guid: WIDGET_ID + '_buttons_filter',
        widgetGuid: FILTER_ID
    }, updateButtonSelection);
    
    // Подписываемся на изменения выбранных значений в текущем виджете
    visApi().onSelectedValuesChangedListener({
        guid: WIDGET_ID + '_buttons_widget',
        widgetGuid: WIDGET_ID
    }, updateButtonSelection);
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
addStyle(WIDGET_ID, css);