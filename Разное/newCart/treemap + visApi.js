const widgetGuid = w.general.renderTo;

function init() {
    const items = w.data.primaryData.items;
    const treeData = buildTreeData(items);

    renderTreeMap(treeData);
}

function buildTreeData(items) {
    const root = { name: 'root', children: [] };
    const nodeMap = new Map();

    items.forEach(item => {
        let currentLevel = root.children;

        for (let i = 0; i < item.keys.length; i++) {
            const key = item.formattedKeys[i];

            let node = nodeMap.get(key);
            if (!node) {
                node = {
                    name: key,
                    value: item.values[0] || 1,
                    itemStyle: { color: w.colors[i % w.colors.length] },
                    children: []
                };
                nodeMap.set(key, node);
                currentLevel.push(node);
            } else {
                node.value += item.values[0] || 1;
            }
            currentLevel = node.children;
        }
    });

    return root.children;
}

function renderTreeMap(treeData) {
    const html = `<div id="treemap-${widgetGuid}" style="width:100%;height:100%;"></div>`;
    TextRender({ text: { ...w.general, text: html }, style: {} });

    const container = document.getElementById(`treemap-${widgetGuid}`);
    if (!container) return;

    const chart = echarts.init(container);
    chart.setOption({
        series: [{
            type: 'treemap',
            data: treeData,
            label: { show: true, fontSize: 12, color: '#fff' },
            itemStyle: { borderColor: '#333', borderWidth: 2 }
        }]
    });
}

init();