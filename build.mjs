// 把 src/ 下的模块拼成单个 HTML 文件
import fs from 'fs';
const files = fs.readdirSync('src').filter(f => f.endsWith('.js')).sort();
const js = files.map(f => `// ---- ${f} ----\n` + fs.readFileSync('src/' + f, 'utf8')).join('\n');
const tpl = fs.readFileSync('src/template.html', 'utf8').replace('/*__SCRIPT__*/', () => js);
const [head, body] = tpl.split('<!--HEAD-END-->');
// 1) 独立网页（可直接双击打开或部署）
const full = `<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head.trim()}\n</head>\n<body>\n${body.trim()}\n</body>\n</html>\n`;
fs.writeFileSync('index.html', full);
// 2) Artifact 版本（发布时外层会自动包上文档骨架）
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/hoshimi-island.html', head.trim() + '\n' + body.trim() + '\n');
console.log('built', files.length, 'modules,', (full.length / 1024).toFixed(1), 'KB');
