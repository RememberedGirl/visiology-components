// Объявляем переменную для хранения CSS стилей
let fontFamily = 'Zen Antique Soft',

/* ПРИМЕНЕНИЕ СТИЛЕЙ К СТРАНИЦЕ - массив с ID элементов */
widgetArr.forEach(x => addStyle(css,x))
loadFont(fontFamily);


function loadFont(name) {
    const fontUrl = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}&display=swap&subset=cyrillic`;
    if (!document.querySelector(`link[href="${fontUrl}"]`)) {
        document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${fontUrl}">`);
    }

    const styleId = w.general.renderTo + 'style';
    const css = `
  
    .va-widget-body *, .va-widget-header {
      font-family: ${name} !important;
    }
    
    .fa::before { font-family: FontAwesome !important; }
    .dx-pivotgrid-container .dx-expand::before { font-family: DXIcons !important; }
  `;

    let style = document.getElementById(styleId);
    if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
    }
    style.textContent = css;
}