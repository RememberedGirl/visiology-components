## КРИТИЧЕСКИЕ ОСОБЕННОСТИ VISIOLOGY:

### 1. Структура данных (w объект):
```javascript
// w.data.primaryData.items имеет СЛОЖНУЮ СТРУКТУРУ:
- keys: Array - измерения любой вложенности (например: ["Регион"], ["Регион", "Город"], ["Регион", "Город", "Клиент"])
- values: Array - числовые метрики (любое количество)
- formattedKeys: Array - форматированные названия для отображения
- formattedValues: Array - форматированные значения для отображения  
- cols: Array - полный список колонок (измерения + метрики)
- metadata: Array - описание метрик (dataType, columnType)
```

### 2. Паттерн работы с фильтрами:
```javascript
// GET → SET → LISTEN паттерн:
const widgetGuid = w.general.renderTo;
let currentFilter = '';

// 1. GET - один раз при загрузке
const initialFilters = visApi().getSelectedValues(widgetGuid);
currentFilter = initialFilters?.[0]?.join(' - ') || '';

// 2. SET - при действии пользователя - ВАЖНО: всегда передавать keys!
function handleClick(item) {
    // item.keys - ОБЯЗАТЕЛЬНО использовать для фильтра
    const filterToSet = currentFilter === item.formattedKeys.join(' - ') ? [] : [item.keys];
    visApi().setFilterSelectedValues(widgetGuid, filterToSet);
}

// 3. LISTEN - для обновлений UI
visApi().onSelectedValuesChangedListener(
    {guid: widgetGuid + '-listener', widgetGuid: widgetGuid},
    (event) => {
        currentFilter = event.selectedValues?.[0]?.join(' - ') || '';
        updateVisualization();
    }
);
```

### 3. Форматы фильтров:
```javascript
// Одиночный фильтр - ПЕРЕДАВАТЬ keys!
visApi().setFilterSelectedValues("widget-123", [["North"]]);

// Множественный выбор - ПЕРЕДАВАТЬ keys!
visApi().setFilterSelectedValues("widget-123", [["North"], ["South"]]);

// Иерархический фильтр - ПЕРЕДАВАТЬ полный путь keys!
visApi().setFilterSelectedValues("widget-123", [["North", "Chicago", "Customer1"]]);

// Очистка фильтра
visApi().setFilterSelectedValues("widget-123", []);
```

### 4. Создание контейнера:
```javascript
// Уникальный контейнер для избежания конфликтов:
w.general.text = `<div id="widget-${w.general.renderTo}" style="width:100%; height:100%;"></div>`;
TextRender({ text: w.general, style: {} });

// Использовать: document.getElementById(`widget-${w.general.renderTo}`)
```

## ВХОДНЫЕ ДАННЫЕ ДЛЯ ГЕНЕРАЦИИ:

### 1. Библиотека визуализации:
ECharts

### 2. Тип визуализации:
treemap

### 3. Абстрактный пример визуализации (НЕ привязанный к данным):
```javascript
myChart.showLoading();
$.get(ROOT_PATH + '/data/asset/data/disk.tree.json', function (diskData) {
  myChart.hideLoading();
  function getLevelOption() {
    return [
      {
        itemStyle: {
          borderColor: '#777',
          borderWidth: 0,
          gapWidth: 1
        },
        upperLabel: {
          show: false
        }
      },
      {
        itemStyle: {
          borderColor: '#555',
          borderWidth: 5,
          gapWidth: 1
        },
        emphasis: {
          itemStyle: {
            borderColor: '#ddd'
          }
        }
      },
      {
        colorSaturation: [0.35, 0.5],
        itemStyle: {
          borderWidth: 5,
          gapWidth: 1,
          borderColorSaturation: 0.6
        }
      }
    ];
  }
  myChart.setOption(
    (option = {
      title: {
        text: 'Disk Usage',
        left: 'center'
      },
      tooltip: {
        formatter: function (info) {
          var value = info.value;
          var treePathInfo = info.treePathInfo;
          var treePath = [];
          for (var i = 1; i < treePathInfo.length; i++) {
            treePath.push(treePathInfo[i].name);
          }
          return [
            '<div class="tooltip-title">' +
              echarts.format.encodeHTML(treePath.join('/')) +
              '</div>',
            'Disk Usage: ' + echarts.format.addCommas(value) + ' KB'
          ].join('');
        }
      },
      series: [
        {
          name: 'Disk Usage',
          type: 'treemap',
          visibleMin: 300,
          label: {
            show: true,
            formatter: '{b}'
          },
          upperLabel: {
            show: true,
            height: 30
          },
          itemStyle: {
            borderColor: '#fff'
          },
          levels: getLevelOption(),
          data: diskData
        }
      ]
    })
  );
});
```

### 4. Преобразование данных (АБСТРАКТНОЕ):

- Любое количество measurements (keys) вложенные сегменты
- Любое количество metrics (values)
- Любая вложенность иерархии

### 5. Интерактивность:
- Кликабельные элементы: [какие?]
- Визуальное выделение: [как?]
- Toggle логика: [да/нет]

## ТРЕБУЕМЫЙ ВЫВОД:
Полный код виджета Visiology с поддержкой ЛЮБОЙ структуры данных и соблюдением ВСЕХ особенностей платформы.
