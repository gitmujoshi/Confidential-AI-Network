const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config({ path: './config.env' });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: false
});

async function addTrainingEnvironmentFields() {
  try {
    console.log('🔄 Adding training environment infrastructure fields to contracts table...');

    // Add infrastructure configuration fields
    await sequelize.query(`
      ALTER TABLE "contracts" 
      ADD COLUMN IF NOT EXISTS "infrastructureConfig" JSONB,
      ADD COLUMN IF NOT EXISTS "environmentStatus" VARCHAR(50) DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS "environmentId" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "environmentUrl" VARCHAR(500),
      ADD COLUMN IF NOT EXISTS "environmentCreatedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "environmentDestroyedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "provisioningLogs" TEXT,
      ADD COLUMN IF NOT EXISTS "securityConfig" JSONB,
      ADD COLUMN IF NOT EXISTS "monitoringConfig" JSONB,
      ADD COLUMN IF NOT EXISTS "costEstimate" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "actualCost" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "billingPeriod" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "resourceQuotas" JSONB,
      ADD COLUMN IF NOT EXISTS "complianceConfig" JSONB;
    `);

    console.log('✅ Training environment fields added successfully');

    // Create TrainingEnvironment model for detailed tracking
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "training_environments" (
        "id" SERIAL PRIMARY KEY,
        "contractId" VARCHAR(255) NOT NULL,
        "environmentId" VARCHAR(255) UNIQUE NOT NULL,
        "cloudProvider" VARCHAR(50) NOT NULL,
        "region" VARCHAR(100) NOT NULL,
        "status" VARCHAR(50) DEFAULT 'PENDING',
        "infrastructureConfig" JSONB NOT NULL,
        "securityConfig" JSONB,
        "monitoringConfig" JSONB,
        "costEstimate" DECIMAL(10,2),
        "actualCost" DECIMAL(10,2),
        "provisioningLogs" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "destroyedAt" TIMESTAMP,
        "createdBy" INTEGER,
        "updatedBy" INTEGER
      );
    `);

    console.log('✅ Training environments table created successfully');

    // Create EnvironmentResources model for resource tracking
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "environment_resources" (
        "id" SERIAL PRIMARY KEY,
        "environmentId" VARCHAR(255) NOT NULL,
        "resourceType" VARCHAR(100) NOT NULL,
        "resourceId" VARCHAR(255) NOT NULL,
        "resourceName" VARCHAR(255),
        "resourceConfig" JSONB,
        "status" VARCHAR(50) DEFAULT 'PENDING',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "destroyedAt" TIMESTAMP
      );
    `);

    console.log('✅ Environment resources table created successfully');

    // Create EnvironmentCosts model for cost tracking
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "environment_costs" (
        "id" SERIAL PRIMARY KEY,
        "environmentId" VARCHAR(255) NOT NULL,
        "resourceId" VARCHAR(255),
        "costType" VARCHAR(100) NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "currency" VARCHAR(10) DEFAULT 'USD',
        "billingPeriod" VARCHAR(50),
        "billingDate" DATE,
        "description" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Environment costs table created successfully');

    console.log('🎉 All training environment infrastructure tables created successfully!');

  } catch (error) {
    console.error('❌ Error adding training environment fields:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

addTrainingEnvironmentFields(); 