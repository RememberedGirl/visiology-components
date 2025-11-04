# Модель данных и примеры DAX функций для Visiology

## Модель данных (SQL формат)

```sql
-- Таблица фактов: fact_sales
CREATE TABLE fact_sales (
    sale_id INT PRIMARY KEY,
    date_key INT,
    product_key INT,
    store_key INT,
    customer_key INT,
    promotion_key INT,
    sales_amount DECIMAL(10,2),
    sales_quantity INT,
    unit_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
    FOREIGN KEY (product_key) REFERENCES dim_product(product_key),
    FOREIGN KEY (store_key) REFERENCES dim_store(store_key),
    FOREIGN KEY (customer_key) REFERENCES dim_customer(customer_key),
    FOREIGN KEY (promotion_key) REFERENCES dim_promotion(promotion_key)
);

-- Таблица измерений: dim_date
CREATE TABLE dim_date (
    date_key INT PRIMARY KEY,
    full_date DATE,
    year INT,
    quarter INT,
    month INT,
    month_name VARCHAR(20),
    day_of_week INT,
    is_weekend BOOLEAN
);

-- Таблица измерений: dim_product
CREATE TABLE dim_product (
    product_key INT PRIMARY KEY,
    product_name VARCHAR(100),
    category VARCHAR(50),
    subcategory VARCHAR(50),
    brand_name VARCHAR(50),
    color_name VARCHAR(30),
    unit_cost DECIMAL(10,2)
);

-- Таблица измерений: dim_store
CREATE TABLE dim_store (
    store_key INT PRIMARY KEY,
    store_name VARCHAR(100),
    region VARCHAR(50),
    country VARCHAR(50),
    city VARCHAR(50),
    store_type VARCHAR(30)
);

-- Таблица измерений: dim_customer
CREATE TABLE dim_customer (
    customer_key INT PRIMARY KEY,
    customer_name VARCHAR(100),
    customer_type VARCHAR(30),
    city VARCHAR(50),
    country VARCHAR(50),
    registration_date DATE
);

-- Таблица измерений: dim_promotion
CREATE TABLE dim_promotion (
    promotion_key INT PRIMARY KEY,
    promotion_name VARCHAR(100),
    promotion_category VARCHAR(50),
    discount_percent DECIMAL(5,2),
    start_date DATE,
    end_date DATE
);
```

---

## Примеры использования DAX функций в Visiology

### 1. SUM / SUMX

#### SUM - простая сумма столбца
```dax
TotalSales = SUM(fact_sales[sales_amount])
```

#### SUMX - построчное вычисление, затем сумма
```dax
TotalRevenue = 
SUMX(
    fact_sales,
    fact_sales[sales_quantity] * fact_sales[unit_price]
)
```

```dax
SalesWithDiscount = 
SUMX(
    fact_sales,
    fact_sales[sales_amount] - fact_sales[discount_amount]
)
```

---

### 2. MAX / MAXX

#### MAX - максимальное значение в столбце
```dax
MaxSaleAmount = MAX(fact_sales[sales_amount])
```

#### MAXX - максимум от вычисления для каждой строки
```dax
MaxProfitPerSale = 
MAXX(
    fact_sales,
    (fact_sales[unit_price] - RELATED(dim_product[unit_cost])) * fact_sales[sales_quantity]
)
```

```dax
MostRecentPromotionName = 
MAXX(
    FILTER(
        fact_sales,
        fact_sales[date_key] = MAX(fact_sales[date_key])
    ),
    RELATED(dim_promotion[promotion_name])
)
```

---

### 3. MIN / MINX

#### MIN - минимальное значение в столбце
```dax
MinSaleAmount = MIN(fact_sales[sales_amount])
```

#### MINX - минимум от вычисления для каждой строки
```dax
MinProfitPerSale = 
MINX(
    fact_sales,
    (fact_sales[unit_price] - RELATED(dim_product[unit_cost])) * fact_sales[sales_quantity]
)
```

---

### 4. AVERAGE / AVERAGEX

#### AVERAGE - среднее значение столбца
```dax
AvgSaleAmount = AVERAGE(fact_sales[sales_amount])
```

#### AVERAGEX - среднее от построчного вычисления
```dax
AvgPricePerUnit = 
AVERAGEX(
    fact_sales,
    fact_sales[sales_amount] / fact_sales[sales_quantity]
)
```

```dax
AvgDiscountRate = 
AVERAGEX(
    fact_sales,
    fact_sales[discount_amount] / fact_sales[sales_amount]
)
```

---

### 5. COUNT / COUNTX

#### COUNT - подсчет непустых значений в столбце
```dax
SalesTransactionCount = COUNT(fact_sales[sale_id])
```

