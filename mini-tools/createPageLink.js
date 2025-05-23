const fs = require('fs');

function generateLinks(startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const links = [];

  while (startDate <= endDate) {
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');

    const url = `https://paper.people.com.cn/rmrb/html/${year}-${month}/${day}/nbs.D110000renmrb_01.htm`;
    links.push(url);

    startDate.setDate(startDate.getDate() + 1);
  }

  return links;
}

const start = '2024-08-01';
const end = '2024-11-30';
const resultLinks = generateLinks(start, end);

// 写入文件
fs.writeFileSync('pageLinks.txt', resultLinks.join('\n'), 'utf-8');
console.log(`已生成 ${resultLinks.length} 条链接，保存至 pageLinks.txt`);
