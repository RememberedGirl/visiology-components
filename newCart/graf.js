const widgetGuid = w.general.renderTo;
// Создаем контейнер для графика
const html = `<div id="graph-${widgetGuid}" style="width:100%; height:100%;"></div>`;
TextRender({ text: { ...w.general, text: html }, style: {} });

const items = w.data.primaryData.items;

// Парсим данные для графа
const nodes = [];
const links = [];
const nodeMap = new Map();

items.forEach(item => {
    // Проходим по всем уровням иерархии и создаем связи
    for (let i = 0; i < item.keys.length - 1; i++) {
        const source = item.formattedKeys[i];
        const target = item.formattedKeys[i + 1];
        const value = item.values[0] || 1;

        // Добавляем узлы
        if (!nodeMap.has(source)) {
            nodes.push({ id: source, name: source, value: value });
            nodeMap.set(source, true);
        }
        if (!nodeMap.has(target)) {
            nodes.push({ id: target, name: target, value: value });
            nodeMap.set(target, true);
        }

        // Добавляем связь
        links.push({ source: source, target: target });
    }
});

// Создаем граф
const chart = echarts.init(document.getElementById(`graph-${widgetGuid}`));
chart.setOption({
    series: [{
        type: 'graph',
        layout: 'force',
        data: nodes.map(node => ({
            ...node,
            symbolSize: Math.max(10, node.value / 5 )
        })),
        links: links,
        force: { repulsion: 1000 },
        label: { show: true }
    }]
});

