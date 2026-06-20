#!/usr/bin/env node
/**
 * One-shot codemod: CCRP → TSP in application source (not docs/archive/marketing).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

const TARGET_DIRS = [
  path.join(ROOT, 'backend/routes'),
  path.join(ROOT, 'backend/services'),
  path.join(ROOT, 'backend/middleware'),
  path.join(ROOT, 'backend/utils'),
  path.join(ROOT, 'backend/models'),
  path.join(ROOT, 'backend/tests'),
  path.join(ROOT, 'frontend/src'),
  path.join(ROOT, 'scripts'),
  path.join(ROOT, 'fixtures'),
];

const SKIP_FILE_RE = /node_modules|\.git|rename-ccrp-to-tsp/;

const REPLACEMENTS = [
  ['ccrpCloudProvider', 'tspCloudProvider'],
  ['ccrpAzure', 'tspAzure'],
  ['ccrpSignedAt', 'tspSignedAt'],
  ['ccrpSigned', 'tspSigned'],
  ['ccrpUserId', 'tspUserId'],
  ['ccrpId', 'tspId'],
  ['CCRPCloudCredentials', 'TSPCloudCredentials'],
  ['CCRPAzureCredentials', 'TSPAzureCredentials'],
  ['CCRPEnvironmentMonitoring', 'TSPEnvironmentMonitoring'],
  ['ccrpConstraints', 'tspConstraints'],
  ['MultiCCRPSelector', 'MultiTSPSelector'],
  ['CCRPDashboard', 'TSPDashboard'],
  ['ccrpDashboard', 'tspDashboard'],
  ['availableCcrpUsers', 'availableTspUsers'],
  ['selectedCcrpUser', 'selectedTspUser'],
  ['selectedCcrp', 'selectedTsp'],
  ['onCcrpToggle', 'onTspToggle'],
  ['ccrpUsers', 'tspUsers'],
  ['ccrpUser', 'tspUser'],
  ['isCCRP', 'isTSP'],
  ['requireCCRP', 'requireTSP'],
  ['PENDING_CCRP_APPROVAL', 'PENDING_TSP_APPROVAL'],
  ['PENDING_CCRP', 'PENDING_TSP'],
  ['Confidential Clean Room Provider', 'Tech Service Provider'],
  ['Confidential Clean Room', 'Tech Service Provider'],
  ['ccrpCloudProviders', 'tspCloudProviders'],
  ['CcrpCloudProviders', 'TspCloudProviders'],
  ['CCRPCloudProviders', 'TSPCloudProviders'],
  ['ccrpAzureCredentials', 'tspAzureCredentials'],
  ['CCRPAzureCredentials', 'TSPAzureCredentials'],
  ['ccrpRouter', 'tspRouter'],
  ["from './pages/CCRP'", "from './pages/TSP'"],
  ["from '../pages/CCRP'", "from '../pages/TSP'"],
  ["'CCRP'", "'TSP'"],
  ['"CCRP"', '"TSP"'],
  ['/api/ccrp/', '/api/tsp/'],
  ['/api/ccrp', '/api/tsp'],
  ['`/ccrp/', '`/tsp/'],
  ['path="/ccrp', 'path="/tsp'],
  ['to="/ccrp', 'to="/tsp'],
  ['navigate(\'/ccrp', 'navigate(\'/tsp'],
  ['href="/ccrp', 'href="/tsp'],
  ['ccrp.yotta', 'tsp.yotta'],
  ['ccrp.esds', 'tsp.esds'],
  ['slug: \'ccrp\'', "slug: 'tsp'"],
  ['.ccrp.', '.tsp.'],
  ['@in-fintech-test.com', '@in-fintech-test.com'], // no-op anchor
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'archive') continue;
      walk(full, files);
    } else if (/\.(js|jsx|json|md|sh)$/.test(entry.name) && !SKIP_FILE_RE.test(full)) {
      files.push(full);
    }
  }
  return files;
}

function transform(content, filePath) {
  if (/can-ccr|CANCcr|canCcr/i.test(filePath) && !/tsp/i.test(filePath)) {
    return content;
  }
  let next = content;
  for (const [from, to] of REPLACEMENTS) {
    if (from === to) continue;
    next = next.split(from).join(to);
  }
  // Remaining identifiers (avoid can-ccr paths)
  next = next.replace(/\bccrp\b/g, (match, offset, str) => {
    const slice = str.slice(Math.max(0, offset - 8), offset + 4);
    if (/can-?ccr/i.test(slice)) return match;
    return 'tsp';
  });
  next = next.replace(/\bCCRP\b/g, 'TSP');
  return next;
}

let changed = 0;
for (const dir of TARGET_DIRS) {
  for (const file of walk(dir)) {
    const original = fs.readFileSync(file, 'utf8');
    const updated = transform(original, file);
    if (updated !== original) {
      fs.writeFileSync(file, updated);
      changed += 1;
      console.log('updated', path.relative(ROOT, file));
    }
  }
}

console.log(`\n✅ Updated ${changed} files`);
