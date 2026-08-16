/**
 * Ensure Auditor demo user exists in DB (and optionally Keycloak via sync).
 *
 * Usage:
 *   node backend/scripts/dev/seed-auditor-user.js
 *
 * Then:
 *   cd backend && npm run keycloak:sync
 *   # or ensure realm role Auditor exists: node scripts/source/setup-keycloak-realm.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../config.env') });

const bcrypt = require('bcryptjs');
const db = require('../../models');
const addAuditorPartyType = require('../migration/add-auditor-party-type');

const AUDITOR = {
  email: 'auditor@example.com',
  password: 'password123',
  name: 'Compliance Auditor',
  partyType: 'Auditor',
  organization: 'CAN Audit Office',
  description: 'Read-only auditor for Merkle provenance and contract review',
};

async function seedAuditorUser() {
  await addAuditorPartyType();

  const hashed = await bcrypt.hash(AUDITOR.password, 10);
  let user = await db.User.findOne({ where: { email: AUDITOR.email } });

  if (user) {
    await user.update({
      partyType: 'Auditor',
      name: AUDITOR.name,
      organization: AUDITOR.organization,
      description: AUDITOR.description,
      isRegistered: true,
      isActive: true,
      emailVerified: true,
      onboardingStatus: 'COMPLETED',
    });
    console.log(`✅ Updated existing auditor: ${AUDITOR.email} (id=${user.id})`);
  } else {
    user = await db.User.create({
      email: AUDITOR.email,
      password: hashed,
      name: AUDITOR.name,
      partyType: 'Auditor',
      organization: AUDITOR.organization,
      description: AUDITOR.description,
      isRegistered: true,
      isActive: true,
      emailVerified: true,
      onboardingStatus: 'COMPLETED',
      firstLogin: false,
    });
    console.log(`✅ Created auditor: ${AUDITOR.email} (id=${user.id})`);
  }

  console.log('');
  console.log('Login (DB password; after keycloak:sync use KEYCLOAK_SYNC_DEFAULT_PASSWORD):');
  console.log(`  email:    ${AUDITOR.email}`);
  console.log(`  password: ${AUDITOR.password}  (local) / TestNewPassword123! (typical after sync)`);
  console.log('  UI:       /auditor/dashboard');
  console.log('');
  console.log('Next: create Keycloak role Auditor if missing, then npm run keycloak:sync');
}

if (require.main === module) {
  seedAuditorUser()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('💥 Seed failed:', err);
      process.exit(1);
    });
}

module.exports = seedAuditorUser;
