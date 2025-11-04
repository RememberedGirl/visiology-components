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
    const nodesMap = {};
    const nodes = [];
    const links = [];

    // Получаем диапазоны для нормализации
    const nodeWeights = items.map(i => i.values[1]);
    const linkStrengths = items.map(i => i.values[0]);
    const minNode = Math.min(...nodeWeights);
    const maxNode = Math.max(...nodeWeights);
    const minLink = Math.min(...linkStrengths);
    const maxLink = Math.max(...linkStrengths);

    function normalize(value, min, max, minSize, maxSize) {
        if (max === min) return (minSize + maxSize) / 2;
        return minSize + ((value - min) / (max - min)) * (maxSize - minSize);
    }

    items.forEach(item => {
        const source = item.keys[0];
        const target = item.keys[1];
        const linkValue = item.values[0];
        const nodeValueSource = item.values[1];
        const nodeValueTarget = item.values[1];

        // Создаем уникальные узлы
        if (!nodesMap[source]) {
            nodesMap[source] = { name: source, value: nodeValueSource };
            nodes.push(nodesMap[source]);
        } else {
            nodesMap[source].value = Math.max(nodesMap[source].value, nodeValueSource);
        }

        if (!nodesMap[target]) {
            nodesMap[target] = { name: target, value: nodeValueTarget };
            nodes.push(nodesMap[target]);
        } else {
            nodesMap[target].value = Math.max(nodesMap[target].value, nodeValueTarget);
        }

        // Добавляем связь
        links.push({ source: source, target: target, value: linkValue, rawValue: item.values, path: item.keys.join(' - ') });
    });

    // Нормализуем размеры узлов и толщину связей
    nodes.forEach(n => n.symbolSize = normalize(n.value, minNode, maxNode, 5, 100));
    links.forEach(l => l.lineStyle = {
        width: normalize(l.value, minLink, maxLink, 1, 9),
        color: widgetColors[0] + '80', // прозрачный цвет для линий
        opacity: 0.6
    });

    // Присвоение цвета узлам по Измерение[0]
    const nodeNames = Object.keys(nodesMap);
    nodeNames.forEach((name, idx) => nodesMap[name].itemStyle = { color: widgetColors[idx % widgetColors.length] });

    return { nodes, links };
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
            trigger: 'item',
            formatter: function(info) {
                if (info.dataType === 'node') {
                    return `<b>${info.data.name}</b><br/>Weight: ${info.data.value}`;
                } else if (info.dataType === 'edge') {
                    return `<b>${info.data.source} → ${info.data.target}</b><br/>Strength: ${info.data.value}<br/>Path: ${info.data.path || ''}`;
                }
            }
        },
        series: [
            {
                type: 'graph',
                layout: 'force',
                roam: true,
                draggable: true,
                focusNodeAdjacency: true,
                data: data.nodes,
                links: data.links,
                force: { repulsion: 200, edgeLength: [50, 150] },
                label: { show: true, position: 'inside', color: '#000' },
                emphasis: {
                    label: { show: true },
                    lineStyle: { width: 2, opacity: 1 },
                    itemStyle: { borderWidth: 1, borderColor: '#333' }
                }
            }
        ]
    };

    chart.setOption(option);

    // Вывод пути выбранного узла или связи в консоль
    chart.on('click', params => console.log('Selected path:', params.data.path || params.data.name));
}

// === ЗАПУСК ===
init();
