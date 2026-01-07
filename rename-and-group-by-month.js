#!/usr/bin/env node
'use strict';

const fs = require('fs/promises');
const path = require('path');

const SOURCE_PDF_NAME = 'merged.pdf';
const IGNORE_DIRS = new Set(['node_modules']);

function isDateFolder(name) {
  return /^\d{8}$/.test(name); // YYYYMMDD
}

function getMonth(dateStr) {
  // dateStr: YYYYMMDD -> YYYYMM
  return dateStr.slice(0, 6);
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(p) {
  try {
    const st = await fs.stat(p);
    return st.isDirectory();
  } catch {
    return false;
  }
}

async function ensureDir(dirPath, dryRun) {
  if (dryRun) return;
  await fs.mkdir(dirPath, { recursive: true });
}

async function moveFile(src, dest, dryRun) {
  if (dryRun) return;
  // rename 在同盘移动最快；跨盘也可能失败，这里做个兜底 copy+unlink
  try {
    await fs.rename(src, dest);
  } catch (e) {
    if (e && e.code === 'EXDEV') {
      await fs.copyFile(src, dest);
      await fs.unlink(src);
    } else {
      throw e;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const baseDir = args[0] ? path.resolve(args[0]) : process.cwd();
  const dryRun = args.includes('--dry-run');

  if (!(await isDirectory(baseDir))) {
    console.error('不是有效目录：', baseDir);
    process.exit(1);
  }

  const entries = await fs.readdir(baseDir, { withFileTypes: true });

  console.log(`BaseDir: ${baseDir}`);
  if (dryRun) console.log('模式：DRY RUN（不实际改名/移动）');

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const folderName = entry.name;

    if (IGNORE_DIRS.has(folderName)) continue;
    if (!isDateFolder(folderName)) continue;

    const dateFolderPath = path.join(baseDir, folderName);

    const srcMergedPath = path.join(dateFolderPath, SOURCE_PDF_NAME);
    if (!(await exists(srcMergedPath))) {
      // 没有 merged.pdf 就跳过
      continue;
    }

    const month = getMonth(folderName); // YYYYMM
    const monthDirPath = path.join(baseDir, month);
    const destFileName = `${folderName}.pdf`;
    const destPath = path.join(monthDirPath, destFileName);

    // 目标已存在则跳过，避免覆盖
    if (await exists(destPath)) {
      console.warn(`⚠ 目标已存在，跳过：${destPath}`);
      continue;
    }

    // 创建月份目录
    if (dryRun) {
      console.log(`[DRY] 确保目录存在：${monthDirPath}`);
    } else {
      await ensureDir(monthDirPath, dryRun);
    }

    // 先把 merged.pdf 直接移动到月份目录并改名为 YYYYMMDD.pdf
    if (dryRun) {
      console.log(`[DRY] 移动并重命名：${srcMergedPath}  ->  ${destPath}`);
    } else {
      await moveFile(srcMergedPath, destPath, dryRun);
      console.log(`✔ 完成：${srcMergedPath}  ->  ${destPath}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
