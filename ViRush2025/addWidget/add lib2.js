// === СПИСОК БИБЛИОТЕК ===
const libraries = {
    'echarts': 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js',

    'd3': 'https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js',
    'd3_cloud': 'https://cdn.jsdelivr.net/gh/holtzy/D3-graph-gallery@master/LIB/d3.layout.cloud.js',

    'chartjs': 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'highcharts': 'https://code.highcharts.com/10.3.3/highcharts.js',

'am5_index' : "https://cdn.amcharts.com/lib/5/index.js",
'am5_xy' : "https://cdn.amcharts.com/lib/5/xy.js",
'am5_Animated' : "https://cdn.amcharts.com/lib/5/themes/Animated.js",
'am5_de_DE' : "https://cdn.amcharts.com/lib/5/locales/de_DE.js",
'am5_germanyLow' : "https://cdn.amcharts.com/lib/5/geodata/germanyLow.js",
'am5_notosans' : "https://cdn.amcharts.com/lib/5/fonts/notosans-sc.js",



    'plotly': 'https://cdn.plot.ly/plotly-2.24.1.min.js',

    'apexcharts': 'https://cdn.jsdelivr.net/npm/apexcharts',
    'apextree': 'https://cdn.jsdelivr.net/npm/apextree',
    'apexgantt': "https://cdn.jsdelivr.net/npm/apexgantt",

    'victory': 'https://unpkg.com/victory@36.6.10/dist/victory.min.js',
    'nivo': 'https://unpkg.com/@nivo/core@0.83.0/dist/nivo-core.min.js'
};

// === ЗАГРУЗКА ВСЕХ БИБЛИОТЕК ===
Object.values(libraries).forEach(url => {
    const script = document.createElement('script');
    script.src = url;
    document.head.appendChild(script);
});