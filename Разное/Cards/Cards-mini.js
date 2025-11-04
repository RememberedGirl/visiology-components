const widgetGuid = w.general.renderTo;
let currentFilter = '';

// 1. Инициализация
function init() {
    const container = document.getElementById(widgetGuid);
    if (!container) {
        init
        return;
    }

    // GET - начальное состояние
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    currentFilter = initialFilters?.[0]?.join(' - ') || '';

    render();
}

// 2. Обработчик клика
window.handleCardClick = (index) => {
    const item = w.data.primaryData.items[index];
    const itemFilter = item.formattedKeys.join(' - ');

    // SET - устанавливаем фильтр
    const newFilter = currentFilter === itemFilter ? [] : [item.keys];
    visApi().setFilterSelectedValues(widgetGuid, newFilter);
};

// 3. Слушатель изменений
visApi().onSelectedValuesChangedListener(
    { guid: widgetGuid + '-listener', widgetGuid: widgetGuid },
    (event) => {
        // LISTEN - обновляем состояние
        currentFilter = event.selectedValues?.[0]?.join(' - ') || '';
        render();
    }
);

function render() {
    const container = document.getElementById(widgetGuid);
    if (!container) return;

    container.innerHTML = w.data.primaryData.items.map((item, index) => {
        const isSelected = currentFilter === item.formattedKeys.join(' - ');
        return `
            <div class="card ${isSelected ? 'selected' : ''}" 
                 onclick="handleCardClick(${index})">
                ${item.formattedKeys.join(' / ')} - ${item.formattedValues.join(', ')}
            </div>
        `;
    }).join('');
}

// Запуск
init();