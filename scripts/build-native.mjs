import { rename, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const proxyPath = new URL('../src/proxy.ts', import.meta.url);
const disabledProxyPath = new URL('../src/proxy.native-disabled.ts', import.meta.url);

async function run() {
  await rm(new URL('../out', import.meta.url), { recursive: true, force: true });
  await rename(proxyPath, disabledProxyPath);
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
        stdio: 'inherit',
        env: { ...process.env, HEATMAPS_NATIVE_EXPORT: '1' },
      });
      child.on('error', reject);
      child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Native asset build failed (${code})`)));
    });
  } finally {
    await rename(disabledProxyPath, proxyPath);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
