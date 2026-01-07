#!/usr/bin/env node
'use strict';

const fs = require('fs/promises');
const path = require('path');

const MISSING_FILE_NAME = 'missing.txt';
const KEEP_FILE_NAME = 'merged.pdf';

const IGNORE_DIRS = new Set([
  'node_modules'
]);

// 解析文件名开头的序号（例如：01版_要闻.pdf -> 1；16版_体育.pdf -> 16）
function extractLeadingNumber(filename) {
  const m = filename.match(/^(\d+)/);
  return m ? Number(m[1]) : null;
}

// 计算缺失序号：如果序号不连续，则缺失在 [min..max] 中但不存在的那些
function findMissing(numbers) {
  if (!numbers.length) return []; // 没有序号文件就认为无缺失（你也可改成认为异常）
  const sorted = Array.from(new Set(numbers)).sort((a, b) => a - b);
  const set = new Set(sorted);

  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const missing = [];
  for (let i = min; i <= max; i++) {
    if (!set.has(i)) missing.push(i);
  }
  return missing;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

async function isDirectory(p) {
  try {
    const st = await fs.stat(p);
    return st.isDirectory();
  } catch {
    return false;
  }
}

async function listSubfoldersSorted(baseDir) {
  const entries = await fs.readdir(baseDir, { withFileTypes: true });

  return entries
    .filter(d =>
      d.isDirectory() &&
      !IGNORE_DIRS.has(d.name)
    )
    .map(d => d.name)
    .sort((a, b) => a.localeCompare(b));
}

async function handleFolder(folderPath, dryRun) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });

  // 只处理文件，不处理子目录
  const files = entries.filter(e => e.isFile()).map(e => e.name);

  // 提取序号
  const numbers = files
    .map(extractLeadingNumber)
    .filter(n => n !== null);

  const missing = findMissing(numbers);
  const missingFilePath = path.join(folderPath, MISSING_FILE_NAME);

  if (missing.length > 0) {
    const content = missing.map(pad2).join('\n') + '\n';
    if (dryRun) {
      console.log(`[DRY] 缺失 -> 写入 ${missingFilePath}：\n${content.trimEnd()}`);
    } else {
      await fs.writeFile(missingFilePath, content, 'utf8');
      console.log(`缺失 -> 已写入 ${missingFilePath}（共 ${missing.length} 个）`);
    }
    return;
  }

  // 没有缺失：删掉除了 merged.pdf 之外的其他文件（包含 missing.txt）
  const toDelete = files.filter(name => name !== KEEP_FILE_NAME);

  if (toDelete.length === 0) {
    console.log(`无缺失 -> ${folderPath} 无需删除（只剩 ${KEEP_FILE_NAME} 或空）`);
    return;
  }

  for (const name of toDelete) {
    const fp = path.join(folderPath, name);
    if (dryRun) {
      console.log(`[DRY] 无缺失 -> 删除 ${fp}`);
    } else {
      await fs.unlink(fp);
      console.log(`无缺失 -> 已删除 ${fp}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const baseDir = args[0] ? path.resolve(args[0]) : process.cwd();
  const dryRun = args.includes('--dry-run');

  if (!(await isDirectory(baseDir))) {
    console.error(`BaseDir 不存在或不是目录：${baseDir}`);
    process.exit(1);
  }

  const folders = await listSubfoldersSorted(baseDir);
  if (folders.length === 0) {
    console.log(`未找到子文件夹：${baseDir}`);
    return;
  }

  console.log(`BaseDir: ${baseDir}`);
  console.log(`Folders: ${folders.length}`);
  if (dryRun) console.log(`模式：DRY RUN（不会真正写入/删除）`);

  for (const folder of folders) {
    const folderPath = path.join(baseDir, folder);
    console.log(`\n==> 处理文件夹：${folderPath}`);
    try {
      await handleFolder(folderPath, dryRun);
    } catch (e) {
      console.error(`处理失败：${folderPath}\n`, e);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
