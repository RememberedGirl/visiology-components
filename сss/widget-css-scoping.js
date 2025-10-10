// Объявляем переменную для хранения CSS стилей
let css = '',
    styleId = w.general.renderTo,
    widgetArr = ['5153a362038f4118b255fabae649f451'] // Тут необходимо указать наш виджет

// Блок CSS стилей начинается здесь
{css = `
/* :root - псевдо-класс корневого элемента документа. Здесь определяем CSS переменные с префиксом -- */
:root {
   


`}

// Конец CSS строки

/* ПРИМЕНЕНИЕ СТИЛЕЙ К СТРАНИЦЕ - массив с ID элементов */
widgetArr.forEach(x => addStyle(css,x))


//----

/* ФУНКЦИЯ ДЛЯ ДОБАВЛЕНИЯ СТИЛЕЙ В ДОКУМЕНТ
   Параметры: css - код стилей, addId - ID для scoping, styleId - базовый ID */
function addStyle(css, addId = '', styleId = w.general.renderTo) {
  const styleElementId = styleId + '_style_' + addId;
  let styleElement = document.getElementById(styleElementId);

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleElementId;
    document.head.appendChild(styleElement);
  }

  // Удаляем комментарии из CSS перед обработкой
  const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  
  const scopedCss = cssWithoutComments.replace(/(^|\})\s*([^{]+)/g, (match, closeBrace, selectors) => {
    const scopedSelectors = selectors
      .split(',')
      .map(s => {
        const trimmed = s.trim();
        
        if (!trimmed) return s;
        
        // Особые случаи для outside-элементов Highcharts
        const excludedSelectors = [':root', '.highcharts-tooltip span', '.highcharts-tooltip path', '.tooltip-global'];
        if (excludedSelectors.includes(trimmed)) {
            return trimmed;
        }
        
        return addId 
          ? `#${CSS.escape(addId)} ${trimmed}`
          : trimmed;
      })
      .join(', ');
      
    return `${closeBrace || ''}\n${scopedSelectors}`;
  });

  styleElement.textContent = scopedCss;
}
