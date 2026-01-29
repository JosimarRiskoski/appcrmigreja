#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsDir = path.join(root, 'docs', 'pages');

function getChangedFiles() {
  try {
    const inside = execSync('git rev-parse --is-inside-work-tree', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (inside !== 'true') return [];
  } catch {
    return [];
  }
  const lists = [];
  try { lists.push(execSync('git diff --name-only', { stdio: ['ignore', 'pipe', 'ignore'] }).toString()); } catch {}
  try { lists.push(execSync('git diff --name-only --cached', { stdio: ['ignore', 'pipe', 'ignore'] }).toString()); } catch {}
  return lists.join('\n').split('\n').map(s => s.trim()).filter(Boolean);
}

function mapDocFilesForPage(pageFile) {
  const base = path.basename(pageFile, '.tsx');
  const candidates = [path.join(docsDir, `${base}.md`)];
  if (base === 'PublicCheckin') candidates.push(path.join(docsDir, 'CheckinPublico.md'));
  return candidates;
}

function main() {
  const changed = getChangedFiles();
  const changedSet = new Set(changed);
  const pagesChanged = changed.filter(f => f.replace(/\\/g, '/').startsWith('src/pages/') && f.endsWith('.tsx'));
  if (pagesChanged.length === 0) process.exit(0);

  const missing = [];
  for (const page of pagesChanged) {
    const docs = mapDocFilesForPage(page);
    const hasDocChanged = docs.some(d => changedSet.has(path.relative(root, d)) || changedSet.has(d));
    const hasDocExists = docs.some(d => fs.existsSync(d));
    if (!hasDocExists || !hasDocChanged) missing.push({ page, expectedDocs: docs.filter(d => fs.existsSync(d)).length ? docs.filter(d => fs.existsSync(d)) : docs });
  }

  if (missing.length > 0) {
    console.error('\n[docs] Atualize a documentação das páginas alteradas:');
    for (const m of missing) {
      console.error(`- Página: ${m.page}`);
      console.error('  Docs esperados (um deles deve existir e estar modificado neste commit):');
      for (const d of m.expectedDocs) console.error(`    • ${d}`);
    }
    console.error('\nDica: edite os arquivos em docs/pages/ e inclua-os no commit.\n');
    process.exit(1);
  }

  process.exit(0);
}

main();
