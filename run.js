const moment = require('moment')
const exec = require('./entrypoint');
const generateLinks = require('./generateLinks');


(async () => {
    // 设置开始时间、结束时间
    // 如果你只下载一天的，那结束时间可以为空
    const start = moment('2025-12-01').format('YYYY-MM-DD');
    const end = moment('2025-12-31').format('YYYY-MM-DD');

    // console.log(`正在尝试抓取${start}的人民日报信息...`);
    const link = generateLinks(start, end);
    console.log(link);

    const len = link.length
    for (let i = 0; i < len; i++) {
        console.log(`${i}-${len - 1}`)
        await exec(link[i]);
        await new Promise((resolve) => {
            // 随便写的等待时间，改成别的应该也没啥事
            setTimeout(() => {
                resolve()
            }, 2000)
        })
    }

})();
