const widgetGuid = w.general.renderTo;
let currentFilter = '';

// 1. GET - один раз при загрузке
function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    currentFilter = formatFilter(initialFilters);
    renderGraph();
}

// 2. SET - при действии пользователя
function handleNodeClick(node) {
    const nodeFilterString = node.filterPath[0].join(' - ');
    const filterToSet = currentFilter === nodeFilterString ? [] : node.filterPath;
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

// 3. LISTEN - для обновлений UI
visApi().onSelectedValuesChangedListener(
    {guid: widgetGuid + '-graph', widgetGuid: widgetGuid},
    (event) => {
        currentFilter = formatFilter(event.selectedValues);
        updateGraphStyles();
    }
);

function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0
        ? selectedValues[0].join(' - ')
        : '';
}

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

        // Добавляем узлы с путями для фильтрации
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

        // Добавляем связь
        links.push({ source: source, target: target });
    }
});

let chart;

function renderGraph() {
    chart = echarts.init(document.getElementById(`graph-${widgetGuid}`));

    chart.setOption({
        series: [{
            type: 'graph',
            layout: 'force',
            data: nodes.map(node => ({
                ...node,
                symbolSize: Math.max(10, node.value / 5),
                itemStyle: {
                    color: currentFilter === node.filterString ? '#ff4d4f' : '#5470c6'
                }
            })),
            links: links,
            force: { repulsion: 1000 },
            label: { show: true }
        }]
    });

    // Обработчик клика по узлам
    chart.on('click', params => {
        if (params.dataType === 'node') {
            handleNodeClick(params.data);
        }
    });
}

function updateGraphStyles() {
    if (!chart) return;

    const option = chart.getOption();
    option.series[0].data = nodes.map(node => ({
        ...node,
        symbolSize: Math.max(10, node.value / 5),
        itemStyle: {
            color: currentFilter === node.filterString ? '#ff4d4f' : '#5470c6'
        }
    }));
    chart.setOption(option);
}


// Запуск
init();