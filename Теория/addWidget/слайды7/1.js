// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;
const widgetColors = w.colors;

// === ПЕРЕМЕННЫЕ ===
let map = null;

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
            name: item.keys[0],
            latitude: parseFloat(item.keys[1]),
            longitude: parseFloat(item.keys[2]),
            categories: item.keys,
            data: item.values,
            cols: item.cols,
            path: item.keys.join(' - ')
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

    // Инициализация карты
    const firstPoint = data[0];
    map = L.map(`customWidget-${widgetGuid}`).setView([firstPoint.latitude, firstPoint.longitude], 10);

    // Добавление слоя тайлов
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Добавление маркеров
    data.forEach(point => {
        const marker = L.marker([point.latitude, point.longitude])
            .addTo(map)
            .bindTooltip(point.name, {
                permanent: false,
                direction: 'top',
                offset: [0, -10]
            });
    });
}

// === ЗАПУСК ===
init();