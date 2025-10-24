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

### Базовые показатели продаж

```dax
-- Суммарные продажи
TotalSales = SUM(FactOnlineSales[SalesAmount])

-- Средний чек
AverageOrderValue = AVERAGE(FactOnlineSales[SalesAmount])

-- Максимальная продажа
MaxSale = MAX(FactOnlineSales[SalesAmount])

-- Количество заказов
OrderCount = COUNTROWS(FactOnlineSales)
```

### Аналитические меры

```dax
-- Продажи с учетом скидки для региональных промоакций
DiscountedSales = 
SUMX(
    FactOnlineSales,
    IF(
        RELATED(DimPromotion[PromotionName]) IN {"North America Holiday Promotion", "Asian Summer Promotion"},
        FactOnlineSales[SalesAmount] * 0.8,
        FactOnlineSales[SalesAmount]
    )
)

-- Продажи по магазинным промоакциям
StorePromotionSales = 
CALCULATE(
    SUMX(FactOnlineSales, FactOnlineSales[SalesAmount]),
    FILTER(DimPromotion, DimPromotion[PromotionCategory] IN {"Store"})
)

-- Продажи по цветам товаров
SalesByColor = 
CALCULATE(
    SUM(FactOnlineSales[SalesAmount]),
    REMOVEFILTERS(DimProduct),
    SUMMARIZE(
        DimProduct,
        DimProduct[ColorName]
    )
)

-- Продажи высокого чека (свыше 2000)
HighValueSales = 
SUMX(
    FILTER(FactOnlineSales, FactOnlineSales[SalesAmount] > 2000),
    FactOnlineSales[SalesAmount]
)
```

### Временные периоды

```dax
-- Продажи за январь
JanuarySales = 
CALCULATE(
    SUM(FactOnlineSales[SalesAmount]),
    FILTER(DimDate, DimDate[Month] = 1)
)

-- Продажи за 1 квартал
Q1Sales = 
CALCULATE(
    SUM(FactOnlineSales[SalesAmount]),
    FILTER(DimDate, DimDate[Quarter] = 1)
)
```

### KPI и индикаторы

```dax
-- Индикатор магазинов с высокими продажами
HighSalesIndicator = 
SUMX(
    SUMMARIZE(FactOnlineSales, FactOnlineSales[StoreKey]),
    CALCULATE(IF(SUM(FactOnlineSales[OrderAmount]) > 50000000, 1, 0))
)
```

## Документация

### Назначение мер

1. **TotalSales** - Базовая метрика общего объема продаж
2. **DiscountedSales** - Продажи с применением 20% скидки для региональных акций
3. **StorePromotionSales** - Продажи только по магазинным промоакциям
4. **SalesByColor** - Анализ продаж по цветовой гамме товаров
5. **HighValueSales** - Сумма крупных продаж (свыше 2000 у.е.)
6. **JanuarySales/Q1Sales** - Продажи за конкретные временные периоды
7. **HighSalesIndicator** - Индикатор магазинов с экстремально высокими продажами


