// 复制404.html到dist目录的脚本
import fs from 'fs';
import path from 'path';

const sourceFile = path.resolve('./404.html');
const destDir = path.resolve('./dist');
const destFile = path.join(destDir, '404.html');

// 确保dist目录存在
if (!fs.existsSync(destDir)) {
  console.error('dist目录不存在，请先运行构建命令');
  process.exit(1);
}

// 复制404.html文件
try {
  fs.copyFileSync(sourceFile, destFile);
  console.log('✅ 404.html已成功复制到dist目录');
} catch (error) {
  console.error('❌ 复制404.html失败:', error);
  process.exit(1);
}
