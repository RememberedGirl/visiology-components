## Модель данных и DAX-меры для Visiology

### Модель данных

```sql
-- Таблица фактов: fact_room_assignees
history_id (PK)
room_id (FK -> dim_rooms)
assignee_id (FK -> dim_assignees)
start_date (date)
end_date (date)

-- Таблица фактов: fact_room_statuses  
history_id (PK)
room_id (FK -> dim_rooms)
status_id (FK -> dim_statuses)
rental_id (FK -> dim_rentals)
start_date (date)
end_date (date)

-- Таблица измерений: dim_assignees
assignee_id (PK)
full_name (varchar)

-- Таблица измерений: dim_rentals
rental_id (PK)
room_id (FK -> dim_rooms)
tenant_name (varchar)
start_date (date)
end_date (date)

-- Таблица измерений: dim_rooms
room_id (PK)
name (varchar)

-- Таблица измерений: dim_statuses
status_id (PK)
status_name (varchar)
```
