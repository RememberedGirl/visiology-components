console.log(w.data.primaryData.items)

// Данные из Visiology
const items = w.data.primaryData.items;

// Получаем уникальные категории (первый уровень иерархии)
const categories = [...new Set(items.map(item => item.formattedKeys[0]))];
const COLOR_ALL = w.colors;

// Получаем текущий фильтр
let currentFilter = visApi().getSelectedValues(w.general.renderTo).map(e => e.join(' - '))[0];

// Создаем серии для каждой категории
const seriesData = categories.map((category, index) => {
    // Фильтруем точки для текущей категории
    const categoryItems = items.filter(item => item.formattedKeys[0] === category);
    const data = categoryItems.map(item => ({
        value: [
            parseFloat(item.values[0]) || 0,
            parseFloat(item.values[1]) || 0
        ],
        name: item.formattedKeys.join(' - '), // сохраняем полный путь для tooltip
        item: item, // сохраняем исходный элемент
        itemStyle: {
            borderWidth: currentFilter === item.formattedKeys.join(' - ') ? 3 : 0,
            borderColor: '#000'
        }
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
        position: 'top',
        formatter: function(params) {
            return `${params.data.name}<br/>
                    ${items[0].cols[items[0].keys.length]}: ${params.data.value[0].toFixed(2)}<br/>
                    ${items[0].cols[items[0].keys.length + 1]}: ${params.data.value[1].toFixed(2)}`;
        }
    },
    legend: {
        data: categories,
        type: 'scroll',
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

// Обработчик клика по точкам
chart.on('click', function(params) {
    if (params.data && params.data.item) {
        const item = params.data.item;
        const categoryPath = [item.formattedKeys]; // Формат: [['Уровень1', 'Уровень2', ...]]

        visApi().setFilterSelectedValues(w.general.renderTo, categoryPath);
    }
});

// Слушаем изменения фильтра
visApi().onSelectedValuesChangedListener(
    {guid: w.general.renderTo, widgetGuid: w.general.renderTo},
    function(event) {
        currentFilter = event.selectedValues ?
            event.selectedValues.map(e => e.join(' - '))[0] : '';

        // Обновляем обводку точек
        seriesData.forEach(series => {
            series.data.forEach(point => {
                const isSelected = currentFilter === point.name;
                point.itemStyle = {
                    ...point.itemStyle,
                    borderWidth: isSelected ? 3 : 0,
                    borderColor: '#000'
                };
            });
        });

        // Перерисовываем график
        chart.setOption({
            series: seriesData
        });
    }
);
