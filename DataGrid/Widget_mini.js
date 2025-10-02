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
    style: w.style
});

// Создание таблицы после рендера

$(`#table-${w.general.renderTo}`).dxDataGrid({
    dataSource: data,
    showBorders: true,
    columns: cols,
    paging: { pageSize: 10 },
    filterRow: { visible: true },
});

