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
    if (!items || items.length === 0) return [];

    const keyCount = items[0]?.keys?.length || 0;

    return items.map(item => {
        // Определяем статус задачи на основе прогресса
        const progress = item.values[2] || 0;
        let status = 'not_started';

        if (progress >= 100) {
            status = 'completed';
        } else if (progress > 0 && progress < 100) {
            status = 'in_progress';
        } else if (progress === 0) {
            status = 'planned';
        }

        return {
            // Измерения
            name: item.formattedKeys[0] || 'Задача',
            category: item.formattedKeys[0] || 'Задача',

            // Метрики
            startTime: item.values[0], // Дата начала в миллисекундах
            endTime: item.values[1],   // Дата окончания в миллисекундах
            progress: progress,        // Прогресс выполнения %

            // Дополнительные данные
            status: status,
            duration: item.values[1] - item.values[0],

            // Исходные данные
            rawItem: item,
            keyCount: keyCount
        };
    });
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
    if (!container || !data || data.length === 0) return;

    // Инициализация ECharts
    chart = echarts.init(container);

    // Подготовка данных для диаграммы Ганта
    const tasks = data.map((item, index) => ({
        name: item.name,
        start: item.startTime,
        end: item.endTime,
        progress: item.progress,
        status: item.status,
        itemIndex: index
    }));

    // Цветовая схема для статусов
    const statusColors = {
        'completed': '#52c41a',  // зеленый
        'in_progress': '#1890ff', // синий
        'planned': '#fa8c16',     // оранжевый
        'not_started': '#d9d9d9'  // серый
    };

    // Настройки диаграммы
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                const task = tasks[params.dataIndex];
                const startDate = new Date(task.start).toLocaleDateString();
                const endDate = new Date(task.end).toLocaleDateString();
                const progress = task.progress || 0;

                return `
                    <strong>${task.name}</strong><br/>
                    Начало: ${startDate}<br/>
                    Окончание: ${endDate}<br/>
                    Прогресс: ${progress}%<br/>
                    Статус: ${getStatusText(task.status)}
                `;
            }
        },
        legend: {
            data: ['Завершено', 'В работе', 'Планируется', 'Не начат'],
            top: 10
        },
        dataZoom: [
            {
                type: 'slider',
                filterMode: 'weakFilter',
                showDataShadow: false,
                top: 40,
                labelFormatter: ''
            },
            {
                type: 'inside',
                filterMode: 'weakFilter'
            }
        ],
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'time',
            scale: true,
            axisLabel: {
                formatter: function(value) {
                    return new Date(value).toLocaleDateString();
                }
            }
        },
        yAxis: {
            type: 'category',
            data: tasks.map(task => task.name),
            axisLabel: {
                interval: 0,
                rotate: 0
            }
        },
        series: [
            {
                name: 'Задачи',
                type: 'custom',
                renderItem: function(params, api) {
                    const taskIndex = params.dataIndex;
                    const task = tasks[taskIndex];

                    if (!task) return;

                    const start = api.coord([task.start, task.name]);
                    const end = api.coord([task.end, task.name]);
                    const height = api.size([0, 1])[1] * 0.6;

                    // Основная полоса задачи
                    const rectShape = echarts.graphic.clipRectByRect({
                        x: start[0],
                        y: start[1] - height / 2,
                        width: end[0] - start[0],
                        height: height
                    }, {
                        x: params.coordSys.x,
                        y: params.coordSys.y,
                        width: params.coordSys.width,
                        height: params.coordSys.height
                    });

                    if (!rectShape) return;

                    // Полоса прогресса
                    const progressEnd = task.start + (task.end - task.start) * (task.progress / 100);
                    const progressPoint = api.coord([progressEnd, task.name]);
                    const progressWidth = progressPoint[0] - start[0];

                    const progressShape = echarts.graphic.clipRectByRect({
                        x: start[0],
                        y: start[1] - height / 2,
                        width: progressWidth,
                        height: height
                    }, {
                        x: params.coordSys.x,
                        y: params.coordSys.y,
                        width: params.coordSys.width,
                        height: params.coordSys.height
                    });

                    return {
                        type: 'group',
                        children: [
                            {
                                type: 'rect',
                                shape: rectShape,
                                style: {
                                    fill: statusColors[task.status] || '#d9d9d9',
                                    opacity: 0.3
                                }
                            },
                            {
                                type: 'rect',
                                shape: progressShape,
                                style: {
                                    fill: statusColors[task.status] || '#d9d9d9'
                                }
                            }
                        ]
                    };
                },
                encode: {
                    x: [0, 1],
                    y: 2
                },
                data: tasks.map(task => [task.start, task.end, task.name, task.progress, task.status])
            }
        ]
    };

    // Применяем настройки
    chart.setOption(option);


}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function getStatusText(status) {
    const statusMap = {
        'completed': 'Завершено',
        'in_progress': 'В работе',
        'planned': 'Планируется',
        'not_started': 'Не начат'
    };
    return statusMap[status] || 'Неизвестно';
}

// === ЗАПУСК ===
init();