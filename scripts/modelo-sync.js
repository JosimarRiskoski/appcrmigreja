#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const templateDir = path.join(root, 'src', 'templates', 'modelo site');
const distSrc = path.join(templateDir, 'dist');
const publicTarget = path.join(root, 'public', 'modelo-site');

function run(cmd, args, cwd) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', cwd, shell: process.platform === 'win32' });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

async function rmDir(dir) {
  await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function copyRecursive(src, dest) {
  const stats = await fs.stat(src);
  if (stats.isDirectory()) {
    await ensureDir(dest);
    const entries = await fs.readdir(src);
    for (const entry of entries) {
      await copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    await ensureDir(path.dirname(dest));
    await fs.copyFile(src, dest);
  }
}

async function main() {
  run('npm', ['run', 'build'], templateDir);
  await rmDir(publicTarget);
  await ensureDir(publicTarget);
  await copyRecursive(distSrc, publicTarget);
  console.log('Modelo site synced to public/modelo-site');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

