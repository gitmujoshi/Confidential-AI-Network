#!/usr/bin/env node
/**
 * Idempotently adds training_jobs.metadata (JSONB) if missing.
 * Run from repo root: node backend/scripts/ensure-training-jobs-metadata.js
 * Or: npm run db:ensure-training-metadata --prefix backend
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../config.env') });

const { Sequelize } = require('sequelize');

async function main() {
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD || undefined,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: '***REMOVED-DB_PASSWORD***',
      logging: false,
      dialectOptions: { family: 4 },
    }
  );

  const qi = sequelize.getQueryInterface();
  try {
    await qi.addColumn('training_jobs', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Job state, phases, simulation results, container snapshot refs',
    });
    console.log('✅ Added column training_jobs.metadata');
  } catch (e) {
    if (
      String(e.message).includes('already exists') ||
      String(e.message).includes('duplicate')
    ) {
      console.log('ℹ️  Column training_jobs.metadata already present — nothing to do');
    } else {
      console.error('❌', e.message);
      process.exitCode = 1;
    }
  } finally {
    await sequelize.close();
  }
}

main();
