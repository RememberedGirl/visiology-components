// Преобразование данных из w
const data = w.data.primaryData.items.map(item => {
    const obj = {};
    item.cols.forEach((col, i) => {
        obj[col] = item.values[i];
    });
    return obj;
});

// Получение колонок
const cols = w.data.primaryData.items[0]?.cols || [];

// HTML с контейнером для таблицы
const html = `<div id="table-${w.general.renderTo}"></div>`;

// Отображаем через TextRender
TextRender({
    text: { ...w.general, text: html },
    style: {}
});

// Создание таблицы после рендера

$(`#table-${w.general.renderTo}`).dxDataGrid({
    dataSource: data,
    columns: cols,
    width: '100%',
    height: '100%',

    onCellPrepared: function(e) {
        if (e.rowType === 'data') {
            const value = e.value;
            // Проверяем, является ли значение числом и больше 5
            if (!isNaN(value) && parseFloat(value) > 5) {
                e.cellElement.css('background-color', 'green')
                    .css('color', 'white'); // Белый текст для контраста
            }
        }
    }

});

