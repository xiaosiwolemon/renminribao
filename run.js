const moment = require('moment')
const exec = require('./entrypoint');
const generateLinks = require('./generateLinks');


(async () => {
    const start = moment().format('YYYY-MM-DD');
    console.log(`正在尝试抓取${start}的人民日报信息...`);
    const link = generateLinks(start)[0];
    await exec(link);
})();