#### COUNTX - подсчет строк в таблице/выражении
```dax
HighValueSalesCount = 
COUNTX(
    FILTER(fact_sales, fact_sales[sales_amount] > 1000),
    fact_sales[sale_id]
)
```

---

### 6. DISTINCTCOUNT

```dax
UniqueCustomerCount = DISTINCTCOUNT(fact_sales[customer_key])
```

```dax
UniqueProductsSold = DISTINCTCOUNT(fact_sales[product_key])
```

```dax
UniqueStoresWithSales = DISTINCTCOUNT(fact_sales[store_key])
```

---

### 7. DISTINCTCOUNTNOBLANK

```dax
UniquePromotionsUsed = DISTINCTCOUNTNOBLANK(fact_sales[promotion_key])
```

---

### 8. COUNTROWS

```dax
TotalTransactions = COUNTROWS(fact_sales)
```

```dax
ActiveStoresCount = 
COUNTROWS(
    FILTER(
        dim_store,
        CALCULATE(COUNTROWS(fact_sales)) > 0
    )
)
```

---

### 9. CALCULATE

```dax
SalesInEurope = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(dim_store, dim_store[region] = "Europe")
)
```

```dax
Q1Sales = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(dim_date, dim_date[quarter] = 1)
)
```

```dax
ElectronicsSales = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(dim_product, dim_product[category] = "Electronics")
)
```

---

### 10. FILTER

```dax
HighValueSales = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(fact_sales, fact_sales[sales_amount] > 5000)
)
```

```dax
WeekendSales = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(dim_date, dim_date[is_weekend] = TRUE)
)
```

```dax
PremiumProductSales = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(dim_product, dim_product[unit_cost] > 100)
)
```

---

### 12. RELATED

```dax
SalesWithProductName = 
SUMX(
    fact_sales,
    IF(
        RELATED(dim_product[category]) = "Electronics",
        fact_sales[sales_amount] * 1.1,
        fact_sales[sales_amount]
    )
)
```

```dax
SalesWithBrandBonus = 
SUMX(
    fact_sales,
    IF(
        RELATED(dim_product[brand_name]) IN {"Apple", "Samsung"},
        fact_sales[sales_amount] * 1.05,
        fact_sales[sales_amount]
    )
)
```

```dax
RegionalSalesAdjustment = 
SUMX(
    fact_sales,
    IF(
        RELATED(dim_store[region]) = "Asia",
        fact_sales[sales_amount] * 0.95,
        fact_sales[sales_amount]
    )
)
```

---

### 11. REMOVEFILTERS

```dax
PercentOfTotalSales = 
DIVIDE(
    SUM(fact_sales[sales_amount]),
    CALCULATE(
        SUM(fact_sales[sales_amount]),
        REMOVEFILTERS(dim_store)
    )
)
```

```dax
SalesVsAllProducts = 
DIVIDE(
    SUM(fact_sales[sales_amount]),
    CALCULATE(
        SUM(fact_sales[sales_amount]),
        REMOVEFILTERS(dim_product)
    )
)
```

```dax
SalesAllTime = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    REMOVEFILTERS(dim_date)
)
```



---

### 13. ALL

```dax
SalesAllRegions = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    ALL(dim_store)
)
```

```dax
SalesSpecificCategories = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        ALL(dim_product),
        dim_product[category] IN {"Electronics", "Computers"}
    )
)
```

```dax
TotalProductCount = 
COUNTROWS(ALL(dim_product)) 
```

---

### 14. SUMMARIZE

```dax
SalesByColor = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    REMOVEFILTERS(dim_product),
    SUMMARIZE(dim_product, dim_product[color_name])
)
```

```dax
SalesByRegion = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    REMOVEFILTERS(dim_store),
    SUMMARIZE(dim_store, dim_store[region])
)
```

```dax
SalesByCategory = 
SUMX(
    SUMMARIZE(fact_sales, fact_sales[product_key]),
    CALCULATE(SUM(fact_sales[sales_amount]))
)
```

---

### 15. NOT / NOT IN

```dax
SalesExcludingElectronics = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        dim_product,
        NOT(dim_product[category] = "Electronics")
    )
)
```

```dax
SalesExcludingBrands = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        dim_product,
        NOT(dim_product[brand_name] IN {"Apple", "Samsung"})
    )
)
```

```dax
WeekdaySales = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(dim_date, NOT(dim_date[is_weekend] = TRUE))
)
```

---

### 16. IF

```dax
SalesWithConditionalBonus = 
SUMX(
    fact_sales,
    IF(
        fact_sales[sales_amount] >= 1000,
        fact_sales[sales_amount] * 1.1,
        fact_sales[sales_amount]
    )
)
```

```dax
CategoryDiscount = 
SUMX(
    fact_sales,
    IF(
        RELATED(dim_product[category]) = "Clothing",
        fact_sales[sales_amount] * 0.9,
        fact_sales[sales_amount]
    )
)
```

