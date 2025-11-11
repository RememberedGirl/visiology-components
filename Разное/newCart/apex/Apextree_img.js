
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
    const positionColorMap = new Map();
    let positionIndex = 0;

    // Создаем узлы для всех уникальных значений
    items.forEach((item, index) => {
        const currentId = item.keys[0];
        const parentId = item.keys[1];
        const currentName = item.keys[2];
        const currentImage = item.keys[3];
        const position = item.keys[4]; // Новое измерение - позиция

        // Пропускаем элементы с пустыми значениями
        if (!currentId) return;

        // Создаем цвет для позиции если его нет
        if (position && !positionColorMap.has(position)) {
            positionColorMap.set(position, widgetPalette[positionIndex % widgetPalette.length]);
            positionIndex++;
        }

        // Создаем/обновляем узел текущего элемента
        if (!nodeMap.has(currentId)) {
            nodeMap.set(currentId, {
                id: currentId,
                data: {
                    imageURL: currentImage,
                    name: currentName || currentId,
                    position: position || 'Не указана'
                },
                options: {
                    nodeBGColor: positionColorMap.get(position) || widgetPalette[index % widgetPalette.length],
                    nodeBGColorHover: positionColorMap.get(position) || widgetPalette[index % widgetPalette.length]
                },
                children: []
            });
        } else {
            // Обновляем данные существующего узла
            const existingNode = nodeMap.get(currentId);
            existingNode.data.name = currentName || currentId;
            existingNode.data.imageURL = currentImage;
            existingNode.data.position = position || 'Не указана';
            if (position) {
                existingNode.options.nodeBGColor = positionColorMap.get(position) || existingNode.options.nodeBGColor;
                existingNode.options.nodeBGColorHover = positionColorMap.get(position) || existingNode.options.nodeBGColorHover;
            }
        }

        // Если есть родитель, создаем связь
        if (parentId) {
            // Создаем узел родителя если его нет
            if (!nodeMap.has(parentId)) {
                const parentPosition = items.find(item => item.keys[0] === parentId)?.keys[4];
                nodeMap.set(parentId, {
                    id: parentId,
                    data: {
                        imageURL: currentImage,
                        name: parentId,
                        position: parentPosition || 'Не указана'
                    },
                    options: {
                        nodeBGColor: positionColorMap.get(parentPosition) || widgetPalette[(index + 1) % widgetPalette.length],
                        nodeBGColorHover: positionColorMap.get(parentPosition) || widgetPalette[(index + 1) % widgetPalette.length]
                    },
                    children: []
                });
            }

            // Добавляем связь родитель-потомок
            const parentNode = nodeMap.get(parentId);
            const currentNode = nodeMap.get(currentId);

            // Проверяем, что связь еще не существует
            if (!parentNode.children.some(child => child.id === currentId)) {
                parentNode.children.push(currentNode);
            }
        }
    });

    // Находим корневые узлы (те, у которых нет родителя в данных)
    const allChildren = new Set();
    items.forEach(item => {
        if (item.keys[1]) {
            allChildren.add(item.keys[0]); // currentId становится потомком
        }
    });

    const rootNodes = Array.from(nodeMap.values()).filter(node =>
        !allChildren.has(node.id)
    );

    return rootNodes.length > 0 ? rootNodes[0] : Array.from(nodeMap.values())[0];
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

    const options = {
        contentKey: 'data',
        width: container.offsetWidth,
        height: container.offsetHeight,
        nodeWidth: 150,
        nodeHeight: 100,
        fontColor: '#fff',
        borderColor: '#333',
        childrenSpacing: 50,
        siblingSpacing: 20,
        direction: 'top',
        nodeTemplate: (content) =>
            `<div style='display: flex;flex-direction: column;gap: 10px;justify-content: center;align-items: center;height: 100%;'>
          <img style='width: 50px;height: 50px;border-radius: 50%;' src='${content.imageURL}' alt='' />
          <div style="font-weight: bold; font-family: Arial; font-size: 14px">${content.name}</div>
          <div style="font-size: 12px; color: #fff;">${content.position}</div>
         </div>`,
        canvasStyle: 'border: 1px solid black;background: #f6f6f6;',
        enableToolbar: true,
    };

    const tree = new ApexTree(container, options);
    tree.render(data);
}

// === ЗАПУСК ===
init();