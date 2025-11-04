// filter-display-widget.js

const FILTER_ID = '2d024b4ab5904f069197ab83a9eeb12c';
const WIDGET_ID = w.general.renderTo;

const css = `.filter-badge { display:inline-block; padding:8px 12px; margin:4px; background:#3498db; color:white; border-radius:12px; font-size:14px; }`;

function initFilterDisplay() {
    const container = document.getElementById(WIDGET_ID);

    const updateDisplay = (selectedData) => {
        const selectedValues = (selectedData.selectedValues || selectedData).map(x => x[0]);

        container.innerHTML = '';

        selectedValues.forEach(value => {
            const badge = document.createElement('span');
            badge.className = 'filter-badge';
            badge.textContent = value;
            container.appendChild(badge);
        });

        if (selectedValues.length === 0) {
            container.innerHTML = '<span style="color:#999; font-style:italic;">Ничего не выбрано</span>';
        }
    };

    // Инициализируем текущими значениями
    updateDisplay(visApi().getSelectedValues(FILTER_ID));

    // Подписываемся на изменения
    visApi().onSelectedValuesChangedListener({
        guid: WIDGET_ID + '_display',
        widgetGuid: FILTER_ID
    }, updateDisplay);
}

// Запускаем при загрузке виджета
initFilterDisplay();

// Добавляем стили
const styleId = WIDGET_ID + '_style';
let style = document.getElementById(styleId);
if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
}
style.textContent = css;