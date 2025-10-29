// Данные из Visiology
const items = w.data.primaryData.items;
const keys = items[0].cols.slice(items[0].keys.length); // верная запись

// Создаем иерархическую структуру данных
function buildHierarchy(items) {
    const root = { name: 'root', children: [] };
    const levelMap = {};

    items.forEach(item => {
        let currentLevel = root;

        // Проходим по всем уровням иерархии
        item.formattedKeys.forEach((key, levelIndex) => {
            const path = item.formattedKeys.slice(0, levelIndex + 1);
            const pathString = path.join(' - ');

            if (!levelMap[pathString]) {
                const newNode = {
                    name: key,
                    value: levelIndex === item.formattedKeys.length - 1 ? item.values[0] : 0,
                    path: path, // храним как массив
                    pathString: pathString,
                    children: []
                };

                levelMap[pathString] = newNode;
                currentLevel.children.push(newNode);
            }

            currentLevel = levelMap[pathString];

            // Для конечного узла добавляем значение
            if (levelIndex === item.formattedKeys.length - 1) {
                currentLevel.value = item.values[0];
            }
        });
    });

    // Вычисляем значения для родительских узлов (сумма дочерних)
    function calculateParentValues(node) {
        if (node.children && node.children.length > 0) {
            node.value = node.children.reduce((sum, child) => {
                return sum + (calculateParentValues(child) || 0);
            }, 0);
        }
        return node.value || 0;
    }

    calculateParentValues(root);
    return root.children;
}

// Получаем текущий фильтр
let currentFilter = visApi().getSelectedValues(w.general.renderTo).map(e => e.join(' - '))[0];

// Строим иерархию
const hierarchyData = buildHierarchy(items);

// Настройки визуализации
const treemapOption = {
    series: [{
        type: 'treemap',
        data: hierarchyData,
        levels: [
            {
                itemStyle: {
                    borderColor: '#555',
                    borderWidth: 2,
                    gapWidth: 2
                }
            },
            {
                itemStyle: {
                    borderColor: '#777',
                    borderWidth: 1,
                    gapWidth: 1
                }
            },
            {
                itemStyle: {
                    borderColor: '#999'
                }
            }
        ],
        roam: false,
        nodeClick: false,
        breadcrumb: {
            show: true,
            formatter: function(params) {
                // Убираем разделитель по умолчанию и используем пробел
                return params.name;
            }
        },
        label: {
            show: true,
            formatter: function(params) {
                return params.name;
            }
        },
        upperLabel: {
            show: true,
            height: 30,
            backgroundColor: 'rgba(0,0,0,0.3)',
            color: '#fff',
            formatter: function(params) {
                // Показываем полный путь через пробелы вместо '/'
                return params.treePathInfo.map(t => t.name).join(' ');
            }
        }
    }]
};

// Создаем контейнер для графика
const html = `<div id="treemap-${w.general.renderTo}" style="width:100%; height:100%;"></div>`;
TextRender({ text: { ...w.general, text: html }, style: {} });

// Инициализируем treemap
const chart = echarts.init(document.getElementById(`treemap-${w.general.renderTo}`));
chart.setOption(treemapOption);

// Обработчик клика
chart.on('click', function(params) {
    // Фильтруем только по конечным узлам (листьям)
    console.log('click',params )
    if (params.data.path && params.data.path.length) {
        let category = [];

        if (currentFilter !== params.data.pathString) {
            // Преобразуем путь в формат для фильтра: [['Уровень1'],['Уровень2'],...,['Уровеньn']]
            category = [params.data.path];
        }

        visApi().setFilterSelectedValues(w.general.renderTo, category);
        // visApi().setFilterSelectedValues('120888d4c1524498a8c96a048ce5d6c9', category);
    }
});

// Слушаем изменения фильтра
visApi().onSelectedValuesChangedListener(
    {guid: w.general.renderTo, widgetGuid: w.general.renderTo},
    function(event) {
        currentFilter = event.selectedValues ?
            event.selectedValues.map(e => e.join(' - '))[0] : '';

        // Функция для обновления стилей с учетом фильтра
        function updateItemStyle(data) {
            return data.map(item => {
                const isSelected = currentFilter === item.pathString;

                return {
                    ...item,
                    itemStyle: {
                        borderWidth: isSelected ? 3 :
                            item.children && item.children.length > 0 ? 2 : 1,
                        borderColor: isSelected ? '#ff0000' :
                            item.children && item.children.length > 0 ? '#555' : '#000'
                    },
                    children: item.children ? updateItemStyle(item.children) : undefined
                };
            });
        }

        // Обновляем границы
        chart.setOption({
            series: [{
                data: updateItemStyle(hierarchyData)
            }]
        });
    }
);

// Адаптация к изменению размера
window.addEventListener('resize', function() {
    chart.resize();
});