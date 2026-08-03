const fs = require('fs');
const path = require('path');
const htmlPath = path.join(__dirname, 'phuryn-pm-skills-v2.1.0-中文速查.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const sourceRoot = 'C:\\Users\\MSI\\.codex\\plugins\\cache\\pm-skills';
const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); };

const skillMatch = html.match(/const skills=(\[[\s\S]*?\]);const commands=/);
const commandMatch = html.match(/const commands=(\[[\s\S]*?\]);const pluginMeta=/);
check(skillMatch, '未找到内嵌 Skills 数据');
check(commandMatch, '未找到内嵌 Commands 数据');
const skills = skillMatch ? JSON.parse(skillMatch[1]) : [];
const commands = commandMatch ? JSON.parse(commandMatch[1]) : [];

check(skills.length === 68, `Skills 应为 68，实际 ${skills.length}`);
check(commands.length === 42, `Commands 应为 42，实际 ${commands.length}`);
check(new Set(skills.map(x => `${x.plugin}:${x.name}`)).size === 68, 'Skills 调用名不唯一');
check(new Set(commands.map(x => `${x.plugin}:${x.name}`)).size === 42, 'Commands 调用名不唯一');

for (const s of skills) {
  for (const key of ['plugin','phase','name','title','purpose','input','output','scenario','roles','source','invocation']) {
    check(Array.isArray(s[key]) ? s[key].length > 0 : Boolean(String(s[key] || '').trim()), `${s.name} 缺少 ${key}`);
  }
  check(s.invocation.startsWith(`$${s.plugin}:${s.name}`), `${s.name} 的 Codex 调用格式不正确`);
  check(fs.existsSync(path.join(sourceRoot, s.plugin, '2.1.0', ...s.source.split('/').slice(1))), `${s.name} 源文件不存在`);
}
for (const c of commands) {
  for (const key of ['plugin','name','title','description','hint','source','claude','codex']) check(Boolean(String(c[key] || '').trim()), `${c.name} 缺少 ${key}`);
  check(c.claude.startsWith(`/${c.name}`), `${c.name} 的 Claude 调用格式不正确`);
  check(fs.existsSync(path.join(sourceRoot, c.plugin, '2.1.0', ...c.source.split('/').slice(1))), `${c.name} 源文件不存在`);
}
for (const id of ['skillTab','commandTab','q','plugin','phase','role','cardBtn','tableBtn','cards','tablewrap','tbody','count','total','empty']) check(html.includes(`id="${id}"`), `缺少控件 #${id}`);
check(html.includes('@media print'), '缺少打印样式');
check(html.includes('@media(max-width:650px)'), '缺少移动端断点');
check(html.includes('页面不依赖外部脚本'), '缺少离线说明');
check(!/<script[^>]+src=/.test(html), '存在外部脚本依赖');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
check(scripts.length === 1, `内联脚本数量应为 1，实际 ${scripts.length}`);
for (const script of scripts) { try { new Function(script); } catch (e) { failures.push(`前端脚本语法错误：${e.message}`); } }

if (failures.length) {
  console.error(`FAIL (${failures.length})`);
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log('PASS');
console.log(`skills=${skills.length}`);
console.log(`commands=${commands.length}`);
console.log(`plugins=${new Set(skills.map(x => x.plugin)).size}`);
console.log(`source_paths_checked=${skills.length + commands.length}`);
console.log(`inline_scripts_checked=${scripts.length}`);
