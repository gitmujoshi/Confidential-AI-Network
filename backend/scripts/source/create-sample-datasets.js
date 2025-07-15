const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: '***REMOVED-DB_PASSWORD***',
    logging: false
  }
);

async function createSampleDatasets() {
  try {
    console.log('📊 Creating sample datasets...');
    const now = new Date();
    // Get TDP user id
    const [tdpUser] = (await sequelize.query(
      `SELECT id FROM users WHERE "partyType" = 'TDP' AND email = 'tdpuser@example.com' LIMIT 1;`
    ))[0];
    if (!tdpUser) throw new Error('TDP user not found');
    const ownerId = tdpUser.id;
    const datasets = [
      {
        datasetId: 'ds-cv-001',
        name: 'Medical Images Dataset',
        description: 'De-identified X-ray images for research',
        category: 'Computer Vision',
        size: 5000, // MB
        recordCount: 10000,
        price: 1.5, // ETH
        license: 'CC-BY-4.0',
        ownerId,
        isActive: true,
        isPublic: true,
        metadata: JSON.stringify({ source: 'Hospital A', year: 2023 }),
        createdAt: now,
        updatedAt: now
      },
      {
        datasetId: 'ds-nlp-001',
        name: 'Clinical Notes Dataset',
        description: 'De-identified clinical notes for NLP tasks',
        category: 'Natural Language Processing',
        size: 200, // MB
        recordCount: 50000,
        price: 0.8, // ETH
        license: 'CC-BY-NC-4.0',
        ownerId,
        isActive: true,
        isPublic: true,
        metadata: JSON.stringify({ source: 'Hospital B', year: 2022 }),
        createdAt: now,
        updatedAt: now
      },
      {
        datasetId: 'ds-tabular-001',
        name: 'Financial Transactions',
        description: 'Anonymized credit card transactions',
        category: 'Tabular',
        size: 100, // MB
        recordCount: 20000,
        price: 0.3, // ETH
        license: 'CC-BY-ND-4.0',
        ownerId,
        isActive: true,
        isPublic: false,
        metadata: JSON.stringify({ source: 'Bank C', year: 2021 }),
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const ds of datasets) {
      await sequelize.query(
        `INSERT INTO datasets ("datasetId", name, description, category, size, "recordCount", price, license, "ownerId", "isActive", "isPublic", metadata, "createdAt", "updatedAt")
         VALUES (:datasetId, :name, :description, :category, :size, :recordCount, :price, :license, :ownerId, :isActive, :isPublic, :metadata::jsonb, :createdAt, :updatedAt)
         ON CONFLICT ("datasetId") DO NOTHING`,
        { replacements: ds }
      );
      console.log(`✅ Created dataset: ${ds.name}`);
    }
    await sequelize.close();
    console.log('🎉 Sample datasets created successfully!');
  } catch (error) {
    console.error('❌ Error creating sample datasets:', error);
    process.exit(1);
  }
}

createSampleDatasets(); 