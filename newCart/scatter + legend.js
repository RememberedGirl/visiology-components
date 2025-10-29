// Данные из Visiology
const items = w.data.primaryData.items;

// Получаем уникальные категории (первый уровень иерархии)
const categories = [...new Set(items.map(item => item.formattedKeys[0]))];
const COLOR_ALL = w.colors;

// Создаем серии для каждой категории
const seriesData = categories.map((category, index) => {
    const categoryItems = items.filter(item => item.formattedKeys[0] === category);
    const data = categoryItems.map(item => ({
        value: [
            parseFloat(item.values[0]) || 0,
            parseFloat(item.values[1]) || 0
        ],
        name: item.formattedKeys.join(' - ')
    }));

    return {
        name: category,
        type: 'scatter',
        data: data,
        itemStyle: {
            color: COLOR_ALL[index % COLOR_ALL.length]
        },
        symbolSize: 15
    };
});

// Создаем контейнер для графика
const html = `<div id="cluster-${w.general.renderTo}" style="width:100%; height:100%;"></div>`;
TextRender({ text: { ...w.general, text: html }, style: {} });

// Инициализируем график
const chart = echarts.init(document.getElementById(`cluster-${w.general.renderTo}`));

// Настройки графика
const option = {
    tooltip: {
        formatter: function(params) {
            return `${params.data.name}<br/>
                    ${items[0].cols[items[0].keys.length]}: ${params.data.value[0].toFixed(2)}<br/>
                    ${items[0].cols[items[0].keys.length + 1]}: ${params.data.value[1].toFixed(2)}`;
        }
    },
    legend: {
        data: categories,
        orient: 'vertical',
        right: 10,
        top: 'center'
    },
    xAxis: {
        name: items[0].cols[items[0].keys.length] || 'Показатель 1',
        type: 'value'
    },
    yAxis: {
        name: items[0].cols[items[0].keys.length + 1] || 'Показатель 2',
        type: 'value'
    },
    series: seriesData
};

// Устанавливаем настройки
chart.setOption(option);

// Обработчик клика по легенде
chart.on('legendselectchanged', function(params) {


    const flag = Object.values(params.selected).every(element => !element)

    if (flag) {
        Object.keys(params.selected).forEach(k => params.selected[k] = 1)
        // Сбрасываем фильтр
        visApi().setFilterSelectedValues(w.general.renderTo, []);
    } else {
        Object.keys(params.selected).forEach(k => params.selected[k] = k == params.name? 1:0)
        visApi().setFilterSelectedValues(w.general.renderTo, [[params.name]]);
    }


    chart.setOption({
        legend: { selected:  params.selected }
    });

});

