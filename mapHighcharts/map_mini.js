var categories = w.data.primaryData.items.map(e => e.values[0]);
var data = w.data.primaryData.items.map(e => ({
    value: e.values[1],
    "hc-key": e.values[0]
}));
var name = w.data.primaryData.items[0].cols[0];
createSquareMap(name, categories);

w.general.text = `<div id="${name}"></div>`;
TextRender({text: w.general, style: {}});

Highcharts.mapChart(name, {
    chart: {map: name},
    colorAxis: {min: 0},
    series: [{
        data: data,
        name: name,
        dataLabels: {enabled: true, format: '{point.hc-key}'}
    }]
});


function createSquareMap(name, categories) {
    const n = Math.ceil(Math.sqrt(categories.length));
    if (!Highcharts.maps) Highcharts.maps = {};

    Highcharts.maps[name] = {
        type: "FeatureCollection",
        features: categories.map((category, i) => {
            const x = (i % n) * 100;
            const y = Math.floor(i / n) * 100;
            return {
                type: "Feature",
                properties: {"hc-key": category},
                geometry: {
                    type: "Polygon",
                    coordinates: [[[x, y], [x+100, y], [x+100, y+100], [x, y+100], [x, y]]]
                }
            };
        })
    };
}