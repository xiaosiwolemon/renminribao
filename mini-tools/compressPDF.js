
const path = require('path');
const { spawn } = require('child_process');

async function compressPDF(startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const links = [];

  while (startDate <= endDate) {
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');

    const url = path.resolve(__dirname, `${year}${month}${day}`, 'merged.pdf')
    const disturl = path.resolve(__dirname, `rmd/merged-compressed_${year}${month}${day}.pdf`)
    await runGhostscript(url, disturl);
    startDate.setDate(startDate.getDate() + 1);
  }

  return links;
}

const start = '2024-08-01';
const end = '2024-12-01';
compressPDF(start, end);










// 封装spawn为Promise
function spawnPromise(command, args = []) {
  return new Promise((resolve, reject) => {
    const cmd = spawn(command, args, { shell: true });
    let output = '';
    let errorOutput = '';

    // 监听标准输出
    cmd.stdout.on('data', (data) => {
      output += data.toString();
    });

    // 监听标准错误输出
    cmd.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // 监听命令结束
    cmd.on('close', (code) => {
      if (code !== 0) {
        reject(`命令失败，退出码: ${code}\n错误输出: ${errorOutput}`);
      } else {
        resolve(output); // 返回标准输出
      }
    });
  });
}

// 使用async/await执行gs命令
async function runGhostscript(url, disturl ) {

  const command = 'gs';
  const args = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    '-dPDFSETTINGS=/ebook',
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOutputFile=${disturl}`,
    url
  ];

  try {
    const result = await spawnPromise(command, args);
    console.log(`命令成功执行，输出: ${result}`);
  } catch (err) {
    console.error(`命令执行失败: ${err}`);
  }
}


