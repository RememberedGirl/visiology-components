# DataGrid Widget for Visiology

Виджет-таблица на основе DevExtreme DataGrid.

<img src="DataGrid.png" width="200" alt="DataGrid Widget">

**Минимально работоспособный код для запуска в Visiology.**

Смело копируйте и вставляйте в текстовый виджет - этот код запустится и покажет работающую таблицу.
Весь остальной код в репозитории - это вспомогательные функции и настройки,
которые строятся вокруг этой базовой реализации.

```javascript

// Тестовые данные
// В реальном виджете данные будут браться из w.data
const data = [
    { id: 1, name: "Иван", age: 25, city: "Москва" },
    { id: 2, name: "Мария", age: 30, city: "Санкт-Петербург" },
    { id: 3, name: "Петр", age: 28, city: "Казань" }
];

// Создание таблицы
$("#" + w.general.renderTo).dxDataGrid({
    dataSource: data,
    columns: ["id", "name", "age", "city"],
});

```


<br>
  

📚 [Официальная документация](https://js.devexpress.com/jQuery/Demos/WidgetsGallery/Demo/DataGrid/Overview/MaterialBlueLight/
) 