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
    // Определяем индексы измерений и метрик
    // Предполагаем структуру: [НазваниеЗадачи, Статус], [Начало, Конец, Прогресс]
    const taskNameDimensionIndex = 0;
    const taskStatusDimensionIndex = 1;
    const startMetricIndex = 0;
    const endMetricIndex = 1;
    const progressMetricIndex = 2; // Может быть не у всех элементов

    // Создаем массив уникальных статусов для построения легенды
    const statusSet = new Set();
    items.forEach(item => {
        if (item.formattedKeys[taskStatusDimensionIndex]) {
            statusSet.add(item.formattedKeys[taskStatusDimensionIndex]);
        }
    });
    const statusList = Array.from(statusSet);

    // Преобразуем данные в формат, понятный для ECharts Gantt
    const data = items.map(item => {
        const start = item.values[startMetricIndex];
        const end = item.values[endMetricIndex];
        // Проверяем, существует ли значение прогресса
        const progressValue = item.values[progressMetricIndex] != null ? item.values[progressMetricIndex] : null;

        return {
            name: item.formattedKeys[taskNameDimensionIndex],
            start: start,
            end: end,
            progress: progressValue,
            status: item.formattedKeys[taskStatusDimensionIndex],
            // Сырые данные на всякий случай
            rawItem: item
        };
    });

    return {
        data: data,
        statusList: statusList
    };
}

// === СОЗДАНИЕ КОНТЕЙНЕРА ===
function createContainer() {
    const html = `<div id="customWidget-${widgetGuid}" style="width:100%;height:100%;overflow:hidden;"></div>`;
    w.general.text = html;
    TextRender({ text: w.general, style: {} });
}

// === РЕНДЕРИНГ ВИЗУАЛИЗАЦИИ ===
function render(transformedData) {
    const container = document.getElementById(`customWidget-${widgetGuid}`);
    if (!container) return;

    // Инициализируем экземпляр ECharts
    chart = echarts.init(container);

    // Данные и категории для оси Y
    const ganttData = transformedData.data;
    const yAxisData = ganttData.map(item => item.name);

    // Цветовая схема в зависимости от статуса
    const statusColorMap = {};
    transformedData.statusList.forEach((status, index) => {
        // Используем цвета из палитры виджета или стандартную палитру ECharts
        statusColorMap[status] = widgetColors[index % widgetColors.length] || echarts.getOption().color[index % echarts.getOption().color.length];
    });

    // Опции для диаграммы Ганта
    const option = {
        tooltip: {
            formatter: function (params) {
                const data = params.data;
                const startDate = new Date(data.start);
                const endDate = new Date(data.end);
                const progressText = data.progress != null ? `<br/>Прогресс: <b>${data.progress}%</b>` : '';
                return `
                    ${data.name}<br/>
                    Период: <b>${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</b>
                    ${progressText}<br/>
                    Статус: <b>${data.status}</b>
                `;
            }
        },
        legend: {
            data: transformedData.statusList
        },
        dataZoom: [
            {
                type: 'slider',
                filterMode: 'weakFilter',
                showDataShadow: false,
                top: 30,
                labelFormatter: ''
            },
            {
                type: 'inside',
                filterMode: 'weakFilter'
            }
        ],
        grid: {
            top: 80,
            bottom: 50,
            left: 150, // Место для названий задач
            right: 50
        },
        xAxis: {
            type: 'time',
            scale: true,
            axisLabel: {
                formatter: function (val) {
                    return new Date(val).toLocaleDateString();
                }
            }
        },
        yAxis: {
            type: 'category',
            data: yAxisData,
            axisLabel: {
                interval: 0 // Показывать все labels
            }
        },
        series: [
            {
                type: 'custom',
                renderItem: function (params, api) {
                    const categoryIndex = api.value(0); // Индекс по оси Y
                    const start = api.coord([api.value(1), categoryIndex]); // Начало полосы
                    const end = api.coord([api.value(2), categoryIndex]);   // Конец полосы
                    const height = api.size([0, 1])[1] * 0.6; // Высота полосы
                    const status = api.value(3);
                    const progress = api.value(4);

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

                    // Если полоса полностью не в области видимости, не рендерим её
                    if (!rectShape) {
                        return;
                    }

                    // Основная полоса (весь срок задачи)
                    const mainRect = {
                        type: 'rect',
                        shape: rectShape,
                        style: {
                            fill: statusColorMap[status] || '#5470c6',
                            opacity: 0.7
                        }
                    };

                    // Если есть прогресс, отрисовываем его поверх основной полосы
                    if (progress != null && progress > 0) {
                        const progressWidth = (end[0] - start[0]) * (progress / 100);
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

                        if (progressShape) {
                            const progressRect = {
                                type: 'rect',
                                shape: progressShape,
                                style: {
                                    fill: statusColorMap[status] || '#5470c6',
                                    opacity: 1.0 // Полная непрозрачность для части выполнения
                                }
                            };
                            return {
                                type: 'group',
                                children: [mainRect, progressRect]
                            };
                        }
                    }

                    return mainRect;
                },
                encode: {
                    x: [1, 2], // start, end
                    y: 0       // categoryIndex
                },
                data: ganttData.map((item, index) => {
                    return [index, item.start, item.end, item.status, item.progress];
                })
            }
        ]
    };

    // Устанавливаем опции и рендерим chart
    chart.setOption(option);

    // Обработчик изменения размера окна
    window.addEventListener('resize', function() {
        chart.resize();
    });
}

// === ЗАПУСК ===
init();