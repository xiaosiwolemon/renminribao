const exec = require('./index');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'links.txt');
const errorLogPath = path.join(__dirname, 'error.log');

async function processLinks() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const links = data.split('\n').map(line => line.trim()).filter(line => line !== '');

    for (let link of links) {
      console.log('处理链接:', link);
      try {
        await exec(link);
      } catch (err) {
        console.error(`处理失败: ${link}`, err.message);

        // 将错误信息写入错误日志
        const logMessage = `[${new Date().toISOString()}] 链接: ${link}\n错误: ${err.stack || err.message}\n\n`;
        fs.appendFileSync(errorLogPath, logMessage, 'utf8');
      }
    }

    console.log('所有链接处理完成');
  } catch (err) {
    console.error('读取文件失败:', err.message);
  }
}

processLinks();
