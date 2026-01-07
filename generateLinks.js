function generateLinks(startDateStr, endDateStr = startDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const links = [];

    while (startDate <= endDate) {
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');

        const url = `https://paper.people.com.cn/rmrb/pc/layout/${year}${month}/${day}/node_01.html`
        // 下面的是2024年11月30日之前的链接
        // const url = `https://paper.people.com.cn/rmrb/html/${year}-${month}/${day}/nbs.D110000renmrb_01.htm`;
        links.push(url);

        startDate.setDate(startDate.getDate() + 1);
    }

    return links;
}

module.exports = generateLinks

// const start = '2024-08-01';
// const end = '2024-11-30';
// const resultLinks = generateLinks(start, end);