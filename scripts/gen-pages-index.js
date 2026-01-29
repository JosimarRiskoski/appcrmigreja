#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.join(root, 'src', 'App.tsx');
const pagesDir = path.join(root, 'src', 'pages');
const outPath = path.join(root, 'docs', 'pages', '_index.md');

const src = fs.readFileSync(appPath, 'utf8');

const importMap = new Map();
const importRegex = /import\s+(\w+)\s+from\s+"([^"]+)"/g;
let m;
while ((m = importRegex.exec(src))) {
  const name = m[1];
  const rel = m[2];
  if (rel.includes('/pages/')) {
    const resolved = path.normalize(path.join(root, 'src', rel.replace(/^\.\//, '')) + '.tsx');
    importMap.set(name, resolved);
  }
}

const lazyMap = new Map();
const lazyRegex = /const\s+(\w+)\s*=\s*React\.lazy\(\(\)\s*=>\s*import\("([^"]+)"\)\)/g;
while ((m = lazyRegex.exec(src))) {
  const name = m[1];
  const rel = m[2];
  const resolved = path.normalize(path.join(root, 'src', rel.replace(/^\.\//, '')) + '.tsx');
  lazyMap.set(name, resolved);
}

const routes = [];
const routeRegex = /<Route\s+path="([^"]+)"\s+element=\{([^}]+)\}/g;
while ((m = routeRegex.exec(src))) {
  const route = m[1];
  const element = m[2];
  let comp = null;
  const direct = /<([A-Za-z_][\w]*)\b/.exec(element);
  if (direct) comp = direct[1];
  const compPath = importMap.get(comp) || lazyMap.get(comp) || null;
  routes.push({ route, component: comp || 'inline', file: compPath ? path.relative(root, compPath) : 'inline' });
}

const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
const pageSet = new Set(pageFiles.map(f => f.replace(/\.tsx$/, '')));

const lines = [];
lines.push('# Índice de Páginas');
for (const r of routes) {
  lines.push(`- ${r.component} — \`${r.file}\` — rota: \`${r.route}\``);
}
for (const p of Array.from(pageSet).sort()) {
  const has = routes.some(r => (r.file.endsWith(`src\\pages\\${p}.tsx`) || r.file.endsWith(`src/pages/${p}.tsx`) || r.component === p));
  if (!has) {
    lines.push(`- ${p} — \`src/pages/${p}.tsx\` — rota: (não mapeada em App.tsx)`);
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join('\n') + '\n');
