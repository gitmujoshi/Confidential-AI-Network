#!/usr/bin/env node
/**
 * Keep at most two TSPs advertising Local (Docker) for demos/E2E:
 *   - ccrp.e2e@test.com          (static E2E)
 *   - tsp.local@jurisdiction-test.com
 *
 * Other TSPs lose Local and get regional cloud providers when known.
 * Ephemeral lifecycle.tsp.* users lose Local (historical contracts stay intact).
 *
 * Usage:
 *   node scripts/trim-local-tsps.js
 *   DRY_RUN=1 node scripts/trim-local-tsps.js
 */

const path = require('path');
const fs = require('fs');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) return;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    });
}

loadEnvFile(path.join(__dirname, '..', 'config.env'));
loadEnvFile(path.join(__dirname, '..', 'secrets.env'));

const KEEP_LOCAL = new Set([
  'ccrp.e2e@test.com',
  'tsp.local@jurisdiction-test.com',
]);

/** Preferred non-Local providers when stripping Local. */
const PROVIDER_BY_EMAIL = {
  'tsp.us-east@jurisdiction-test.com': ['AWS'],
  'tsp.eu-west@jurisdiction-test.com': ['Azure'],
  'tsp.ap-se@jurisdiction-test.com': ['AWS'],
  'tsp.ca-central@jurisdiction-test.com': ['Azure'],
  'tsp.yotta@in-fintech-test.com': ['OCI'],
  'tsp.esds@in-fintech-test.com': ['Azure'],
  'ccrp.demo@local.test': ['Azure'],
};

function asProviders(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (_) {
      return value ? [value] : [];
    }
  }
  return [];
}

function withoutLocal(providers) {
  return providers.filter((p) => String(p).toLowerCase() !== 'local');
}

async function main() {
  const dryRun = String(process.env.DRY_RUN || '').toLowerCase() === '1';
  const db = require(path.join(__dirname, '..', 'backend', 'models'));
  await db.sequelize.authenticate();

  const users = await db.User.findAll({
    where: { partyType: ['TSP', 'CCRP'] },
  });

  console.log(`Found ${users.length} TSP/CCRP users (DRY_RUN=${dryRun ? '1' : '0'})`);
  console.log(`Keeping Local on: ${[...KEEP_LOCAL].join(', ')}`);

  let kept = 0;
  let updated = 0;

  for (const user of users) {
    const email = String(user.email || '').toLowerCase();
    const current = asProviders(user.cloudProviders);
    const hasLocal = current.some((p) => String(p).toLowerCase() === 'local');

    if (KEEP_LOCAL.has(email)) {
      const target = ['Local'];
      if (JSON.stringify(current) !== JSON.stringify(target)) {
        console.log(`✓ keep Local: ${email}  ${JSON.stringify(current)} → ${JSON.stringify(target)}`);
        if (!dryRun) await user.update({ cloudProviders: target });
        updated += 1;
      } else {
        console.log(`· already Local-only: ${email}`);
      }
      kept += 1;
      continue;
    }

    let next = withoutLocal(current);
    if (PROVIDER_BY_EMAIL[email]) {
      next = PROVIDER_BY_EMAIL[email];
    } else if (email.startsWith('lifecycle.tsp.')) {
      next = [];
    } else if (next.length === 0 && hasLocal) {
      next = [];
    }

    if (JSON.stringify(current) === JSON.stringify(next)) {
      if (hasLocal) console.log(`· unchanged (still had Local?): ${email} ${JSON.stringify(current)}`);
      continue;
    }

    console.log(`→ ${email}  ${JSON.stringify(current)} → ${JSON.stringify(next)}`);
    if (!dryRun) await user.update({ cloudProviders: next });
    updated += 1;
  }

  const after = await db.User.findAll({
    where: { partyType: ['TSP', 'CCRP'] },
    attributes: ['email', 'cloudProviders'],
    raw: true,
  });
  const localAfter = after.filter((u) =>
    asProviders(u.cloudProviders).some((p) => String(p).toLowerCase() === 'local')
  );

  console.log(`\nUpdated: ${updated}; Local keepers touched/kept: ${kept}`);
  console.log(`Local TSPs now (${localAfter.length}):`);
  localAfter.forEach((u) => console.log(`  - ${u.email} ${JSON.stringify(u.cloudProviders)}`));

  await db.sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
