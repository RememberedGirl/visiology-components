// TODO


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



function pullPopup(e){
    const rect = e.getBoundingClientRect();
    document.documentElement.style.setProperty('--hover-transform', `translate(0px,0px)`)
    document.documentElement.style.setProperty('--hover-top', `${rect.top + rect.height}px`)
    document.documentElement.style.setProperty('--hover-left', `${rect.left}px`)
}

$("#"+ w.general.renderTo).on("mouseover", ".dx-datagrid-filter-row > td", function() {
    pullPopup(this);
});

$("#"+ w.general.renderTo).on("mouseover", ".dx-header-filter", function() {
    pullPopup(this);
});



let styleGlogal = document.getElementById('DevExpres_popup');
if (!styleGlogal) {
    styleGlogal = document.createElement('style');
    styleGlogal.id = 'DevExpres_popup';
    styleGlogal.innerHTML = `
    :root {
      --hover-transform: translate(0px,0px);
      --hover-top: 0px;
      --hover-left: 0px;

      --popup-transform: translate(0px,0px) scale(1);
      --popup-top: 0px;
      --popup-left: 0px;
    }
    .dx-overlay-content.dx-popup-normal.dx-resizable.dx-dropdowneditor-overlay {
        height: 300px !important;
    }

    .dx-overlay-wrapper {

        position: absolute  !important;

        top: var(--hover-top) !important;
        left: var(--hover-left) !important;
        transform: var(--hover-transform) !important;


    }

    .dx-overlay-content.dx-popup-normal.dx-resizable.dx-dropdowneditor-overlay,
    .dx-overlay-content.dx-inner-overlay.dx-resizable.dx-context-menu.dx-datagrid.dx-cell-focus-disabled.dx-filter-menu.dx-menu-base {
        display: block !important;
        transform: var(--popup-transform) !important;
        top: var(--popup-top) !important;
        left: var(--popup-left) !important;
        transform-origin: left top !important;

    }

    `;
    document.head.append(styleGlogal);
}

