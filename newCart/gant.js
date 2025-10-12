// Создаем и добавляем скрипт xrange
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highcharts/9.2.2/modules/xrange.js';
script.onload = () => {
    // Создаем контейнер
    w.general.text = `<div id="container" style="width:100%; height:100%;"></div>`;
    TextRender({ text: w.general, style: w.style });

    // Создаем график
    var items = w.data.primaryData.items.slice(0, 120);
    var categories = [...new Set(items.map(item => item.values[2]))];

    Highcharts.chart('container', {
        chart: { type: 'xrange' },
        series: [{
            data: items.map(item => ({
                x: new Date(item.values[1]).getTime(),
                x2: new Date(item.values[0]).getTime(),
                y: categories.indexOf(item.values[2])
            }))
        }],


        xAxis: {
            type: 'datetime',
            title: { text: 'Дата' },
            labels: {
                format: '{value:%d %b %Y}' // 01 Янв 2024
            }
        },
        yAxis: {
            title: { text: 'Покупатели' },
            categories: categories,
            reversed: true,
            gridLineWidth: 1,
            labels: {
                style: {
                    fontSize: '12px',
                    fontWeight: 'bold'
                }
            }
        }
    });
};
document.head.appendChild(script);