// Получаем ID контейнера виджета
const widgetId = w.general.renderTo;

// Простая функция инициализации DataGrid
function initializeSimpleDataGrid() {
    // Получаем данные напрямую из объекта w
    const widgetData = w;

    // Преобразуем данные для DevExtreme DataGrid
    const dataSource = transformData(widgetData);
    const columns = createColumns(widgetData);

    // Создаем DataGrid
    $(`#${widgetId}`).dxDataGrid({
        dataSource: dataSource,
        columns: columns,
        showBorders: true,
        columnAutoWidth: true,
        allowColumnResizing: true,
        paging: {
            pageSize: 10
        },
        pager: {
            showPageSizeSelector: true,
            allowedPageSizes: [5, 10, 20]
        }
    });
}

// Функция преобразования данных
function transformData(widgetData) {
    if (!widgetData || !widgetData.data || !widgetData.data.primaryData) {
        return [];
    }

    const items = widgetData.data.primaryData.items || [];

    return items.map((item, index) => {
        const rowData = { id: index };

        item.values.forEach((value, colIndex) => {
            rowData[`col${colIndex}`] = value;
        });

        return rowData;
    });
}

// Функция создания колонок
function createColumns(widgetData) {
    if (!widgetData || !widgetData.data || !widgetData.data.primaryData) {
        return [];
    }

    const mapping = widgetData.data.primaryData.metadata?.mapping || [];
    const columns = [];

    mapping.forEach((field, index) => {
        columns.push({
            dataField: `col${index}`,
            caption: field.caption || field.name || `Column ${index + 1}`,
            dataType: getDataType(field.type)
        });
    });

    // Если нет metadata, создаем колонки по количеству данных
    if (columns.length === 0 && widgetData.data.primaryData.items.length > 0) {
        const item = widgetData.data.primaryData.items[0];
        item.values.forEach((_, index) => {
            columns.push({
                dataField: `col${index}`,
                caption: `Column ${index + 1}`
            });
        });
    }

    return columns;
}

// Функция определения типа данных
function getDataType(type) {
    const typeMap = {
        'number': 'number',
        'integer': 'number',
        'float': 'number',
        'date': 'date'
    };
    return typeMap[type] || 'string';
}

// Инициализация при загрузке
setTimeout(() => {
    initializeSimpleDataGrid();
}, 100);