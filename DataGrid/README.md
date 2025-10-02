# DataGrid Widget for Visiology

Виджет-таблица на основе DevExtreme DataGrid.


```javascript

// Тестовые данные
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
