// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;
const widgetColors = w.colors;

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
    const nodesMap = new Map();
    const links = [];

    items.forEach(item => {
        const source = item.formattedKeys[0];
        const target = item.formattedKeys[1];
        const nodeCategory = item.formattedKeys[2] || 'default';
        const linkWeight = item.values[0] || 1;
        const nodeSize = item.values[1] || 20;

        if (!nodesMap.has(source)) {
            nodesMap.set(source, {
                id: source,
                name: source,
                category: nodeCategory,
                symbolSize: nodeSize
            });
        }

        if (!nodesMap.has(target)) {
            nodesMap.set(target, {
                id: target,
                name: target,
                category: nodeCategory,
                symbolSize: nodeSize
            });
        }

        links.push({
            source: source,
            target: target,
            value: linkWeight
        });
    });

    return {
        nodes: Array.from(nodesMap.values()),
        links: links
    };
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
        tooltip: {
            formatter: function(params) {
                if (params.dataType === 'node') {
                    return `Узел: ${params.data.name}<br/>Категория: ${params.data.category}<br/>Размер: ${params.data.symbolSize}`;
                } else {
                    return `Связь: ${params.data.source} → ${params.data.target}<br/>Вес: ${params.data.value}`;
                }
            }
        },
        legend: {
            show: true,
            data: Array.from(new Set(data.nodes.map(node => node.category)))
        },
        series: [{
            type: 'graph',
            layout: 'force',
            data: data.nodes,
            links: data.links,
            roam: true,
            label: {
                show: true,
                position: 'right'
            },
            edgeLabel: {
                show: true,
                formatter: '{c}'
            },
            lineStyle: {
                color: 'source',
                width: 2
            },
            emphasis: {
                focus: 'adjacency',
                lineStyle: {
                    width: 3
                }
            },
            force: {
                repulsion: 100,
                gravity: 0.1,
                edgeLength: 50
            },
            categories: Array.from(new Set(data.nodes.map(node => node.category))).map(cat => {
                return { name: cat };
            })
        }]
    };

    chart.setOption(option);
}

// === ЗАПУСК ===
init();