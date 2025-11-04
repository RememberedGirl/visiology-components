// Данные из Visiology
const items = w.data.primaryData.items;
const keys = items[0].cols.slice(items[0].keys.length);
const categories = items.map(item => item.formattedKeys.join(' - '));

// Получаем текущий фильтр
let currentFilter = visApi().getSelectedValues(w.general.renderTo).map(e => e.join(' - '))[0];

// Создаем серии для ECharts
const series = keys.map((key, j) => ({
    name: key,
    type: 'line',
    symbolSize: 8,
    data: items.map((item, index) => ({
        value: item.values[j],
        itemStyle: {
            borderWidth: currentFilter === categories[index] ? 4 : 1,
            borderColor: currentFilter === categories[index] ? '#ff0000' : 'transparent'
        },
        symbolSize: currentFilter === categories[index] ? 12 : 8
    }))
}));

// Создаем контейнер для графика
const html = `<div id="chart-${w.general.renderTo}" style="width:100%; height:100%;"></div>`;
TextRender({ text: { ...w.general, text: html }, style: {} });

// Инициализируем ECharts
const chart = echarts.init(document.getElementById(`chart-${w.general.renderTo}`));

// Настройки графика
const option = {
    xAxis: {
        type: 'category',
        data: categories
    },
    yAxis: {
        type: 'value'
    },
    series: series,
    tooltip: {
        trigger: 'axis'
    },
    legend: {
        data: keys
    }
};

chart.setOption(option);

// Обработчик клика
chart.on('click', function(params) {
    if (params.componentType === 'series') {
        const categoryArr = categories[params.dataIndex];
        let category = [];

        if (currentFilter !== categoryArr) {
            category = [categoryArr.split(' - ')];
        }

        visApi().setFilterSelectedValues(w.general.renderTo, category);
    }
});

// Слушаем изменения фильтра
visApi().onSelectedValuesChangedListener(
    {guid: w.general.renderTo, widgetGuid: w.general.renderTo},
    function(event) {
        // Обновляем текущий фильтр из события
        currentFilter = event.selectedValues ?
            event.selectedValues.map(e => e.join(' - '))[0] : '';

        // Обновляем стили точек
        const updatedSeries = keys.map((key, j) => ({
            data: items.map((item, index) => ({
                value: item.values[j],
                itemStyle: {
                    borderWidth: currentFilter === categories[index] ? 4 : 1,
                    borderColor: currentFilter === categories[index] ? '#ff0000' : 'transparent'
                },
                symbolSize: currentFilter === categories[index] ? 12 : 8
            }))
        }));

        // Обновляем график
        chart.setOption({
            series: updatedSeries
        });
    }
);