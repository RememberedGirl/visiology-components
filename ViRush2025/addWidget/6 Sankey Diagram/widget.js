// === КОНФИГУРАЦИЯ ===
// Уникальный идентификатор виджета для создания DOM-элемента
// Используется: document.getElementById(`customWidget-${widgetGuid}`)
const widgetGuid = w.general.renderTo;

// Цветовая палитра виджета из настроек Visiology
// Используется: widgetColors[0] - первый цвет из палитры для заливки элементов
const widgetColors = w.colors;

// === ПЕРЕМЕННЫЕ ===
// Переменная для хранения экземпляра chart (ECharts, Chart.js и т.д.)
// Используется: chart = echarts.init(container); chart.setOption(option);
let chart = null;

// === ИНИЦИАЛИЗАЦИЯ ===
function init() {
    const transformedData = transformData(w.data.primaryData.items);
    createContainer();
    render(transformedData);
}

// === ТРАНСФОРМАЦИЯ ДАННЫХ ===
function transformData(items) {
    let nodesSet = new Set();
    let links = [];
    items.forEach(item => {
        let source = item.keys[0];
        let target = item.keys[1];
        let value = item.values[0];
        nodesSet.add(source);
        nodesSet.add(target);
        links.push({source: source, target: target, value: value});
    });
    let nodes = Array.from(nodesSet).map((name, index) => ({
        name: name,
        itemStyle: { color: widgetColors[index % widgetColors.length] }
    }));
    return { nodes: nodes, links: links };
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
    chart = echarts.init(container);
    const option = {
        tooltip: {},
        series: [{
            type: 'sankey',
            data: data.nodes,
            links: data.links,
            focusNodeAdjacency: true,
            draggable: true,
            lineStyle: {
                color: 'source',
                opacity: 0.3
            }
        }]
    };
    chart.setOption(option);
}

// === ЗАПУСК ===
init();