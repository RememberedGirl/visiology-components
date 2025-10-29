const widgetGuid = w.general.renderTo;
let chart = null;
let currentTreeData = [];

function init() {
    const initialFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(initialFilters);

    const items = w.data.primaryData.items;
    currentTreeData = buildTreeData(items);

    renderUI(currentFilter, currentTreeData);
}

function buildTreeData(items) {
    const root = { name: 'root', children: [] };
    const nodeMap = new Map();

    items.forEach(item => {
        let currentLevel = root.children;
        let currentPath = [];

        for (let i = 0; i < item.keys.length; i++) {
            const key = item.formattedKeys[i];
            const rawKey = item.keys[i];
            currentPath.push(rawKey);

            let node = nodeMap.get(key);

            if (!node) {
                node = {
                    name: key,
                    value: item.values[0] || 1,
                    filterPath: [currentPath.slice()],
                    filterString: currentPath.join(' - '),
                    itemStyle: {
                        color: getColorByLevel(i),
                        borderColor: '#333',
                        borderWidth: 2
                    },
                    children: []
                };
                nodeMap.set(key, node);
                currentLevel.push(node);
            } else {
                node.value += item.values[0] || 1;
                node.filterPath.push(currentPath.slice());
            }

            currentLevel = node.children;
        }
    });

    return root.children;
}

function getColorByLevel(level) {
    const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'];
    return colors[level % colors.length];
}

function handleNodeClick(node) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    const filterToSet = currentFilter === node.filterString ? [] : node.filterPath;
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

visApi().onSelectedValuesChangedListener(
    {guid: widgetGuid + '-listener', widgetGuid: widgetGuid},
    (event) => {
        const currentFilter = formatFilter(event.selectedValues);
        updateUI(currentFilter);
    }
);

function renderUI(currentFilter, treeData) {
    const html = `<div id="treemap-${widgetGuid}" style="width:100%; height:100%;"></div>`;
    TextRender({ text: { ...w.general, text: html }, style: {} });

    const container = document.getElementById(`treemap-${widgetGuid}`);
    if (!container) return;

    chart = echarts.init(container);

    const option = {
        series: [{
            type: 'treemap',
            roam: false,
            nodeClick: false,
            label: {
                show: true,
                fontSize: 12,
                color: '#fff'
            },
            upperLabel: {
                show: true,
                height: 30,
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 'bold'
            },
            breadcrumb: { show: false },
            itemStyle: {
                borderColor: '#333',
                borderWidth: 2,
                gapWidth: 2
            },
            emphasis: {
                itemStyle: {
                    borderColor: '#ff0000',
                    borderWidth: 4,
                    shadowBlur: 10,
                    shadowColor: 'rgba(255, 0, 0, 0.5)'
                }
            },
            data: treeData
        }]
    };

    chart.setOption(option);

    chart.on('click', function(params) {
        if (params.data && params.data.filterPath) {
            handleNodeClick(params.data);
        }
    });

    updateUI(currentFilter);
}
function updateUI(currentFilter) {
    if (!chart || !currentTreeData.length) return;

    // Сбрасываем все выделения
    chart.dispatchAction({ type: 'downplay', seriesIndex: 0 });

    if (currentFilter) {
        // Обновляем опцию с выделением только для нужного узла
        const updatedData = updateTreeDataWithSelection(currentTreeData, currentFilter);

        chart.setOption({
            series: [{
                data: updatedData,
                emphasis: {
                    itemStyle: {
                        borderColor: '#ff0000',
                        borderWidth: 4,
                        shadowBlur: 10,
                        shadowColor: 'rgba(255, 0, 0, 0.5)'
                    }
                }
            }]
        }, false); // false - не объедивать с предыдущими опциями
    } else {
        // Если фильтр сброшен, возвращаем обычные стили
        const resetData = resetTreeDataSelection(currentTreeData);
        chart.setOption({
            series: [{
                data: resetData
            }]
        }, false);
    }
}

function updateTreeDataWithSelection(data, filterString) {
    return data.map(node => {
        const isSelected = node.filterString === filterString;

        const updatedNode = {
            ...node,
            itemStyle: {
                ...node.itemStyle,
                borderColor: isSelected ? '#ff0000' : '#333',
                borderWidth: isSelected ? 4 : 2
            }
        };

        if (node.children && node.children.length > 0) {
            updatedNode.children = updateTreeDataWithSelection(node.children, filterString);
        }

        return updatedNode;
    });
}

function resetTreeDataSelection(data) {
    return data.map(node => {
        const resetNode = {
            ...node,
            itemStyle: {
                ...node.itemStyle,
                borderColor: '#333',
                borderWidth: 2
            }
        };

        if (node.children && node.children.length > 0) {
            resetNode.children = resetTreeDataSelection(node.children);
        }

        return resetNode;
    });
}

function findNodeIndexByFilter(data, filterString, currentIndex = 0) {
    for (let i = 0; i < data.length; i++) {
        const node = data[i];
        if (node.filterString === filterString) {
            return currentIndex + i;
        }
        if (node.children && node.children.length > 0) {
            const childIndex = findNodeIndexByFilter(node.children, filterString, currentIndex + i + 1);
            if (childIndex !== -1) {
                return childIndex;
            }
        }
    }
    return -1;
}

function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0
        ? selectedValues[0].join(' - ')
        : '';
}

init();