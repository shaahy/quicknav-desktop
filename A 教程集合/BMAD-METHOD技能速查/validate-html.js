const fs = require('fs');
const path = require('path');

const root = __dirname;
const htmlPath = path.join(root, 'BMAD-METHOD-v6.10.0-全技能速查.html');
const sourceRoot = path.join(root, 'source-v6.10.0');
const html = fs.readFileSync(htmlPath, 'utf8');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const dataMatch = html.match(/const skills=(\[[\s\S]*?\]);\nconst repoBase=/);
assert(dataMatch, '找不到页面内嵌 skills 数据');
const skills = dataMatch ? JSON.parse(dataMatch[1]) : [];
const required = ['name', 'title', 'module', 'category', 'phase', 'status', 'distribution', 'purpose', 'example', 'input', 'output', 'scenarios', 'roles', 'related', 'source'];
const allowedPhases = ['分析', '规划', '方案', '实施', '任意阶段'];

assert(skills.length === 52, `技能总数应为 52，实际为 ${skills.length}`);
assert(new Set(skills.map((s) => s.name)).size === skills.length, '存在重复技能名');
assert(skills.filter((s) => s.distribution === '标准安装').length === 46, '标准安装技能应为 46');
assert(skills.filter((s) => s.distribution.includes('Web')).length === 6, 'Web Bundle 技能应为 6');
assert(skills.filter((s) => s.status === '已废弃').length === 4, '已废弃兼容入口应为 4');

for (const skill of skills) {
  for (const field of required) {
    const value = skill[field];
    assert(Array.isArray(value) ? value.length > 0 : Boolean(String(value || '').trim()), `${skill.name} 缺少 ${field}`);
  }
  assert(skill.example?.startsWith(`$${skill.name}`), `${skill.name} 的调用示例必须以 $${skill.name} 开头`);
  assert(allowedPhases.includes(skill.phase), `${skill.name} 的阶段值无效：${skill.phase}`);
  assert(!Object.hasOwn(skill, 'usage'), `${skill.name} 仍包含 usage 字段`);
  assert(!skill.source.includes('test/fixtures'), `${skill.name} 错误引用了测试夹具`);
  assert(fs.existsSync(path.join(sourceRoot, ...skill.source.split('/'))), `${skill.name} 的来源文件不存在：${skill.source}`);
}

for (const id of ['q', 'category', 'phase', 'role', 'status', 'cardBtn', 'tableBtn', 'cards', 'tbody', 'count', 'empty']) {
  assert(html.includes(`id="${id}"`), `页面缺少控件 #${id}`);
}
assert(html.includes('@media print'), '缺少打印样式');
assert(html.includes('BMAD-METHOD v6.10.0'), '缺少版本标识');
assert(html.includes('081e64ee5aab'), '缺少提交标识');
assert(!skills.some((skill) => skill.phase === '方案设计'), '数据中仍存在“方案设计”');
assert(!html.includes('>如何使用<'), '页面仍展示“如何使用”');
assert(html.includes('<th>调用示例</th>'), '表格列名未改为调用示例');
assert(html.includes('data-copy-name'), '页面缺少复制按钮绑定');
assert(html.includes("aria-label=\"复制 '+esc(s.name)+' 调用示例\""), '复制按钮缺少带技能名的无障碍标签');
assert(html.includes('copyExample'), '页面缺少复制处理函数');
assert(html.includes("const phaseOrder=['分析','规划','方案','实施','任意阶段']"), '阶段筛选顺序不正确');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
assert(scripts.length === 1, `应有 1 段内联脚本，实际为 ${scripts.length}`);
for (const script of scripts) {
  try {
    new Function(script);
  } catch (error) {
    failures.push(`前端脚本语法错误：${error.message}`);
  }
}

if (failures.length) {
  console.error(`FAIL (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('PASS');
console.log(`skills=${skills.length}`);
console.log(`unique=${new Set(skills.map((s) => s.name)).size}`);
console.log(`standard=${skills.filter((s) => s.distribution === '标准安装').length}`);
console.log(`web=${skills.filter((s) => s.distribution.includes('Web')).length}`);
console.log(`deprecated=${skills.filter((s) => s.status === '已废弃').length}`);
console.log(`source_paths_checked=${skills.length}`);
console.log(`inline_scripts_checked=${scripts.length}`);
