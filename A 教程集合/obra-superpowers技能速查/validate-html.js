const fs = require('fs');
const path = require('path');

const root = __dirname;
const htmlPath = path.join(root, 'obra-superpowers-v6.1.1-14技能速查.html');
const sourceRoot = 'C:\\Users\\MSI\\.codex\\plugins\\cache\\openai-curated-remote\\superpowers\\6.1.1\\skills';
const html = fs.readFileSync(htmlPath, 'utf8');
const failures = [];
const assert = (ok, message) => { if (!ok) failures.push(message); };

const dataMatch = html.match(/const skills=(\[[\s\S]*?\]);\nconst repoBase=/);
assert(dataMatch, '找不到内嵌 skills 数据');
const skills = dataMatch ? JSON.parse(dataMatch[1]) : [];
const required = ['name','title','category','phase','level','summary','usage','input','output','scenarios','roles','core','steps','previous','next','example'];

assert(skills.length === 14, `技能总数应为 14，实际为 ${skills.length}`);
assert(new Set(skills.map(s => s.name)).size === 14, '存在重复技能名');
for (const skill of skills) {
  for (const field of required) {
    const value = skill[field];
    assert(Array.isArray(value) ? value.length > 0 : Boolean(String(value || '').trim()), `${skill.name} 缺少 ${field}`);
  }
  assert(skill.example.startsWith(`$superpowers:${skill.name}`), `${skill.name} 的调用示例格式不正确`);
  assert(fs.existsSync(path.join(sourceRoot, skill.name, 'SKILL.md')), `${skill.name} 的来源文件不存在`);
}

for (const id of ['workflow','principles','skills','evidence','q','phase','category','role','cardBtn','tableBtn','expandBtn','cards','tablewrap','tbody','count','empty']) {
  assert(html.includes(`id="${id}"`), `页面缺少控件 #${id}`);
}
assert(html.includes('@media(max-width:375px)'), '缺少 375px 响应式规则');
assert(html.includes('@media(max-width:768px)'), '缺少 768px 响应式规则');
assert(html.includes('@media(max-width:1100px)'), '缺少桌面/平板响应式规则');
assert(html.includes('@media print'), '缺少打印样式');
assert(html.includes('prefers-color-scheme:dark'), '缺少暗色模式');
assert(html.includes('prefers-reduced-motion:reduce'), '缺少减少动画设置');
assert(html.includes('contenteditable="true"'), '缺少可编辑速记区');
assert(html.includes('ResizeObserver'), '缺少响应式重排观察器');
assert(html.includes('MutationObserver'), '缺少编辑重排观察器');
assert(html.includes('Pretext.prepare') && html.includes('Pretext.layout'), 'Pretext 未正确接线');
assert(!/<script[^>]+src=/i.test(html), '存在外部脚本依赖');
assert(!/<link[^>]+(?:stylesheet|preload)/i.test(html), '存在外部样式或字体依赖');
assert(html.includes("const source=s=>repoBase+s.name+'/SKILL.md'"), '页面缺少动态官方源码定位');
assert(html.length > 75000, `HTML 体积异常偏小：${html.length}`);

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
assert(scripts.length === 2, `应有 2 段内联脚本，实际为 ${scripts.length}`);
scripts.forEach((script, index) => {
  try { new Function(script); }
  catch (error) { failures.push(`第 ${index + 1} 段内联脚本语法错误：${error.message}`); }
});

if (failures.length) {
  console.error(`FAIL (${failures.length})`);
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}

console.log('PASS');
console.log(`skills=${skills.length}`);
console.log(`unique=${new Set(skills.map(s => s.name)).size}`);
console.log(`source_paths_checked=${skills.length}`);
console.log(`inline_scripts_checked=${scripts.length}`);
console.log(`html_bytes=${Buffer.byteLength(html)}`);
