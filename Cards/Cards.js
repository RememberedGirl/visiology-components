const containerId = w.general.renderTo;
let currentFilter = '';

// Инициализация - используем getSelectedValues только один раз при загрузке
function initializeWidget() {
    const container = document.getElementById(containerId) ||
        document.querySelector(`[id*="${containerId}"]`);

    if (!container) {
        setTimeout(initializeWidget, 100);
        return;
    }

    // ПОЛУЧАЕМ ФИЛЬТР ТОЛЬКО ОДИН РАЗ ПРИ ЗАГРУЗКЕ
    const initialFilters = visApi().getSelectedValues(containerId);
    currentFilter = initialFilters && initialFilters.length > 0
        ? initialFilters.map(e => e.join(' - '))[0]
        : '';

    // Создаем рабочий контейнер
    const customBodyId = 'custom-body-' + containerId;
    let body = document.getElementById(customBodyId);

    if (!body) {
        body = container.querySelector('.va-widget-body') || container;
        body.id = customBodyId;
    }

    renderContent(body);
}

function renderContent(body) {
    // Создаем карточки с актуальным currentFilter
    body.innerHTML = w.data.primaryData.items.map((item, index) => {
        const isSelected = currentFilter === item.formattedKeys.join(' - ');

        return `
        <div class="card ${isSelected ? 'selected' : ''}" 
             onclick="handleCardClick('${containerId}', ${index})">
            <div class="card-header">
            ${item.formattedKeys.join(' / ')}
            </div>
            <div class="card-values">
            ${item.formattedValues.map((val, i) => `
                <div class="value-item">
                <span class="value-label">${item.cols[item.keys.length + i]}:</span>
                <span class="value">${val}</span>
                </div>
            `).join('')}
            </div>
        </div>
        `;
    }).join('');

    // Добавляем стили один раз
    if (!document.getElementById('widget-styles-' + containerId)) {
        const style = document.createElement('style');
        style.id = 'widget-styles-' + containerId;
        style.textContent = `
        #custom-body-${containerId} {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            padding: 15px;
        }
        .card {
            padding: 15px;
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .card:hover {
            border-color: #4ECDC4;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .card.selected {
            border-color: #4ECDC4;
            background: #f0f9f8;
            box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
        }
        .card-header {
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .value-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 13px;
        }
        .value-label {
            color: #666;
        }
        .value {
            font-weight: 600;
            color: #333;
        }
        `;
        document.head.appendChild(style);
    }
}

// Обработчик клика по карточке
window.handleCardClick = (renderTo, index) => {
    const item = w.data.primaryData.items[index];
    const itemFilterString = item.formattedKeys.join(' - ');

    // Toggle логика: используем currentFilter из памяти
    const newFilter = currentFilter === itemFilterString ? [] : [item.keys];
    visApi().setFilterSelectedValues(renderTo, newFilter);
};

// ПОДПИСКА НА ИЗМЕНЕНИЯ ФИЛЬТРОВ - для всех последующих обновлений
visApi().onSelectedValuesChangedListener(
    {
        guid: containerId + '-filter-listener',
        widgetGuid: containerId
    },
    function(event) {
        // Обновляем currentFilter из события
        currentFilter = event.selectedValues && event.selectedValues.length > 0
            ? event.selectedValues.map(e => e.join(' - '))[0]
            : '';

        // Перерисовываем карточки
        const body = document.getElementById('custom-body-' + containerId);
        if (body) {
            renderContent(body);
        }
    }
);

// Запускаем инициализацию
initializeWidget();