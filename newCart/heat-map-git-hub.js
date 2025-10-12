// Шаг 1: Подготовка данных - группируем по дням и суммируем прибыль
var items = w.data.primaryData.items;

// Создаем объект для хранения данных по дням
var dailyData = {};

items.forEach(item => {
    var date = new Date(item.values[0]); // Дата заказа
    var profit = Number(item.values[1]); // Прибыль

    // Форматируем дату в ключ YYYY-MM-DD
    var dateKey = date.toISOString().split('T')[0];

    // Суммируем прибыль за день
    if (dailyData[dateKey]) {
        dailyData[dateKey] += profit;
    } else {
        dailyData[dateKey] = profit;
    }
});

// Шаг 2: Определяем временной интервал из данных
var allDates = Object.keys(dailyData).map(key => new Date(key));
var minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
var maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

// Округляем до понедельника для начала недели
var startDate = new Date(minDate);
startDate.setDate(startDate.getDate() - startDate.getDay() + (startDate.getDay() === 0 ? -6 : 1));

// Округляем до воскресенья для конца недели
var endDate = new Date(maxDate);
endDate.setDate(endDate.getDate() + (7 - endDate.getDay()) % 7);

// Шаг 3: Создаем массив за весь период данных
var daysData = [];

// Заполняем данные за весь период
for (var d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    var dateKey = d.toISOString().split('T')[0];
    var profit = dailyData[dateKey] || 0;

    daysData.push({
        date: new Date(d),
        profit: profit,
        dateKey: dateKey,
        dayOfWeek: d.getDay() // 0 - воскресенье, 1 - понедельник, etc.
    });
}

// Шаг 4: Определяем уровни интенсивности
function getIntensityLevel(profit, maxProfit) {
    if (profit === 0) return 0;
    if (maxProfit === 0) return 0;
    if (profit <= maxProfit * 0.25) return 1;
    if (profit <= maxProfit * 0.5) return 2;
    if (profit <= maxProfit * 0.75) return 3;
    return 4;
}

// Находим максимальную прибыль для нормализации
var maxProfit = Math.max(...Object.values(dailyData));

// Шаг 5: Группируем по неделям
var weeks = [];
var currentWeek = [];

daysData.forEach((day, index) => {
    // Если воскресенье или первый день, начинаем новую неделю
    if (day.dayOfWeek === 0 || currentWeek.length === 0) {
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }
        currentWeek = [];
    }
    currentWeek.push(day);

    // Если последний день, добавляем неделю
    if (index === daysData.length - 1 && currentWeek.length > 0) {
        weeks.push(currentWeek);
    }
});

// Шаг 6: Функции для отображения
function getColorForLevel(level) {
    var colors = [
        '#ebedf0', // Уровень 0 - нет данных
        '#9be9a8', // Уровень 1 - низкий
        '#40c463', // Уровень 2 - средний
        '#30a14e', // Уровень 3 - высокий
        '#216e39'  // Уровень 4 - очень высокий
    ];
    return colors[level] || colors[0];
}

function getMonthLabels(weeks) {
    var months = [];

    weeks.forEach(week => {
        if (week.length > 0) {
            // Берем средний день недели для более точного отображения месяца
            var middleDayIndex = Math.floor(week.length / 2);
            var middleDay = week[middleDayIndex] || week[0];
            var month = middleDay.date.toLocaleDateString('ru-RU', { month: 'short' });

            // Проверяем, нужно ли показывать месяц
            var lastMonth = months[months.length - 1];
            if (month !== lastMonth) {
                months.push(month);
            } else {
                months.push('');
            }
        }
    });

    return months;
}

