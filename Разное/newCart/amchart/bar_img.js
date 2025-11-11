// === КОНФИГУРАЦИЯ ===
const widgetGuid = w.general.renderTo;
const widgetPalette = w.colors;

// === ПЕРЕМЕННЫЕ ===
let chart = null;
let currentlyHovered = null;

// === ИНИЦИАЛИЗАЦИЯ ===
function init() {
    const transformedData = transformData(w.data.primaryData.items);
    createContainer();
    render(transformedData);
}

// === ТРАНСФОРМАЦИЯ ДАННЫХ ===
function transformData(items) {
    return items.map((item, index) => {
        return {
            name: item.keys[0],
            steps: item.values[0],
            pictureSettings: {
                src: item.keys[1]
            },
            color: widgetPalette[index % widgetPalette.length]
        };
    });
}

// === СОЗДАНИЕ КОНТЕЙНЕРА ===
function createContainer() {
    const html = `<div id="customWidget-${widgetGuid}" style="width:100%;height:100%;overflow:hidden;"></div>`;
    w.general.text = html;
    TextRender({ text: w.general, style: {} });
}

// === ФУНКЦИИ ДЛЯ HOVER-ЭФФЕКТА ===
function handleHover(dataItem) {
    if (dataItem && currentlyHovered != dataItem) {
        handleOut();
        currentlyHovered = dataItem;
        var bullet = dataItem.bullets[0];
        bullet.animate({
            key: "locationY",
            to: 1,
            duration: 600,
            easing: am5.ease.out(am5.ease.cubic)
        });
    }
}

function handleOut() {
    if (currentlyHovered) {
        var bullet = currentlyHovered.bullets[0];
        bullet.animate({
            key: "locationY",
            to: 0,
            duration: 600,
            easing: am5.ease.out(am5.ease.cubic)
        });
    }
}

// === РЕНДЕРИНГ ВИЗУАЛИЗАЦИИ ===
function render(data) {
    const container = document.getElementById(`customWidget-${widgetGuid}`);

    am5.ready(function() {
        if (chart) {
            chart.dispose();
        }

        var root = am5.Root.new(`customWidget-${widgetGuid}`);
        root.setThemes([am5themes_Animated.new(root)]);

        chart = root.container.children.push(am5xy.XYChart.new(root, {
            panX: false,
            panY: false,
            wheelX: "none",
            wheelY: "none",
            paddingBottom: 50,
            paddingTop: 40,
            paddingLeft: 0,
            paddingRight: 0
        }));

        var xRenderer = am5xy.AxisRendererX.new(root, {
            minorGridEnabled: true,
            minGridDistance: 60
        });
        xRenderer.grid.template.set("visible", false);

        var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
            paddingTop: 40,
            categoryField: "name",
            renderer: xRenderer
        }));

        var yRenderer = am5xy.AxisRendererY.new(root, {});
        yRenderer.grid.template.set("strokeDasharray", [3]);

        var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
            min: 0,
            renderer: yRenderer
        }));

        var series = chart.series.push(am5xy.ColumnSeries.new(root, {
            name: "Steps",
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "steps",
            categoryXField: "name",
            sequencedInterpolation: true,
            calculateAggregates: true,
            maskBullets: false,
            tooltip: am5.Tooltip.new(root, {
                dy: -30,
                pointerOrientation: "vertical",
                labelText: "{valueY}"
            })
        }));

        series.columns.template.setAll({
            strokeOpacity: 0,
            cornerRadiusBR: 10,
            cornerRadiusTR: 10,
            cornerRadiusBL: 10,
            cornerRadiusTL: 10,
            maxWidth: 50,
            fillOpacity: 0.8
        });

        // Hover события для столбцов
        series.columns.template.events.on("pointerover", function (e) {
            handleHover(e.target.dataItem);
        });

        series.columns.template.events.on("pointerout", function (e) {
            handleOut();
        });

        var circleTemplate = am5.Template.new({});

        series.bullets.push(function (root, series, dataItem) {
            var bulletContainer = am5.Container.new(root, {});
            var circle = bulletContainer.children.push(am5.Circle.new(root, { radius: 34 }, circleTemplate));
            var maskCircle = bulletContainer.children.push(am5.Circle.new(root, { radius: 27 }));
            var imageContainer = bulletContainer.children.push(am5.Container.new(root, { mask: maskCircle }));
            var image = imageContainer.children.push(am5.Picture.new(root, {
                templateField: "pictureSettings",
                centerX: am5.p50,
                centerY: am5.p50,
                width: 60,
                height: 60
            }));
            return am5.Bullet.new(root, {
                locationY: 0,
                sprite: bulletContainer
            });
        });

        // Применяем цвета из палитры Visiology
        series.set("heatRules", [{
            dataField: "valueY",
            min: am5.color(widgetPalette[0]),
            max: am5.color(widgetPalette[widgetPalette.length - 1]),
            target: series.columns.template,
            key: "fill"
        }, {
            dataField: "valueY",
            min: am5.color(widgetPalette[0]),
            max: am5.color(widgetPalette[widgetPalette.length - 1]),
            target: circleTemplate,
            key: "fill"
        }]);

        series.data.setAll(data);
        xAxis.data.setAll(data);

        // Курсор для дополнительного hover-эффекта
        var cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
        cursor.lineX.set("visible", false);
        cursor.lineY.set("visible", false);

        cursor.events.on("cursormoved", function () {
            var dataItem = series.get("tooltip").dataItem;
            if (dataItem) {
                handleHover(dataItem);
            } else {
                handleOut();
            }
        });

        series.appear();
        chart.appear(1000, 100);
    });
}

// === ЗАПУСК ===
init();