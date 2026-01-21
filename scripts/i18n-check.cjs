#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const localesDir = path.join(projectRoot, 'src', 'i18n', 'locales');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const walk = (dir, filter) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, filter));
    else if (!filter || filter(full)) out.push(full);
  }
  return out;
};

const flattenKeys = (obj, prefix = '') => {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, p));
    } else {
      keys.push(p);
    }
  }
  return keys;
};

const diff = (a, b) => a.filter((x) => !b.includes(x));

const main = () => {
  const pt = readJson(path.join(localesDir, 'pt-BR.json'));
  const en = readJson(path.join(localesDir, 'en-US.json'));
  const pseudo = fs.existsSync(path.join(localesDir, 'pseudo.json'))
    ? readJson(path.join(localesDir, 'pseudo.json'))
    : {};

  const ptKeys = flattenKeys(pt);
  const enKeys = flattenKeys(en);
  const pseudoKeys = flattenKeys(pseudo);

  let hasError = false;

  const missInEn = diff(ptKeys, enKeys);
  const extraInEn = diff(enKeys, ptKeys);
  if (missInEn.length) {
    console.error('[i18n-check] Missing keys in en-US:', missInEn);
    hasError = true;
  }
  if (extraInEn.length) {
    console.error('[i18n-check] Extra keys in en-US (not in pt-BR):', extraInEn);
    hasError = true;
  }

  if (pseudoKeys.length) {
    const missInPseudo = diff(ptKeys, pseudoKeys);
    const extraInPseudo = diff(pseudoKeys, ptKeys);
    if (missInPseudo.length) {
      console.error('[i18n-check] Missing keys in pseudo:', missInPseudo);
      hasError = true;
    }
    if (extraInPseudo.length) {
      console.error('[i18n-check] Extra keys in pseudo (not in pt-BR):', extraInPseudo);
      hasError = true;
    }
  }

  // Scan source for used keys: t('...') or t("...")
  const srcDir = path.join(projectRoot, 'src');
  const files = walk(srcDir, (f) => /\.(ts|tsx)$/.test(f));
  const used = new Set();
  const keyRegex = /\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = keyRegex.exec(text))) {
      used.add(m[1]);
    }
  }

  const unusedKeys = ptKeys.filter((k) => !used.has(k));
  const missingUsed = Array.from(used).filter((k) => !ptKeys.includes(k));

  if (missingUsed.length) {
    console.error('[i18n-check] Keys used in code but missing from pt-BR:', missingUsed);
    hasError = true;
  }
  // Unused keys are informational; fail only if prefixed with calculator.poder_compra.
  const unusedInCalc = unusedKeys.filter((k) => k.startsWith('calculator.poder_compra.'));
  if (unusedInCalc.length) {
    console.warn('[i18n-check] Unused keys under calculator.poder_compra:', unusedInCalc);
  }

  if (hasError) process.exit(1);
  console.log('[i18n-check] OK');
};

main();
