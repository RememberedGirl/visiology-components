const widgetGuid = w.general.renderTo;

function init() {
    const items = w.data.primaryData.items;
    const { nodes, links } = buildGraphData(items);

    renderGraph(nodes, links);
}

function buildGraphData(items) {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    items.forEach(item => {
        for (let i = 0; i < item.keys.length - 1; i++) {
            const source = item.formattedKeys[i];
            const target = item.formattedKeys[i + 1];
            const value = item.values[0] || 1;

            if (!nodeMap.has(source)) {
                nodes.push({ id: source, name: source, value: value });
                nodeMap.set(source, true);
            }

            if (!nodeMap.has(target)) {
                nodes.push({ id: target, name: target, value: value });
                nodeMap.set(target, true);
            }

            links.push({ source: source, target: target });
        }
    });

    return { nodes, links };
}

function renderGraph(nodes, links) {
    const html = `<div id="graph-${widgetGuid}" style="width:100%;height:100%;"></div>`;
    TextRender({ text: { ...w.general, text: html }, style: {} });

    const container = document.getElementById(`graph-${widgetGuid}`);
    if (!container) return;

    const chart = echarts.init(container);
    chart.setOption({
        series: [{
            type: 'graph',
            layout: 'force',
            data: nodes.map(node => ({
                ...node,
                symbolSize: Math.max(10, node.value / 50),
                itemStyle: { color: '#5470c6' }
            })),
            links: links,
            force: { repulsion: 1000 },
            label: { show: true },
            roam: true
        }]
    });
}

init();