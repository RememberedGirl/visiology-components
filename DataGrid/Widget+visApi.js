// Преобразование данных из w
const keyLen = w.data.primaryData.items[0].keys.length;
const data = w.data.primaryData.items.map((item, index) => {
    const obj = {
        id: index  // Добавляем ID для стабильного выделения
    };

    item.keys.forEach((key, i) => {
        obj[item.cols[i]] = key;
    });
    item.values.forEach((val, i) => {
        obj[item.cols[keyLen + i]] = val;
    });

    // Добавляем путь для фильтрации
    obj._path = item.keys;
    obj._pathString = item.formattedKeys.join(' - ');

    return obj;
});

// Получение колонок
const cols = w.data.primaryData.items[0]?.cols || [];

// Получаем текущий фильтр
let currentFilter = '';
const currentFilters = visApi().getSelectedValues(w.general.renderTo);
if (currentFilters && currentFilters.length > 0) {
    currentFilter = currentFilters.map(e => e.join(' - '))[0];
}

// HTML с контейнером для таблицы
const html = `<div id="table-${w.general.renderTo}"></div>`;

// Отображаем через TextRender
TextRender({
    text: { ...w.general, text: html },
    style: {}
});

// Создание таблицы после рендера
{
    let grid;

    grid = $(`#table-${w.general.renderTo}`).dxDataGrid({
        dataSource: data,
        keyExpr: 'id',
        showBorders: true,
        columns: cols.filter(col => !col.startsWith('_')), // скрываем служебные поля
        width: '100%',
        height: '100%',
        selection: {
            mode: 'single'
        },
        onRowClick: function(e) {
            const rowData = e.data;
            let category = [];

            // Toggle логика: если кликаем на уже выбранную строку - снимаем фильтр
            if (currentFilter !== rowData._pathString) {
                category = [rowData._path];
            }

            visApi().setFilterSelectedValues(w.general.renderTo, category);
        },
        onContentReady: function(e) {
            // Выделяем строку при загрузке если есть активный фильтр
            if (currentFilter) {
                const row = data.find(item => item._pathString === currentFilter);
                if (row) {
                    e.component.selectRows([row.id], false);
                }
            }
        }
    }).dxDataGrid('instance');

    // Подписка на изменения фильтров
    visApi().onSelectedValuesChangedListener(
        { guid: w.general.renderTo, widgetGuid: w.general.renderTo },
        function(event) {
            const newFilters = event.selectedValues || [];
            currentFilter = newFilters.length > 0 ? newFilters.map(e => e.join(' - '))[0] : '';

            if (grid) {
                grid.clearSelection();
                if (currentFilter) {
                    const row = data.find(item => item._pathString === currentFilter);
                    if (row) {
                        grid.selectRows([row.id], false);
                        grid.scrollToRow(row.id);
                    }
                }
            }
        }
    );

}