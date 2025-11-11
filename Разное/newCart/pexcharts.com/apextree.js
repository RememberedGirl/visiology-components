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
    const nodeMap = new Map();
    const rootNodes = [];

    items.forEach(item => {
        const parentId = String(item.keys[0]);
        const nodeId = String(item.keys[1]);
        const nodeName = String(item.keys[2]);

        if (!nodeMap.has(nodeId)) {
            nodeMap.set(nodeId, {
                id: nodeId,
                name: nodeName,
                children: []
            });
        } else {
            nodeMap.get(nodeId).name = nodeName;
        }

        if (!parentId || parentId === '' || parentId === 'null' || parentId === 'undefined') {
            rootNodes.push(nodeMap.get(nodeId));
        } else {
            if (!nodeMap.has(parentId)) {
                nodeMap.set(parentId, {
                    id: parentId,
                    name: parentId,
                    children: []
                });
            }
            nodeMap.get(parentId).children.push(nodeMap.get(nodeId));
        }
    });

    return rootNodes.length === 1 ? rootNodes[0] : { id: 'root', name: 'Root', children: rootNodes };
}

// === СОЗДАНИЕ КОНТЕЙНЕРА ===
function createContainer() {
    const html = `<div id="customWidget-${widgetGuid}" style="width:100%;height:100%;overflow:hidden;">
        <div id="svg-tree-${widgetGuid}" style="width:100%;height:100%;"></div>
    </div>`;
    w.general.text = html;
    TextRender({ text: w.general, style: {} });
}

// === РЕНДЕРИНГ ВИЗУАЛИЗАЦИИ ===
function render(data) {
    const container = document.getElementById(`customWidget-${widgetGuid}`);
    const svgContainer = document.getElementById(`svg-tree-${widgetGuid}`);

    const options = {
        contentKey: 'name',
        width: svgContainer.offsetWidth,
        height: svgContainer.offsetHeight,
        nodeWidth: 150,
        nodeHeight: 50,
        childrenSpacing: 150,
        siblingSpacing: 30,
        direction: 'top',
        fontSize: '14px',
        fontFamily: 'sans-serif',
        fontWeight: '600',
        fontColor: widgetPalette[0],
        borderWidth: 2,
        borderColor: widgetPalette[0],
        canvasStyle: `background: ${widgetPalette.length > 1 ? widgetPalette[1] : '#f6f6f6'};`,
        onNodeMouseOver: function(node) {
            highlightPathToRoot(node);
        },
        onNodeMouseOut: function(node) {
            resetHighlight();
        }
    };

    const tree = new ApexTree(svgContainer, options);
    const graph = tree.render(data);

    function highlightPathToRoot(node) {
        resetHighlight();

        let currentNode = node;
        let colorIndex = 0;

        while (currentNode) {
            currentNode.shape.attr('fill', widgetPalette[colorIndex % widgetPalette.length]);
            currentNode.text.attr('fill', '#ffffff');

            if (currentNode.parent) {
                currentNode = currentNode.parent;
                colorIndex++;
            } else {
                break;
            }
        }
    }

    function resetHighlight() {
        graph.nodes.forEach(n => {
            n.shape.attr('fill', '#ffffff');
            n.text.attr('fill', widgetPalette[0]);
        });
    }
}

// === ЗАПУСК ===
init();