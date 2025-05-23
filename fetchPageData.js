const cheerio = require('cheerio');
const axios = require('axios');

async function fetchPageData({ targetUrl }) {
  try {
    const { data: html } = await axios.get(targetUrl);
    const $ = cheerio.load(html);

    const dateText = $('.date-box .date').text();
    const match = dateText.match(/(\d{4})年(\d{2})月(\d{2})日/);
    const date = match ? `${match[1]}-${match[2]}-${match[3]}` : 'unknown';

    const pageLinks = $('#pageLink')
      .map((_, el) => ({
        title: $(el).text().trim(),
        url: new URL($(el).attr('href'), targetUrl).href
      }))
      .get();

    const detailedLinks = await Promise.all(
      pageLinks.map(async (pageLink) => {
        try {
          const { data: pageHtml } = await axios.get(pageLink.url);
          const $$ = cheerio.load(pageHtml);
          const pdfPath = $$('.paper-bot a').attr('href');
          const pdfUrl = pdfPath ? new URL(pdfPath, targetUrl).href : null;
          return { ...pageLink, pdfUrl };
        } catch (err) {
          console.warn(`⚠️ 子页面抓取失败: ${pageLink.url}`, err.message);
          return { ...pageLink, pdfUrl: null };
        }
      })
    );

    return { date, detailedLinks };
  } catch (err) {
    console.error('❌ 主页面抓取失败:', err.message);
    return { date: 'unknown', detailedLinks: [] };
  }
}

module.exports = fetchPageData;
