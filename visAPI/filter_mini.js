// minimal-filter-widget.js

const FILTER_ID = '2d024b4ab5904f069197ab83a9eeb12c';
const WIDGET_ID = w.general.renderTo;

const css = `.filter-btn { padding:10px; margin:5px; background:#ddd; border:none; cursor:pointer; }
.filter-btn.selected { background:#e74c3c; color:white; }`;

visApi().onWidgetLoadedListener({
    guid: FILTER_ID + WIDGET_ID,
    widgetGuid: FILTER_ID
}, async () => {
    const result = await visApi().getWidgetDataByGuid(FILTER_ID);
    const values = result.data.primaryData.items.map(item => item.values[0]);
    createButtons(values);
});

function createButtons(values) {
    const container = document.getElementById(WIDGET_ID);
    container.innerHTML = '';

    let selected = new Set();

    values.forEach(value => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = value;
        btn.onclick = () => {
            selected[btn.classList.toggle('selected') ? 'add' : 'delete'](value);
            const selectedArray = Array.from(selected).map(v => [v]);
            visApi().setFilterSelectedValues(WIDGET_ID, selectedArray);
            visApi().setFilterSelectedValues(FILTER_ID, selectedArray);
        };
        container.appendChild(btn);
    });

    const updateButtons = (selectedData) => {
        selected = new Set((selectedData.selectedValues || selectedData).map(x => x[0]));
        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList[selected.has(btn.textContent) ? 'add' : 'remove']('selected');
        });
    };

    updateButtons(visApi().getSelectedValues(FILTER_ID));

    visApi().onSelectedValuesChangedListener({
        guid: WIDGET_ID + '_filter',
        widgetGuid: FILTER_ID
    }, updateButtons);

    visApi().onSelectedValuesChangedListener({
        guid: WIDGET_ID + '_widget',
        widgetGuid: WIDGET_ID
    }, updateButtons);
}

const styleId = WIDGET_ID + '_style';
let style = document.getElementById(styleId);
if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
}
style.textContent = css;