```dax
SeasonalAdjustment = 
SUMX(
    fact_sales,
    IF(
        RELATED(dim_date[quarter]) = 4,
        fact_sales[sales_amount] * 1.2,
        fact_sales[sales_amount]
    )
)
```

---

### 17. AND (&&)

```dax
PremiumElectronicsSales = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        dim_product,
        AND(
            dim_product[category] = "Electronics",
            dim_product[unit_cost] > 500
        )
    )
)
```

```dax
HighValueWeekendSales = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        fact_sales,
        AND(
            fact_sales[sales_amount] > 2000,
            RELATED(dim_date[is_weekend]) = TRUE
        )
    )
)
```

```dax
Q4HighSales = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        fact_sales,
        AND(
            RELATED(dim_date[quarter]) = 4,
            fact_sales[sales_amount] > 1000
        )
    )
)
```

---

### 18. OR (||)

```dax
ElectronicsOrComputersSales = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        dim_product,
        OR(
            dim_product[category] = "Electronics",
            dim_product[category] = "Computers"
        )
    )
)
```

```dax
AppleOrSamsungSales = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        dim_product,
        OR(
            dim_product[brand_name] = "Apple",
            dim_product[brand_name] = "Samsung"
        )
    )
)
```

```dax
HighOrLowValueSales = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        fact_sales,
        OR(
            fact_sales[sales_amount] > 5000,
            fact_sales[sales_amount] < 100
        )
    )
)
```

---

### 19. ISBLANK

```dax
SalesWithPromotion = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        fact_sales,
        NOT(ISBLANK(fact_sales[promotion_key]))
    )
)
```

```dax
SalesWithoutPromotion = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        fact_sales,
        ISBLANK(fact_sales[promotion_key])
    )
)
```

```dax
ProductsWithColor = 
CALCULATE(
    COUNTROWS(dim_product),
    FILTER(
        dim_product,
        NOT(ISBLANK(dim_product[color_name]))
    )
)
```

---

### 20. USERELATIONSHIP

```dax
SalesByPromotionStartDate = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    USERELATIONSHIP(fact_sales[date_key], dim_promotion[start_date])
)
```

```dax
SalesByPromotionEndDate = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    USERELATIONSHIP(fact_sales[date_key], dim_promotion[end_date])
)
```

---

### 21. CONCATENATE

```dax
ProductFullName = 
CONCATENATE(
    MIN(dim_product[brand_name]),
    CONCATENATE(" - ", MIN(dim_product[product_name]))
)
```

```dax
StoreLocation = 
CONCATENATE(
    MIN(dim_store[city]),
    CONCATENATE(", ", MIN(dim_store[country]))
)
```

```dax
DateQuarterLabel = 
CONCATENATE(
    MIN(dim_date[year]),
    CONCATENATE(" Q", MIN(dim_date[quarter]))
)
```

---

### 22. CONTAINSSTRING

```dax
SalesContosoBrand = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        dim_product,
        CONTAINSSTRING(dim_product[brand_name], "Contoso")
    )
)
```

```dax
StoresInNewYork = 
CALCULATE(
    COUNTROWS(dim_store),
    FILTER(
        dim_store,
        CONTAINSSTRING(dim_store[city], "New York")
    )
)
```

```dax
PromotionsWithHoliday = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        dim_promotion,
        CONTAINSSTRING(dim_promotion[promotion_name], "Holiday")
    )
)
```

---

## Комплексные примеры

### Пример 1: Доля продаж региона с учетом категории

```dax
RegionCategoryShare = 
DIVIDE(
    SUM(fact_sales[sales_amount]),
    CALCULATE(
        SUM(fact_sales[sales_amount]),
        REMOVEFILTERS(dim_store),
        SUMMARIZE(dim_product, dim_product[category])
    )
)
```

### Пример 2: Продажи с множественными условиями

```dax
ComplexSales = 
CALCULATE(
    SUM(fact_sales[sales_amount]),
    FILTER(
        fact_sales,
        AND(
            AND(
                fact_sales[sales_amount] > 1000,
                RELATED(dim_product[category]) = "Electronics"
            ),
            OR(
                RELATED(dim_store[region]) = "Europe",
                RELATED(dim_store[region]) = "Asia"
            )
        )
    )
)
```

### Пример 3: Средний чек с промоакцией

```dax
AvgCheckWithPromo = 
DIVIDE(
    CALCULATE(
        SUMX(
            fact_sales,
            fact_sales[sales_amount] * (1 - RELATED(dim_promotion[discount_percent]) / 100)
        )
    ),
    CALCULATE(
        DISTINCTCOUNT(fact_sales[sale_id])
    )
)
```