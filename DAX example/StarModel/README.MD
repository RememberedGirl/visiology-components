Вот исправленный DAX с учетом того, что все названия в модели написаны строчными буквами:

## Модель данных и DAX-меры для Visiology

### Модель данных

```sql
-- Таблица фактов: factonlinesales
factonlinesales_key (PK)
datekey (FK -> dimdate)
productkey (FK -> dimproduct)
promotionkey (FK -> dimpromotion)
storekey (FK -> dimstore)
salesamount (decimal)
orderamount (decimal)
orderquantity (int)

-- Таблица измерений: dimpromotion
promotionkey (PK)
promotionname (varchar)
promotioncategory (varchar)
discountpercent (decimal)

-- Таблица измерений: dimproduct
productkey (PK)
productname (varchar)
colorname (varchar)
category (varchar)

-- Таблица измерений: dimdate
datekey (PK)
date (date)
month (int)
quarter (int)
year (int)

-- Таблица измерений: dimstore
storekey (PK)
storename (varchar)
region (varchar)
country (varchar)
```

## DAX-меры

### Агрегационные функции
Что делают: Выполняют простую агрегацию по столбцу в текущем контексте фильтра.

```dax
-- Суммарные продажи
TotalSales = SUM(factonlinesales[salesamount])

-- Средний чек
AverageOrderValue = AVERAGE(factonlinesales[salesamount])

-- Максимальная продажа
MaxSale = MAX(factonlinesales[salesamount])

-- Количество заказов
OrderCount = COUNTROWS(factonlinesales)
```
## X-функции 
(SUMX, AVERAGEX, MAXX, COUNTX, etc.)
Что делают: Выполняют построчные вычисления по таблице, затем агрегируют результат.

Продажи высокого чека (свыше 2000) - построчная проверка
```dax
HighValueSales = 
SUMX(
    FILTER(factonlinesales, factonlinesales[salesamount] > 2000),
    factonlinesales[salesamount]
)
```
-- Продажи с учетом скидки - построчный расчет
```dax


DiscountedSales = 
SUMX(
    factonlinesales,
    IF(
        RELATED(dimpromotion[promotionname]) IN {"North America Holiday Promotion", "Asian Summer Promotion"},
        factonlinesales[salesamount] * 0.8,
        factonlinesales[salesamount]
    )
)
```


-- Общая сумма заказов (количество × цена)
```dax
TotalOrderValue = 
SUMX(
    factonlinesales,
    factonlinesales[orderquantity] * factonlinesales[salesamount]
)
```





### CALCULATE
Что делает: Вычисляет выражение в измененном контексте фильтра.

Ключевые отличия Visiology от Power BI

❌ ОШИБКА!
```dax
JanuarySales = CALCULATE(
    SUM(factonlinesales[salesamount]),
    dimdate[month] = 1 
)
```

Обязательно через FILTER
✅ ПРАВИЛЬНО
```dax

JanuarySales = CALCULATE(
    SUM(factonlinesales[salesamount]),
    FILTER(dimdate, dimdate[month] = 1)  
)
```


Синтаксис CALCULATE в Visiology
```js

CALCULATE(
    Выражение,
    FILTER(Таблица1, Условие1),
    FILTER(Таблица2, Условие2),
    REMOVEFILTERS(Таблица3)
)

```


Продажи по магазинным промоакциям
```dax
StorePromotionSales = 
CALCULATE(
    SUM(factonlinesales[salesamount]),
    FILTER(dimpromotion, dimpromotion[promotioncategory] IN {"Store"})
)
```
Продажи по цветам товаров
```dax
SalesByColor = 
CALCULATE(
    SUM(factonlinesales[salesamount]),
    REMOVEFILTERS(dimproduct),
    SUMMARIZE(
        dimproduct,
        dimproduct[colorname]
    )
)
```
Продажи высокого чека (свыше 2000)
```dax
HighValueSales = 
SUMX(
    FILTER(factonlinesales, factonlinesales[salesamount] > 2000),
    factonlinesales[salesamount]
)
```
Продажи за январь
```dax
JanuarySales = 
CALCULATE(
    SUM(factonlinesales[salesamount]),
    FILTER(dimdate, dimdate[month] = 1)
)
```
Продажи за 1 квартал

```dax
Q1Sales = 
CALCULATE(
    SUM(factonlinesales[salesamount]),
    FILTER(dimdate, dimdate[quarter] = 1)
)
```

### SUMMARIZE

Индикатор магазинов с высокими продажами

```dax
HighSalesIndicator = 
SUMX(
    SUMMARIZE(factonlinesales, factonlinesales[storekey]),
    IF(SUM(factonlinesales[quantity]) > 50000000, 1, 0)
)
```

### RELATED

Продажи с учетом скидки для региональных промоакций
```dax
DiscountedSales = 
SUMX(
    factonlinesales,
    IF(
        RELATED(dimpromotion[promotionname]) IN {"North America Holiday Promotion", "Asian Summer Promotion"},
        factonlinesales[salesamount] * 0.8,
        factonlinesales[salesamount]
    )
)
```

### REMOVEFILTERS

Продажи без фильтра по товарам
```dax
SalesAllProducts = 
CALCULATE(
    SUM(factonlinesales[salesamount]),
    REMOVEFILTERS(dimproduct)
)
```



