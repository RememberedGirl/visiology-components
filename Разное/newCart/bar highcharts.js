const widgetGuid = w.general.renderTo;
let chart = null;

function init() {
    renderUI();
    setupFilterListener();
}

function handleUserAction(item) {
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);
    const newFilter = item.formattedKeys.join(' - ');
    const filterToSet = currentFilter === newFilter ? [] : [item.formattedKeys];
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

function renderUI() {
    const items = w.data.primaryData.items;
    const currentFilters = visApi().getSelectedValues(widgetGuid);
    const currentFilter = formatFilter(currentFilters);

    const container = document.getElementById(widgetGuid);
    container.innerHTML = `<div id="chart-${widgetGuid}" style="width:100%;height:100%"></div>`;

    const series = items[0].metadata.map((meta, idx) => ({
        name: meta.displayName,
        data: items.map(item => {
            const fullPath = item.formattedKeys.join(' - ');
            const isSelected = currentFilter === fullPath;
            return {
                name: fullPath,
                y: item.values[idx],
                color: isSelected ? '#ff0000' : w.colors[idx % w.colors.length],
                item: item
            };
        })
    }));

    chart = Highcharts.chart(`chart-${widgetGuid}`, {
        chart: { type: 'bar' },
        xAxis: {
            categories: items.map(item => item.formattedKeys.join(' - ')),
            axisTick: { show: false }
        },
        tooltip: {
            shared: true,
            useHTML: true,
            formatter: function() {
                return this.points.map(point =>
                    `<b>${point.series.name}</b>: ${point.y}`
                ).join('<br>');
            }
        },
        series: series,
        plotOptions: {
            bar: {
                point: {
                    events: {
                        click: function() {
                            if (this.item) handleUserAction(this.item);
                        }
                    }
                }
            }
        }
    });
}

function setupFilterListener() {
    visApi().onSelectedValuesChangedListener(
        {guid: widgetGuid, widgetGuid: widgetGuid},
        function(event) {
            const currentFilter = formatFilter(event.selectedValues);
            updateSelection(currentFilter);
        }
    );
}

function updateSelection(currentFilter) {
    if (!chart) return;

    const items = w.data.primaryData.items;

    chart.series.forEach((series, seriesIndex) => {
        series.data.forEach((point, pointIndex) => {
            const item = items[pointIndex];
            const fullPath = item.formattedKeys.join(' - ');
            const isSelected = currentFilter === fullPath;

            point.update({
                color: isSelected ? '#ff0000' : w.colors[seriesIndex % w.colors.length]
            }, false);
        });
    });

    chart.redraw();
}

function formatFilter(selectedValues) {
    return selectedValues && selectedValues.length > 0 ? selectedValues[0].join(' - ') : '';
}

init();