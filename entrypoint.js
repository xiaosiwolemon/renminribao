const path = require('path');
const fs = require('fs');
const fetchPageData = require('./fetchPageData');
const { downloadPDF } = require('./downloadPDF');
const mergePDFs = require('./mergePDFs')

module.exports = async (targetUrl) => {
  try {
    const { date: publishDate, detailedLinks } = await fetchPageData({ targetUrl: targetUrl });
    const publishDateText = publishDate.replace(/-/g, '');

    if (!detailedLinks || detailedLinks.length === 0) {
      throw new Error('未获取到有效的页面数据。');
    }

    const outputDir = path.resolve(__dirname, publishDateText);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const savePathList = await Promise.all(
      detailedLinks
        .filter(link => link.pdfUrl)
        .map(async ({ title, pdfUrl }) => {
          const sanitizedTitle = title.replace(/[^\w\u4e00-\u9fa5]/g, '_');
          const savePath = path.resolve(outputDir, `${sanitizedTitle}.pdf`);
          await downloadPDF(pdfUrl, savePath);
          return savePath;
        })
    );

    if (savePathList.length === 0) {
      throw new Error('没有成功下载任何 PDF 文件。');
    }

    const mergedFilePath = path.resolve(outputDir, 'merged.pdf');
    const outputPath = await mergePDFs(savePathList, mergedFilePath, {
      producer: "pdf-merger-js script",
      author: "人民日报",
      creator: "人民日报 PDF 合并工具",
      title: `人民日报-${publishDate}`
    });
    console.log('✅ PDF 合并完成，保存路径：', outputPath);


  } catch (error) {
    console.error('❌ 执行失败：', error.message);
  }
}
