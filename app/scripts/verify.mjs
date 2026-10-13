import { execSync, spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
};

run('npm test');
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
  run('npm run e2e');
  run('npm run lighthouse');
  console.log('\nverify: all gates passed');
} finally {
  server.kill();
}
