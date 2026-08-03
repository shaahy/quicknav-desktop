const fs = require('fs');
const path = require('path');

const root = __dirname;
const planPath = path.join(root, 'docs', 'superpowers', 'plans', '2026-07-16-codex-call-examples-plan.md');
const buildPath = path.join(root, 'build-html.js');
const plan = fs.readFileSync(planPath, 'utf8');
const examples = new Map();

for (const line of plan.split(/\r?\n/)) {
  const match = line.match(/^\| ([a-z0-9-]+) \| `([^`]+)` \|$/);
  if (match) examples.set(match[1], match[2]);
}

if (examples.size !== 52) {
  throw new Error(`计划中应有 52 条示例，实际为 ${examples.size}`);
}

let changed = 0;
const lines = fs.readFileSync(buildPath, 'utf8').split(/\r?\n/).map((line) => {
  const nameMatch = line.match(/^\s*\{name:'([^']+)'/);
  if (!nameMatch || !examples.has(nameMatch[1])) return line;
  if (!line.includes(',usage:')) throw new Error(`${nameMatch[1]} 缺少 usage 字段`);
  const example = examples.get(nameMatch[1]).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const updated = line.replace(/,usage:'[^']*'/, `,example:'${example}'`);
  if (updated === line) throw new Error(`${nameMatch[1]} 的 usage 替换失败`);
  changed += 1;
  return updated;
});

if (changed !== 52) throw new Error(`应迁移 52 条技能，实际为 ${changed}`);

const output = lines.join('\n').replaceAll("phase:'方案设计'", "phase:'方案'");
if (output.includes(',usage:')) throw new Error('迁移后仍存在 usage 字段');
if (output.includes("phase:'方案设计'")) throw new Error('迁移后仍存在方案设计阶段');

fs.writeFileSync(buildPath, output, 'utf8');
console.log(`migrated=${changed}`);
console.log('phase=分析,规划,方案,实施,任意阶段');
