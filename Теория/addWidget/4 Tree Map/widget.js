// === КОНФИГУРАЦИЯ ===
// Уникальный идентификатор виджета для создания DOM-элемента
// Используется: document.getElementById(`customWidget-${widgetGuid}`)
const widgetGuid = w.general.renderTo;

// Цветовая палитра виджета из настроек Visiology
// Используется: widgetColors[0] - первый цвет из палитры для заливки элементов
const widgetColors = w.colors;

// === ПЕРЕМЕННЫЕ ===
// Переменная для хранения экземпляра chart (ECharts, Chart.js и т.д.)
// Используется: chart = echarts.init(container); chart.setOption(option);
let chart = null;

// === ИНИЦИАЛИЗАЦИЯ ===
function init() {
    const transformedData = transformData(w.data.primaryData.items);
    createContainer();
    render(transformedData);
}

// === ТРАНСФОРМАЦИЯ ДАННЫХ ===
function transformData(items) {
    const hierarchy = {};
    const colorMap = {};

    // Сначала собираем все уникальные значения Измерение[0] для распределения цветов
    items.forEach(item => {
        const dim0 = item.keys[0];
        if (!colorMap[dim0]) {
            colorMap[dim0] = widgetColors[Object.keys(colorMap).length % widgetColors.length];
        }
    });

    items.forEach(item => {
        const [dim0, dim1, dim2] = item.keys;
        const metric0 = item.values[0];

        if (!hierarchy[dim0]) {
            hierarchy[dim0] = {
                name: dim0,
                value: 0, // Добавляем значение для корневого уровня
                children: [],
                itemStyle: {
                    color: colorMap[dim0]
                }
            };
        }

        let level1Node = hierarchy[dim0].children.find(child => child.name === dim1);
        if (!level1Node) {
            level1Node = {
                name: dim1,
                value: 0, // Добавляем значение для промежуточного уровня
                children: []
            };
            hierarchy[dim0].children.push(level1Node);
        }

        level1Node.children.push({
            name: dim2,
            value: metric0
        });

        // Суммируем значения для родительских узлов
        level1Node.value += metric0;
        hierarchy[dim0].value += metric0;
    });

    return Object.values(hierarchy);
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
            formatter: function (params) {
                const name = params.name;
                const value = params.value;
                const path = params.treePathInfo || [];

                // Строим путь для отображения в tooltip
                let pathText = '';
                if (path.length > 1) {
                    pathText = path.slice(0, -1).map(item => item.name).join(' → ');
                }

                return `
                    <div style="text-align: left;">
                        ${pathText ? `<b>Путь:</b> ${pathText}<br/>` : ''}
                        <b>Элемент:</b> ${name}<br/>
                        <b>Значение:</b> ${value || 0}
                    </div>
                `;
            }
        },
        series: [{
            type: 'treemap',
            data: data,
            label: {
                show: true,
                formatter: function (params) {
                    const name = params.name;
                    const value = params.value;
                    // Обрезаем длинные названия
                    const shortName = name.length > 15 ? name.substring(0, 15) + '...' : name;
                    return `${shortName}\n${value}`;
                },
                textStyle: {
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 'bold'
                },
                overflow: 'truncate'
            },
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 1,
                gapWidth: 2
            },
            levels: [
                {
                    itemStyle: {
                        borderWidth: 0,
                        gapWidth: 5
                    },
                    label: {
                        show: true
                    }
                },
                {
                    itemStyle: {
                        gapWidth: 3
                    },
                    label: {
                        show: true
                    }
                },
                {
                    label: {
                        show: true
                    }
                }
            ],
            emphasis: {
                focus: 'descendant',
                itemStyle: {
                    borderColor: '#333',
                    borderWidth: 2,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                    shadowBlur: 10
                }
            },
            roam: true, // Разрешаем масштабирование и перемещение
            breadcrumb: {
                show: true // Показывать навигационную цепочку
            }
        }]
    };

    chart.setOption(option);

    // Добавляем обработчик resize для адаптивности
    window.addEventListener('resize', function() {
        chart.resize();
    });
}

// === ЗАПУСК ===
init();