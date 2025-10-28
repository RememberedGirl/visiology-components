TextRender({text: w.general, style: w.style});




// Конфигурация дашбордов с метаданными
const dashboardConfig = {
    'analytics_dashboard': {
        title: 'Аналитический дашборд',
        description: 'Основные показатели эффективности компании',
        dashboardUrl: 'https://bi.company.com/dashboard/analytics',
        categoryColor: '#0032CB'
    },
    'sales_dashboard': {
        title: 'Дашборд продаж',
        description: 'Мониторинг продаж и воронки конверсии',
        dashboardUrl: 'https://bi.company.com/dashboard/sales',
        categoryColor: '#7C28E3'
    }
    // Добавляйте новые дашборды здесь
};


// Запуск рендеринга
renderDashboardCatalog();


// Получение доступных дашбордов на основе ролей пользователя
function getAvailableDashboards() {
    const sessionKey = 'oidc.user:' + document.location.origin + '/v3/keycloak/realms/Visiology:dashboard_viewer';
    const userRoles = sessionStorage[sessionKey] ? JSON.parse(sessionStorage[sessionKey]).profile.roles || [] : [];


    // Логика определения доступных дашбордов по ролям
    return userRoles.includes('globaladmin') ? Object.keys(dashboardConfig) :
        Object.keys(dashboardConfig).filter(key => userRoles.includes(`Доступ к ${key}`));
}


// Рендеринг каталога
function renderDashboardCatalog() {
    const dashboards = getAvailableDashboards();
    const gridCols = dashboards.length <= 4 ? 1 : dashboards.length <= 8 ? 2 : 3;


    if (!dashboards.length) {
        document.getElementById(w.general.renderTo).innerHTML =
            '<div style="text-align:center;padding:40px;color:#666"><h3>Нет доступных дашбордов</h3></div>';
        return;
    }


    const html = `
       <style>
           .catalog{display:grid;grid-template-columns:repeat(${gridCols},1fr);gap:16px;padding:16px;font-family:Arial}
           .card{background:white;border:1px solid #ddd;border-radius:8px;padding:16px;cursor:pointer;transition:all 0.2s}
           .card:hover{box-shadow:0 4px 12px rgba(0,0,0,0.1);transform:translateY(-1px)}
           .badge{color:white;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:bold;margin-bottom:12px;display:inline-block}
           .title{font-size:16px;font-weight:bold;color:#333;margin:0 0 8px 0}
           .desc{color:#666;font-size:14px;margin:0;line-height:1.4}
       </style>
       <div class="catalog">
           ${dashboards.map(key => {
        const config = dashboardConfig[key];
        return `<div class="card" onclick="window.open('${config.dashboardUrl}','_blank')">
                   <div class="badge" style="background-color:${config.categoryColor}">Категория</div>
                   <h3 class="title">${config.title}</h3>
                   <p class="desc">${config.description}</p>
               </div>`;
    }).join('')}
       </div>
   `;


    document.getElementById(w.general.renderTo).innerHTML = html;
}
