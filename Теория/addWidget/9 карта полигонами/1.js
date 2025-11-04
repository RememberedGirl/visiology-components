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
            geometry: JSON.parse(item.keys[1]),
            value: item.values[0],
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

    map = L.map(`customWidget-${widgetGuid}`).setView([55.7558, 37.6173], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const values = data.map(item => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    data.forEach(item => {
        const normalizedValue = (item.value - minValue) / (maxValue - minValue);
        const color = getColor(normalizedValue);

        const polygon = L.geoJSON(item.geometry, {
            style: {
                fillColor: color,
                fillOpacity: 0.7,
                color: widgetColors[0],
                weight: 2,
                opacity: 0.8
            }
        }).addTo(map);

        polygon.bindTooltip(`${item.name}: ${item.value}`, {
            permanent: false,
            direction: 'top'
        });

        polygon.bindPopup(`
            <strong>${item.name}</strong><br/>
            Значение: ${item.value}
        `);
    });
}

function getColor(normalizedValue) {
    const r = Math.floor(255 * normalizedValue + 255 * (1 - normalizedValue) * 0.5);
    const g = Math.floor(255 * (1 - normalizedValue) * 0.8);
    const b = Math.floor(255 * (1 - normalizedValue) * 0.2);
    return `rgb(${r}, ${g}, ${b})`;
}

// === ЗАПУСК ===
init();