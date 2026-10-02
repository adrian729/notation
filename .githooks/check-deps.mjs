import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const allowed = JSON.parse(readFileSync('.githooks/deps.json', 'utf8'));
const manifests = execFileSync('git', ['ls-files', 'package.json', '*/package.json'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
const problems = [];
for (const path of manifests) {
  const json = JSON.parse(readFileSync(path, 'utf8'));
  if (!json.name?.startsWith('@polyhymnia/')) continue;
  const deps = { ...json.dependencies, ...json.devDependencies, ...json.peerDependencies };
  const actual = Object.keys(deps)
    .filter((name) => name.startsWith('@polyhymnia/'))
    .sort()
    .join(', ');
  const expected = [...(allowed[json.name] ?? [])].sort().join(', ');
  if (actual !== expected) problems.push(`  ${json.name}: [${actual}], allowed [${expected}]`);
}
if (problems.length > 0) {
  console.error(`Dependency chain change. Ask the user (or update .githooks/deps.json).\n${problems.join('\n')}`);
  process.exit(1);
}
