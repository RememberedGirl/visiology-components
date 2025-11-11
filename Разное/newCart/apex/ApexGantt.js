// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;
const widgetPalette = w.colors;

// === ПЕРЕМЕННЫЕ ===
let chart = null;

// === ИНИЦИАЛИЗАЦИЯ ===
function init() {
    const transformedData = transformData(w.data.primaryData.items);
    createContainer();
    render(transformedData);
}

// === ТРАНСФОРМАЦИЯ ДАННЫХ ===
function transformData(items) {
    return items.map(item => {
        const keys = item.keys;
        return {
            id: keys[0],
            name: keys[1],
            startTime: keys[2],
            endTime: keys[3] || null,
            parentId: keys[4] || null,
            dependency: keys[5] || null,
            progress: item.values[0] || 0,
            type: keys[6] || null
        };
    });
}

// === СОЗДАНИЕ КОНТЕЙНЕРА ===
function createContainer() {
    const html = `<div id="customWidget-${widgetGuid}" style="width:100%;height:100%;overflow:hidden;"></div>`;
    w.general.text = html;
    TextRender({ text: w.general, style: {} });
}

// === РЕНДЕРИНГ ВИЗУАЛИЗАЦИИ ===
function render(data) {
    const container = document.getElementById(`customWidget-${widgetGuid}`);

    const ganttOptions = {
        enableTaskDrag: false,
        enableTaskResize: false,
        colors: widgetPalette,
        series: data
    };

    chart = new ApexGantt(container, ganttOptions);
    chart.render();
}

// === ЗАПУСК ===
init();