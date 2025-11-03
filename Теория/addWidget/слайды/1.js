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
    return items.map(item => {
        return {
            // Измерение (категория) - первый элемент из formattedKeys
            category: item.formattedKeys[0],

            // Метрика (числовое значение) - первый элемент из values
            value: item.values[0]
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

    // Получаем категории для оси X
    const categories = data.map(item => item.category);

    // Получаем значения для оси Y
    const values = data.map(item => item.value);

    // Создаем canvas элемент для Chart.js
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    // Создаем столбчатую диаграмму
    chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: w.data.primaryData.items[0]?.cols[1] || 'Значение',
                data: values,
                backgroundColor: widgetColors[0],
                borderColor: widgetColors[0],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// === ЗАПУСК ===
init();