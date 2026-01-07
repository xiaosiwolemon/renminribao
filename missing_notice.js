/**
 * 用法：
 *   node missing_notice.js /path/to/txts
 *
 * 目录内文件示例：
 *   20240102.txt  (内容：19)
 *   20240104.txt  (内容：15)
 *   ...
 *
 * 输出示例：
 *   本资源已尽量整理完整，个别日期存在版次缺失，具体如下：
 *   2024年1月2日第19版，
 *   1月4日第15版，
 *   ...
 *   以及2024年2月1日第15版、2月6日第15版。
 *
 *   以上缺失版次均为广告版，不影响新闻正文及主要内容阅读，请放心使用。
 */

const fs = require("fs");
const path = require("path");

const dir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

function parseYmd(filename) {
  // 20240102.txt -> { y: 2024, m: 1, d: 2 }
  const m = filename.match(/^(\d{4})(\d{2})(\d{2})\.txt$/);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]), ymd: `${m[1]}${m[2]}${m[3]}` };
}

function formatCNDate({ y, m, d }, withYear) {
  return withYear ? `${y}年${m}月${d}日` : `${m}月${d}日`;
}

function normalizeEdition(content) {
  // 文件内容可能是 "19" / "第19版" / "19版" / "19\r\n"
  const s = String(content).trim();
  const mm = s.match(/(\d+)/);
  return mm ? Number(mm[1]) : null;
}

function buildOutput(items) {
  // items: [{date:{y,m,d,ymd}, edition:number}]
  if (items.length === 0) {
    return "未发现任何符合 YYYYMMDD.txt 命名的文件，或文件内容无法解析版次。";
  }

  // 按年月日排序
  items.sort((a, b) => a.date.ymd.localeCompare(b.date.ymd));

  const first = items[0].date;
  const lines = [];
  lines.push("本资源已尽量整理完整，个别日期存在版次缺失，具体如下：");

  // 第一行带年份；同一年内后续行可省略年份
  const baseYear = first.y;

  // 如果有 2 条及以上，把最后两条用“以及…。”合并（和你的示例一致）
  const head = items.slice(0, -2);
  const lastTwo = items.slice(-2);

  // 先输出除最后两条外的每一行，末尾用“，”（中文逗号）
  for (let i = 0; i < head.length; i++) {
    const it = head[i];
    const withYear = i === 0; // 第一条带年份
    const dateStr = formatCNDate(it.date, withYear);
    lines.push(`${dateStr}第${it.edition}版，`);
  }

  if (items.length === 1) {
    // 只有一条时，结尾句号即可
    const it = items[0];
    lines.push(`${formatCNDate(it.date, true)}第${it.edition}版。`);
  } else if (items.length === 2) {
    // 恰好两条：直接“以及A、B。”
    const a = lastTwo[0];
    const b = lastTwo[1];
    const aDate = formatCNDate(a.date, true); // 你的示例里“以及2024年2月1日…、2月6日…”
    const bDate = formatCNDate(b.date, false);
    lines.push(`以及${aDate}第${a.edition}版、${bDate}第${b.edition}版。`);
  } else {
    // 3条以上：最后两条合并成“以及…。”
    const a = lastTwo[0];
    const b = lastTwo[1];

    // a：若跨年则带年份；若同年则也带年份（匹配你示例）
    const aWithYear = a.date.y !== baseYear ? true : true;
    const aDate = formatCNDate(a.date, aWithYear);
    const bWithYear = b.date.y !== a.date.y; // 仅在跨年时给 b 带年份
    const bDate = formatCNDate(b.date, bWithYear ? true : false);

    lines.push(`以及${aDate}第${a.edition}版、${bDate}第${b.edition}版。`);
  }

  lines.push("");
  lines.push("以上缺失版次均为广告版，不影响新闻正文及主要内容阅读，请放心使用。");

  return lines.join("\n");
}

(async function main() {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const items = [];
  for (const ent of entries) {
    if (!ent.isFile()) continue;
    const info = parseYmd(ent.name);
    if (!info) continue;

    const full = path.join(dir, ent.name);
    const content = fs.readFileSync(full, "utf8");
    const edition = normalizeEdition(content);
    if (edition == null) continue;

    items.push({ date: info, edition });
  }

  const text = buildOutput(items);
  console.log(text);
})();
