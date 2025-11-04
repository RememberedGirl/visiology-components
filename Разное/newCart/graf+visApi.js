const widgetGuid = w.general.renderTo;
let chart = null;
let nodes = [];
let links = [];

// 1. GET - один раз при загрузке
function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(initialFilters);

    // Парсим данные
    const items = w.data.primaryData.items;
    const nodeMap = new Map();

    items.forEach(item => {
        for (let i = 0; i < item.keys.length - 1; i++) {
            const source = item.formattedKeys[i];
            const target = item.formattedKeys[i + 1];
            const value = item.values[0] || 1;

            if (!nodeMap.has(source)) {
                nodes.push({
                    id: source,
                    name: source,
                    value: value,
                    filterPath: [item.keys.slice(0, i + 1)],
                    filterString: item.keys.slice(0, i + 1).join(' - ')
                });
                nodeMap.set(source, true);
            }

            if (!nodeMap.has(target)) {
                nodes.push({
                    id: target,
                    name: target,
                    value: value,
                    filterPath: [item.keys.slice(0, i + 2)],
                    filterString: item.keys.slice(0, i + 2).join(' - ')
                });
                nodeMap.set(target, true);
            }

            links.push({ source: source, target: target });
        }
    });

    renderUI(currentFilter);
}

// 2. SET - при действии пользователя
function handleNodeClick(node) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    const filterToSet = currentFilter === node.filterString ? [] : node.filterPath;
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

// 3. LISTEN - для обновлений UI
visApi().onSelectedValuesChangedListener(
    {guid: widgetGuid + '-listener', widgetGuid: widgetGuid},
    (event) => {
        const currentFilter = formatFilter(event.selectedValues);
        updateUI(currentFilter);
    }
);

function renderUI(currentFilter) {
    const html = `<div id="graph-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({ text: { ...w.general, text: html }, style: {} });

    const container = document.getElementById(`graph-${widgetGuid}`);
    if (!container) return;

    chart = echarts.init(container);

    chart.setOption({
        series: [{
            type: 'graph',
            layout: 'force',
            data: nodes.map(node => ({
                ...node,
                symbolSize: Math.max(10, node.value / 50),
                itemStyle: {
                    color: '#5470c6',
                    borderColor: '#fff',
                    borderWidth: 2
                },
                emphasis: {
                    itemStyle: {
                        color: '#ff4d4f',
                        borderWidth: 4
                    }
                },
                select: {
                    itemStyle: {
                        color: '#ff4d4f',
                        borderWidth: 4,
                        shadowBlur: 10,
                        shadowColor: 'rgba(255, 77, 79, 0.5)'
                    }
                }
            })),
            links: links,
            force: {
                repulsion: 1000
            },
            label: {
                show: true,
                position: 'inside',
                color: '#fff'
            },
            roam: true,
            emphasis: {
                scale: true
            },
            selectedMode: 'single'
        }]
    });

    chart.on('click', function(params) {
        if (params.dataType === 'node') {
            handleNodeClick(params.data);
        }
    });

    // Применяем выделение после инициализации
    updateUI(currentFilter);
}

function updateUI(currentFilter) {
    if (!chart) return;

    // Сначала снимаем все выделения
    chart.dispatchAction({
        type: 'unselect',
        seriesIndex: 0
    });

    // Затем выделяем нужные узлы
    const selectedIndices = nodes
        .map((node, index) => currentFilter === node.filterString ? index : -1)
        .filter(index => index !== -1);

    if (selectedIndices.length > 0) {
        chart.dispatchAction({
            type: 'select',
            seriesIndex: 0,
            dataIndex: selectedIndices
        });
    }
}

function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0
        ? selectedValues[0].join(' - ')
        : '';
}

init();