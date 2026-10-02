import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sources = {
  '@polyhymnia/mnx': 'notation/packages/mnx',
  '@polyhymnia/mnx-score': 'notation/packages/mnx-score',
  '@polyhymnia/notation-fonts': 'notation/packages/notation-fonts',
  '@polyhymnia/notation-engine': 'notation/packages/notation-engine',
  '@polyhymnia/notation-react': 'notation/packages/notation-react',
  '@polyhymnia/music-theory': 'music-theory',
  '@polyhymnia/web-audio': 'web-audio',
};

const root = resolve(process.env.POLYHYMNIA_SRC ?? '..');
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const names = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).filter((name) => name in sources);

if (process.argv[2] === 'unlink') {
  execFileSync('pnpm', ['unlink', ...names], { stdio: 'inherit' });
} else {
  execFileSync('pnpm', ['link', ...names.map((name) => resolve(root, sources[name]))], { stdio: 'inherit' });
}
