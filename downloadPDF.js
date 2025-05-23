const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadPDF(pdfUrl, savePath) {
  const tempPath = savePath + '.tmp';
  try {
    const response = await axios.get(pdfUrl, {
      responseType: 'stream',
      timeout: 10000
    });

    if (response.status !== 200) {
      throw new Error(`请求失败，状态码：${response.status}`);
    }

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(tempPath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    fs.renameSync(tempPath, savePath);
    console.log(`📥 下载成功: ${path.basename(savePath)}`);
  } catch (error) {
    console.error(`⚠️ 下载失败 [${pdfUrl}]:`, error.message);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

module.exports = { downloadPDF };
