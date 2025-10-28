// Загрузка Highcharts
{
    const scriptId = w.general.renderTo + '-highcharts';
    if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://code.highcharts.com/highcharts.js';
        document.head.appendChild(script);
    }
}

// Данные из Visiology
const items = w.data.primaryData.items;
const keys = items[0].cols.slice(items[0].keys.length);
const categories = items.map(item => item.formattedKeys.join(' - '));

// 1. GET - один раз при загрузке
let currentFilter = '';
const initialFilters = visApi().getSelectedValues(w.general.renderTo);
currentFilter = initialFilters.length > 0 ? initialFilters.map(e => e.join(' - '))[0] : '';

// Создаем серии
const series = keys.map((key, j) => ({
    name: key,
    data: items.map((item, index) => ({
        y: item.values[j],
        marker: {
            lineWidth: currentFilter === categories[index] ? 2 : 0,
            lineColor: '#000'
        }
    }))
}));

// Создаем контейнер для графика
w.general.text = `<div id="chart-${w.general.renderTo}" style="width:100%; height:100%;"></div>`;
TextRender({
    text: w.general,
    style: {}
});

// Рендерим и инициализируем график
const chart = Highcharts.chart(`chart-${w.general.renderTo}`, {
    xAxis: { categories },
    series,
    plotOptions: {
        series: {
            point: {
                events: {
                    click: function() {
                        // 2. SET - при действии пользователя
                        const categoryArr = categories[this.index];
                        let category = [];
                        if (currentFilter !== categoryArr) {
                            category = [categoryArr.split(' - ')];
                        }
                        visApi().setFilterSelectedValues(w.general.renderTo, category);
                    }
                }
            }
        }
    }
});

// 3. LISTEN - для обновлений UI
visApi().onSelectedValuesChangedListener(
    {
        guid: w.general.renderTo + '-highcharts-listener',
        widgetGuid: w.general.renderTo
    },
    function(event) {
        // Обновляем текущий фильтр из события
        currentFilter = event.selectedValues && event.selectedValues.length > 0
            ? event.selectedValues.map(e => e.join(' - '))[0]
            : '';

        // Обновляем обводку всех точек
        chart.series.forEach((series) => {
            series.data.forEach((point, pointIndex) => {
                point.update({
                    marker: {
                        lineWidth: currentFilter === categories[pointIndex] ? 2 : 0,
                        lineColor: '#000'
                    }
                }, false);
            });
        });

        // Перерисовываем график один раз
        chart.redraw();
    }
);