#!/usr/bin/env node
'use strict';

const fs = require('fs/promises');
const path = require('path');

const SOURCE_NAME = 'missing.txt';
const DEST_DIR_NAME = 'missing';
const IGNORE_DIRS = new Set(['node_modules']);

function isDateFolder(name) {
  return /^\d{8}$/.test(name); // YYYYMMDD
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
  try {
    await fs.rename(src, dest);
  } catch (e) {
    // 跨盘兜底
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

  const destDir = path.join(baseDir, DEST_DIR_NAME);
  if (dryRun) {
    console.log(`[DRY] 确保目录存在：${destDir}`);
  } else {
    await ensureDir(destDir, dryRun);
  }

  const entries = await fs.readdir(baseDir, { withFileTypes: true });

  console.log(`BaseDir: ${baseDir}`);
  if (dryRun) console.log('模式：DRY RUN（不实际重命名/移动）');

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const folderName = entry.name;

    if (IGNORE_DIRS.has(folderName)) continue;
    if (!isDateFolder(folderName)) continue;

    const dateFolderPath = path.join(baseDir, folderName);
    const srcPath = path.join(dateFolderPath, SOURCE_NAME);

    if (!(await exists(srcPath))) continue; // 没有 missing.txt 跳过

    const newName = `${folderName}.txt`;
    const destPath = path.join(destDir, newName);

    // 目标已存在则跳过，避免覆盖
    if (await exists(destPath)) {
      console.warn(`⚠ 目标已存在，跳过：${destPath}`);
      continue;
    }

    // 直接移动并重命名（等价于：先改名再移动）
    if (dryRun) {
      console.log(`[DRY] ${srcPath}  ->  ${destPath}`);
    } else {
      await moveFile(srcPath, destPath, dryRun);
      console.log(`✔ 已收集：${srcPath}  ->  ${destPath}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
