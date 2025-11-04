const widgetGuid = w.general.renderTo;
let chart = null;

// 1. init()
function init() {
    createContainer();
    const data = transformData();
    renderVisualization(data);
    setupFilterListener();
}

// 2. transformData()
function transformData() {
    const items = w.data.primaryData.items;
    const categories = [...new Set(items.map(item => item.formattedKeys[0]))];

    return categories.map((category, index) => {
        const categoryItems = items.filter(item => item.formattedKeys[0] === category);
        const data = categoryItems.map(item => ({
            value: [
                parseFloat(item.values[0]) || 0,
                parseFloat(item.values[1]) || 0
            ],
            name: item.formattedKeys.join(' - '),
            item: item
        }));

        return {
            name: category,
            type: 'scatter',
            data: data,
            itemStyle: {
                color: w.colors[index % w.colors.length]
            },
            symbolSize: 15
        };
    });
}

// 3. createContainer()
function createContainer() {
    const container = document.getElementById(widgetGuid);
    container.innerHTML = `<div id="cluster-${widgetGuid}" style="width:100%; height:100%;"></div>`;
}

// 4. renderVisualization()
function renderVisualization(seriesData) {
    const items = w.data.primaryData.items;
    const categories = [...new Set(items.map(item => item.formattedKeys[0]))];

    chart = echarts.init(document.getElementById(`cluster-${widgetGuid}`));

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

    chart.setOption(option);

    // 5. handleClick()
    chart.on('legendselectchanged', function(params) {
        const flag = Object.values(params.selected).every(element => !element);

        if (flag) {
            Object.keys(params.selected).forEach(k => params.selected[k] = 1);
            visApi().setFilterSelectedValues(widgetGuid, []);
        } else {
            Object.keys(params.selected).forEach(k => params.selected[k] = k == params.name ? 1 : 0);
            visApi().setFilterSelectedValues(widgetGuid, [[params.name]]);
        }

        chart.setOption({
            legend: { selected: params.selected }
        });
    });

    window.addEventListener('resize', function() {
        chart.resize();
    });
}

// 6. updateVisualization()
function updateVisualization() {
    if (chart) {
        const data = transformData();
        chart.setOption({
            series: data
        });
    }
}

// 7. setupFilterListener()
function setupFilterListener() {
    visApi().onSelectedValuesChangedListener(
        {guid: widgetGuid, widgetGuid: widgetGuid},
        function(event) {
            updateVisualization();
        }
    );
}

// Запуск
init();