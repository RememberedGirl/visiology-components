// === СПИСОК БИБЛИОТЕК ===
const libraries = {
    'echarts': 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js',
    'd3': 'https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js',
    'chartjs': 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'highcharts': 'https://code.highcharts.com/10.3.3/highcharts.js',
    'amcharts4_core': 'https://cdn.amcharts.com/lib/4/core.js',
    'amcharts4_charts': 'https://cdn.amcharts.com/lib/4/charts.js',
    'amcharts4_animated': 'https://cdn.amcharts.com/lib/4/themes/animated.js',
    'plotly': 'https://cdn.plot.ly/plotly-2.24.1.min.js',
    'apexcharts': 'https://cdn.jsdelivr.net/npm/apexcharts',
    'apextree': 'https://cdn.jsdelivr.net/npm/apextree',
    'victory': 'https://unpkg.com/victory@36.6.10/dist/victory.min.js',
    'nivo': 'https://unpkg.com/@nivo/core@0.83.0/dist/nivo-core.min.js'
};

// === ЗАГРУЗКА ВСЕХ БИБЛИОТЕК ===
Object.values(libraries).forEach(url => {
    const script = document.createElement('script');
    script.src = url;
    document.head.appendChild(script);
});