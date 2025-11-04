// === АСИНХРОННАЯ ЗАГРУЗКА БИБЛИОТЕК ===
async function loadLibrary(libraryName, libraryUrl) {
    // Проверяем, не загружена ли библиотека уже
    if (window[libraryName] || document.querySelector(`script[src="${libraryUrl}"]`)) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = libraryUrl;
        script.onload = () => {
            console.log(`Библиотека ${libraryName} загружена`);
            resolve();
        };
        script.onerror = () => {
            console.error(`Ошибка загрузки ${libraryName}`);
            reject(new Error(`Не удалось загрузить ${libraryName}`));
        };
        document.head.appendChild(script);
    });
}

// === СПИСОК БИБЛИОТЕК ===
const libraries = {
    'echarts': 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js',
    'd3': 'https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js',
    'chartjs': 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'highcharts': 'https://code.highcharts.com/highcharts.js',
    'amcharts': 'https://cdn.amcharts.com/lib/5/index.js',
    'plotly': 'https://cdn.plot.ly/plotly-2.24.1.min.js',
    'apexcharts': 'https://cdn.jsdelivr.net/npm/apexcharts',
    'victory': 'https://unpkg.com/victory@36.6.10/dist/victory.min.js',
    'nivo': 'https://unpkg.com/@nivo/core@0.83.0/dist/nivo-core.min.js'
};

// === АСИНХРОННАЯ ИНИЦИАЛИЗАЦИЯ С ВЫБРАННОЙ БИБЛИОТЕКОЙ ===
async function initWithLibrary(libraryKey) {
    const libraryUrl = libraries[libraryKey];

    if (!libraryUrl) {
        throw new Error(`Библиотека ${libraryKey} не найдена`);
    }

    try {
        await loadLibrary(libraryKey, libraryUrl);
        init(); // Запускаем инициализацию виджета после загрузки
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
}

// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;
const widgetColors = w.colors;
let chart = null;

// === ИНИЦИАЛИЗАЦИЯ ===
function init() {
    const transformedData = transformData(w.data.primaryData.items);
    createContainer();
    render(transformedData);
}

// === ТРАНСФОРМАЦИЯ ДАННЫХ ===
function transformData(items) {
    return items.map(item => ({
        category: item.formattedKeys[0],
        value: item.values[0]
    }));
}

// === СОЗДАНИЕ КОНТЕЙНЕРА ===
function createContainer() {
    const html = `<div id="customWidget-${widgetGuid}" style="width:100%;height:100%;"></div>`;
    w.general.text = html;
    TextRender({ text: w.general, style: {} });
}

// === РЕНДЕРИНГ ВИЗУАЛИЗАЦИИ ===
function render(data) {
    const container = document.getElementById(`customWidget-${widgetGuid}`);

    // Пример для ECharts
    if (typeof echarts !== 'undefined') {
        chart = echarts.init(container);
        const option = {
            xAxis: { type: 'category', data: data.map(d => d.category) },
            yAxis: { type: 'value' },
            series: [{
                data: data.map(d => d.value),
                type: 'bar',
                itemStyle: { color: widgetColors[0] }
            }]
        };
        chart.setOption(option);
    }
}

// === ЗАПУСК С ВЫБРАННОЙ БИБЛИОТЕКОЙ ===
// Укажи нужную библиотеку: 'echarts', 'd3', 'chartjs', etc.
initWithLibrary('echarts');