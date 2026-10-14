import { execSync, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
};
/** Runs a command, shows its output and returns it (colour codes stripped) so counts can be read from it. */
const runCapture = (cmd) => {
  console.log(`\n$ ${cmd}`);
  const out = execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] });
  process.stdout.write(out);
  return out.replace(/\u001b\[[0-9;]*m/g, '');
};
const count = (text, re) => Number(re.exec(text)?.[1] ?? 0);

const unit = count(runCapture('npm test'), /Tests\s+(\d+) passed/);
run('npm run check:contrast');
run('npm run portrait');
run('npm run build');
run('npm run check:privacy');

const server = spawn(process.execPath, [join(root, 'scripts', 'serve.mjs'), '4300'], { cwd: root, stdio: 'ignore' });
try {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch('http://localhost:4300/')).ok) break; } catch { /* wait */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  const e2e = count(runCapture('npm run e2e'), /(\d+) passed/);
  run('npm run lighthouse');
  // shown on the easter egg sheet by the next build (scripts/build-docs.mjs reads this file)
  writeFileSync(join(root, 'test-counts.json'), JSON.stringify({ unit, e2e }) + '\n');
  console.log('\nverify: all gates passed');
} finally {
  server.kill();
}
