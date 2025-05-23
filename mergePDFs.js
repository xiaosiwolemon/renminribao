const PDFMerger = require('pdf-merger-js');

async function mergePDFs(filePaths, outputPath, metadata = {}) {
    if (!filePaths || filePaths.length === 0) {
        throw new Error('没有传入任何 PDF 文件路径用于合并。');
    }

    const merger = new PDFMerger();

    for (const filePath of filePaths) {
        await merger.add(filePath);
    }

    if (Object.keys(metadata).length > 0) {
        await merger.setMetadata(metadata);
    }

    await merger.save(outputPath);
    return outputPath
}

module.exports = mergePDFs