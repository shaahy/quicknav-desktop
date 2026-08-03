const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.resolve(__dirname, 'mattpocock-skills-cheatsheet.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptBlocks = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
const dataBlock = scriptBlocks.find(script => script.includes('const skills = ['));

const checks = [];
const check = (name, actual, expected) => {
  const ok = actual === expected;
  checks.push({ name, actual, expected, ok });
  if (!ok) process.exitCode = 1;
};

check('one executable script block', scriptBlocks.length, 1);
try {
  new vm.Script(dataBlock, { filename: 'inline-cheatsheet.js' });
  checks.push({ name: 'inline JavaScript parses', ok: true });
} catch (error) {
  checks.push({ name: 'inline JavaScript parses', ok: false, error: error.message });
  process.exitCode = 1;
}

const dataSource = dataBlock.match(/const skills = \[([\s\S]*?)\n\s*\];/)[1];
const htmlSkillNames = [...dataSource.matchAll(/\n\s*name:'([^']+)'/g)].map(match => match[1]).sort();
const promotedSkillNames = ['engineering', 'productivity'].flatMap(bucket =>
  fs.readdirSync(path.join(__dirname, 'source-snapshot', 'skills', bucket), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
).sort();
const candidateSkillNames = ['to-questionnaire', 'batch-grill-me', 'edit-article', 'writing-fragments', 'writing-shape', 'writing-beats', 'wizard'].sort();
const expectedSkillNames = [...promotedSkillNames, ...candidateSkillNames].sort();
check('skill objects', (dataSource.match(/\n\s*name:'/g) || []).length, 29);
check('exact formal and candidate skill names', JSON.stringify(htmlSkillNames), JSON.stringify(expectedSkillNames));
check('engineering objects', (dataSource.match(/category:'Engineering'/g) || []).length, 17);
check('productivity objects', (dataSource.match(/category:'Productivity'/g) || []).length, 5);
check('experimental objects', (dataSource.match(/category:'Experimental'/g) || []).length, 7);
check('user-invoked objects', (dataSource.match(/invocation:'user'/g) || []).length, 20);
check('model-invoked objects', (dataSource.match(/invocation:'model'/g) || []).length, 9);
check('candidate judgments', (dataSource.match(/judgment:'/g) || []).length, 7);
check('worth trying judgments', (dataSource.match(/judgment:'值得试用'/g) || []).length, 2);
check('possibly useful judgments', (dataSource.match(/judgment:'可能有用'/g) || []).length, 1);
check('conditional judgments', (dataSource.match(/judgment:'条件性有用'/g) || []).length, 3);
check('occasional judgments', (dataSource.match(/judgment:'偶尔有用'/g) || []).length, 1);
check('input fields', (dataSource.match(/\n\s*inputs:\[/g) || []).length, 29);
check('output fields', (dataSource.match(/\n\s*outputs:\[/g) || []).length, 29);
check('scenario fields', (dataSource.match(/\n\s*scenarios:\[/g) || []).length, 29);
check('usage fields', (dataSource.match(/\n\s*usage:\[/g) || []).length, 29);
check('boundary fields', (dataSource.match(/\n\s*note:'/g) || []).length, 29);

for (const selector of ['id="search"', 'id="category"', 'id="invocation"', 'id="judgment"', 'id="role"', 'id="skills"', 'prefers-reduced-motion', '@media print']) {
  check(`contains ${selector}`, html.includes(selector), true);
}

console.log(JSON.stringify({ file: htmlPath, bytes: Buffer.byteLength(html), checks }, null, 2));
