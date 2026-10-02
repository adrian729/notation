import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

try {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  if (
    resolve(git('rev-parse', '--show-toplevel')) === resolve(process.cwd()) &&
    git('rev-parse', '--git-dir') === git('rev-parse', '--git-common-dir')
  ) {
    git('config', 'core.hooksPath', '.githooks');
  }
} catch {}
