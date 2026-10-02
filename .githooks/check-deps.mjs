import { execFileSync } from 'node:child_process';

if (process.env.ALLOW_DEPS === '1') process.exit(0);

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const show = (rev) => {
  try {
    return JSON.parse(git('show', rev));
  } catch {
    return {};
  }
};

const fields = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
  'bundleDependencies',
  'bundledDependencies',
  'overrides',
  'resolutions',
  'pnpm',
  'packageManager',
];
const lifecycle = [
  'preinstall',
  'install',
  'postinstall',
  'prepare',
  'prepack',
  'postpack',
  'prepublish',
  'prepublishOnly',
  'publish',
  'postpublish',
  'preuninstall',
  'uninstall',
  'postuninstall',
];
const pick = (json) =>
  JSON.stringify([fields.map((f) => json[f] ?? null), lifecycle.map((s) => json.scripts?.[s] ?? null)]);

const staged = git('diff', '--cached', '--name-only', '--no-renames').split('\n').filter(Boolean);
const hits = staged.filter((path) => {
  if (path === 'pnpm-lock.yaml' || path === 'pnpm-workspace.yaml' || path.startsWith('patches/')) return true;
  if (path !== 'package.json' && !path.endsWith('/package.json')) return false;
  return pick(show(`HEAD:${path}`)) !== pick(show(`:${path}`));
});

if (hits.length > 0) {
  console.error(`Dependency chain change. Ask the user.\n${hits.map((p) => `  ${p}`).join('\n')}`);
  process.exit(1);
}
