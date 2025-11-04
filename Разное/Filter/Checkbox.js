const container = document.getElementById(w.general.renderTo);
const items = w.data.primaryData.items;
const currentFilter = visApi().getSelectedValues(w.general.renderTo).map(x => x[0]);

// Создаем чекбоксы
container.innerHTML = items.map(item => `
  <label style="display: block; margin: 10px 0;">
    <input type="checkbox" 
           value="${item.formattedKeys[0]}"
           ${currentFilter.includes(item.formattedKeys[0]) ? 'checked' : ''}
           onchange="handleCheckboxChange('${w.general.renderTo}')">
    ${item.formattedKeys[0]}
  </label>
`).join('');

// Обработчик изменений
window.handleCheckboxChange = (renderTo) => {
    const values = [...document.querySelectorAll(`#${renderTo} input:checked`)].map(cb => [cb.value]);
    visApi().setFilterSelectedValues(renderTo, values);
};

// Синхронизация
visApi().onSelectedValuesChangedListener(
    { guid: w.general.renderTo, widgetGuid: w.general.renderTo },
    (event) => {
        const selected = event.selectedValues.map(x => x[0]);
        container.querySelectorAll('input').forEach(cb => {
            cb.checked = selected.includes(cb.value);
        });
    }
);