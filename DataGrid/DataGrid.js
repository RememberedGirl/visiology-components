function init() {
    const items = w.data.primaryData.items;
    const keyLen = items[0].keys.length;

    const data = items.map(item => {
        const obj = {};
        item.keys.forEach((key, i) => obj[item.cols[i]] = key);
        item.values.forEach((val, i) => obj[item.cols[keyLen + i]] = val);
        return obj;
    });

    const html = `<div id="table-${w.general.renderTo}"></div>`;
    TextRender({ text: { ...w.general, text: html }, style: {} });

    $(`#table-${w.general.renderTo}`).dxDataGrid({
        dataSource: data,
        showBorders: true,
        columns: items[0]?.cols || [],
        width: '100%',
        height: '100%'
    });
}

init();