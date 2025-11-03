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
    return items.map((item, idx) => {
        const start = item.values[0];
        const end = item.values[1];
        const progressRaw = item.values[2];
        const progress = (progressRaw === null || progressRaw === undefined) ? null : progressRaw;
        const task = item.keys[0];
        const status = resolveStatus(progress);
        return {
            task,
            start,
            end,
            progress,
            status,
            idx
        };
    });
}

function resolveStatus(progress) {
    if (progress === null || progress === undefined) return 'notStarted';
    if (progress === 0) return 'planned';
    if (progress < 100) return 'inProgress';
    return 'completed';
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

    const tasks = data.map(d => d.task);

    const statusColors = {
        completed: '#4CAF50',
        inProgress: '#2196F3',
        planned: '#FF9800',
        notStarted: '#9E9E9E'
    };

    // Подготовка данных для custom series: [start, end, progress, status, idx, task]
    const seriesData = data.map(d => [
        d.start,
        d.end,
        (d.progress === null || d.progress === undefined) ? null : d.progress,
        d.status,
        d.idx,
        d.task
    ]);

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: params => {
                const d = params.data;
                const start = new Date(d[0]).toLocaleString();
                const end = new Date(d[1]).toLocaleString();
                const progress = (d[2] === null || d[2] === undefined) ? '—' : `${d[2]}%`;
                const status = d[3];
                const taskName = d[5];
                return `${taskName}<br/>Старт: ${start}<br/>Конец: ${end}<br/>Прогресс: ${progress}<br/>Статус: ${status}`;
            }
        },
        dataZoom: [
            { type: 'slider', xAxisIndex: 0, bottom: 6, height: 20 },
            { type: 'inside', xAxisIndex: 0 }
        ],
        xAxis: {
            type: 'time',
            axisLabel: { formatter: val => new Date(val).toLocaleDateString() }
        },
        yAxis: {
            type: 'category',
            data: tasks,
            inverse: true,
            axisTick: { show: false }
        },
        grid: { left: '8%', right: '6%', top: '6%', bottom: '14%', containLabel: true },
        series: [
            {
                name: 'Gantt',
                type: 'custom',
                renderItem: function (params, api) {
                    const start = api.value(0);
                    const end = api.value(1);
                    const progress = api.value(2);
                    const status = api.value(3);
                    const rowIndex = api.value(4);
                    const yCategory = api.coord([0, rowIndex])[1];
                    const pStart = api.coord([start, rowIndex]);
                    const pEnd = api.coord([end, rowIndex]);

                    const barHeight = Math.max(6, api.size([0, 1])[1] * 0.6);
                    const x = pStart[0];
                    const y = yCategory - barHeight / 2;
                    const width = pEnd[0] - pStart[0];

                    // Фоновая полоса задачи (цвет по статусу)
                    const mainRect = {
                        type: 'rect',
                        shape: {
                            x: x,
                            y: y,
                            width: width,
                            height: barHeight
                        },
                        style: {
                            fill: statusColors[status] || statusColors.notStarted
                        }
                    };

                    // Полоса прогресса внутри (если есть прогресс)
                    let progressRect = null;
                    if (progress !== null && progress !== undefined) {
                        const progressWidth = width * Math.max(0, Math.min(1, progress / 100));
                        progressRect = {
                            type: 'rect',
                            shape: {
                                x: x,
                                y: y,
                                width: progressWidth,
                                height: barHeight
                            },
                            style: {
                                fill: 'rgba(255,255,255,0.35)'
                            }
                        };
                    }

                    const children = progressRect ? [mainRect, progressRect] : [mainRect];

                    return {
                        type: 'group',
                        children: children
                    };
                },
                itemStyle: {
                    opacity: 1
                },
                encode: { x: [0, 1], y: 4 },
                data: seriesData
            }
        ]
    };

    chart.setOption(option);
}

// === ЗАПУСК ===
init();