function formatDateRange(start, end) {
    var startStr = start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    var endStr = end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${startStr} - ${endStr}`;
}

// Шаг 7: Создаем HTML тепловой карты
var heatmapHTML = `
<div style="
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 100%;
    margin: 0 auto;
">
    <div style="
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 16px;
    ">
        <div>
            <h3 style="margin: 0 0 4px 0; color: #333; font-size: 16px; font-weight: 600;">
                Активность продаж
            </h3>
            <div style="font-size: 12px; color: #666;">
                ${formatDateRange(minDate, maxDate)}
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; color: #666;">Меньше</span>
            ${[0, 1, 2, 3, 4].map(level => `
                <div style="
                    width: 12px;
                    height: 12px;
                    border-radius: 2px;
                    background: ${getColorForLevel(level)};
                "></div>
            `).join('')}
            <span style="font-size: 12px; color: #666;">Больше</span>
        </div>
    </div>
    
    <div style="display: flex; gap: 4px; overflow-x: auto; padding-bottom: 10px;">
        <!-- Дни недели -->
        <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 24px; flex-shrink: 0;">
            ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => `
                <div style="
                    width: 20px;
                    height: 12px;
                    font-size: 10px;
                    color: #666;
                    text-align: center;
                    line-height: 12px;
                    visibility: ${index % 2 === 0 ? 'visible' : 'hidden'};
                ">${day}</div>
            `).join('')}
        </div>
        
        <!-- Тепловая карта -->
        <div style="display: flex; gap: 4px; flex-shrink: 0;">
            ${weeks.map((week, weekIndex) => `
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    ${week.map((day, dayIndex) => {
    var level = getIntensityLevel(day.profit, maxProfit);
    var tooltip = `
                            ${day.date.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            ${day.profit > 0 ? `<br>Прибыль: ${day.profit.toFixed(2)} ₽` : '<br>Нет продаж'}
                        `;
    return `
                            <div 
                                class="heat-cell"
                                style="
                                    width: 12px;
                                    height: 12px;
                                    border-radius: 2px;
                                    background: ${getColorForLevel(level)};
                                    cursor: pointer;
                                    position: relative;
                                    border: 1px solid ${level === 0 ? '#e1e4e8' : 'transparent'};
                                "
                                title="${tooltip.replace(/<br>/g, '\n')}"
                                onmouseover="showTooltip(this, '${tooltip.replace(/'/g, "\\'")}')"
                                onmouseout="hideTooltip()"
                            ></div>
                        `;
}).join('')}
                    <!-- Добавляем пустые ячейки для неполных недель -->
                    ${Array(7 - week.length).fill().map(() => `
                        <div style="width: 12px; height: 12px; background: transparent;"></div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    </div>
    
    <!-- Месяцы -->
    <div style="
        display: flex;
        margin-left: 28px;
        margin-top: 8px;
        gap: 4px;
        flex-shrink: 0;
    ">
        ${getMonthLabels(weeks).map((month, index) => `
            <span style="
                font-size: 11px;
                color: #666;
                min-width: ${weeks[index] ? Math.max(15, weeks[index].length * 4) : 15}px;
                text-align: center;
                visibility: ${month ? 'visible' : 'hidden'};
            ">${month}</span>
        `).join('')}
    </div>
    
    <!-- Статистика -->
    <div style="
        margin-top: 20px;
        padding: 12px;
        background: #f6f8fa;
        border-radius: 6px;
        font-size: 12px;
        color: #586069;
    ">
        <strong>Статистика периода:</strong><br>
        • Всего дней с продажами: ${Object.keys(dailyData).length}<br>
        • Максимальная дневная прибыль: ${maxProfit.toFixed(2)} ₽<br>
        • Период: ${Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24))} дней
    </div>
</div>

<style>
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .tooltip {
        position: fixed;
        background: #000;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
        animation: fadeIn 0.0s ease;
        max-width: 200px;
        line-height: 1.4;
    }
</style>

<script>
    function showTooltip(element, text) {
        hideTooltip();
        var tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.innerHTML = text;
        var rect = element.getBoundingClientRect();
        tooltip.style.left = (rect.left + window.scrollX) + 'px';
        tooltip.style.top = (rect.top + window.scrollY - 50) + 'px';
        document.body.appendChild(tooltip);
    }
    
    function hideTooltip() {
        var tooltip = document.querySelector('.tooltip');
        if (tooltip) tooltip.remove();
    }
</script>
`;

// Шаг 8: Отображаем в виджете
w.general.text = heatmapHTML;
TextRender({ text: w.general, style: w.style });