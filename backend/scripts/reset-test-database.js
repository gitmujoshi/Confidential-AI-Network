#!/usr/bin/env node
/**
 * Disposable test DB: terminate connections, DROP/CREATE DB_NAME from config.test.env,
 * sync schema from Sequelize models, baseline SequelizeMeta so historical migrations
 * are not re-applied (migrations do not bootstrap an empty DB in this repo).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const backendRoot = path.join(__dirname, '..');

require('dotenv').config({ path: path.join(backendRoot, 'config.test.env') });
require('dotenv').config({ path: path.join(backendRoot, '..', 'secrets.env') });

async function terminateDropCreate() {
  const dbName = process.env.DB_NAME || 'contract_management_test';
  const admin = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD === '' ? undefined : process.env.DB_PASSWORD,
    database: 'postgres',
  });
  await admin.connect();
  await admin.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [dbName]
  );
  await admin.query(`DROP DATABASE IF EXISTS "${dbName.replace(/"/g, '""')}"`);
  await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
  await admin.end();
  console.log(`✅ Recreated database "${dbName}"`);
}

async function baselineSequelizeMeta(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
      "name" VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY
    );
  `);
  const migrationsDir = path.join(backendRoot, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.js')).sort();
  for (const name of files) {
    await sequelize.query(
      `INSERT INTO "SequelizeMeta" ("name") VALUES (:name) ON CONFLICT ("name") DO NOTHING`,
      { replacements: { name } }
    );
  }
  console.log(`✅ SequelizeMeta baselined (${files.length} migration names)`);
}

async function main() {
  await terminateDropCreate();
  const { syncTestSchema } = require('../init-test-db');
  const db = require('../models');
  await syncTestSchema();
  await baselineSequelizeMeta(db.sequelize);
  await db.sequelize.close();
  console.log('🎉 Test database reset complete (sync + migration baseline).');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('💥 reset-test-database failed:', err.message);
    process.exit(1);
  });
}

module.exports = { terminateDropCreate, baselineSequelizeMeta };
