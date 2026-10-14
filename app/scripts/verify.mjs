import { execSync, spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// PORT picks the preview port (default 4300), so a gate run never lands on another preview already on that port
const port = process.env.PORT ?? '4300';
process.env.PORT = port;
process.env.BASE_URL ??= `http://localhost:${port}`;
const run = (cmd) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
};

run('npm test');
run('npm run check:contrast');
run('npm run portrait');
run('npm run build');
run('npm run check:privacy');

const server = spawn(process.execPath, [join(root, 'scripts', 'serve.mjs'), port], { cwd: root, stdio: 'ignore' });
try {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`http://localhost:${port}/`)).ok) break; } catch { /* wait */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  run('npm run e2e');
  run('npm run lighthouse');
  console.log('\nverify: all gates passed');
} finally {
  server.kill();
}
