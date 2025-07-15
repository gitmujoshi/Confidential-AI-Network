/**
 * Add Multiple TDPs Support to Contracts
 * 
 * This script adds support for multiple TDPs (up to 3) in contracts with:
 * - Individual payments for each dataset/TDP
 * - Individual signatures from each TDP
 * - Payment tracking for each TDP
 * - Multi-TDP status tracking
 */

const db = require('../models');
const { QueryTypes } = require('sequelize');

async function addMultipleTDPsSupport() {
  try {
    console.log('🚀 Adding Multiple TDPs Support to Contracts...\n');

    // Check if the new columns already exist
    const tableInfo = await db.sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'contracts'",
      { type: QueryTypes.SELECT }
    );
    
    const existingColumns = tableInfo.map(row => row.column_name);
    console.log('📊 Existing columns:', existingColumns);

    // Add new columns if they don't exist
    const newColumns = [
      'primaryDatasetId',
      'primaryTdpId',
      'contractDatasets',
      'datasetCount',
      'tdpCount',
      'totalPrice',
      'tdpSignatures',
      'tdpPayments',
      'multiTdpStatus'
    ];

    for (const column of newColumns) {
      if (!existingColumns.includes(column)) {
        console.log(`➕ Adding column: ${column}`);
        
        let columnDefinition;
        switch (column) {
          case 'primaryDatasetId':
            columnDefinition = 'INTEGER REFERENCES datasets(id)';
            break;
          case 'primaryTdpId':
            columnDefinition = 'INTEGER REFERENCES users(id)';
            break;
          case 'contractDatasets':
            columnDefinition = 'JSON';
            break;
          case 'datasetCount':
            columnDefinition = 'INTEGER DEFAULT 1';
            break;
          case 'tdpCount':
            columnDefinition = 'INTEGER DEFAULT 1';
            break;
          case 'totalPrice':
            columnDefinition = 'DECIMAL(10,2)';
            break;
          case 'tdpSignatures':
            columnDefinition = 'JSON';
            break;
          case 'tdpPayments':
            columnDefinition = 'JSON';
            break;
          case 'multiTdpStatus':
            columnDefinition = "VARCHAR(50) DEFAULT 'PENDING_ALL_TDP_APPROVAL'";
            break;
        }
        
        await db.sequelize.query(
          `ALTER TABLE contracts ADD COLUMN "${column}" ${columnDefinition}`,
          { type: QueryTypes.RAW }
        );
        console.log(`✅ Added column: ${column}`);
        
        // Add constraints after column creation
        if (column === 'datasetCount') {
          await db.sequelize.query(
            `ALTER TABLE contracts ADD CONSTRAINT check_dataset_count CHECK ("datasetCount" >= 1 AND "datasetCount" <= 3)`,
            { type: QueryTypes.RAW }
          );
          console.log(`✅ Added constraint: check_dataset_count`);
        }
        
        if (column === 'tdpCount') {
          await db.sequelize.query(
            `ALTER TABLE contracts ADD CONSTRAINT check_tdp_count CHECK ("tdpCount" >= 1 AND "tdpCount" <= 3)`,
            { type: QueryTypes.RAW }
          );
          console.log(`✅ Added constraint: check_tdp_count`);
        }
        
        if (column === 'multiTdpStatus') {
          await db.sequelize.query(
            `ALTER TABLE contracts ADD CONSTRAINT check_multi_tdp_status CHECK ("multiTdpStatus" IN ('PENDING_ALL_TDP_APPROVAL', 'PARTIALLY_TDP_APPROVED', 'ALL_TDP_APPROVED', 'PENDING_CCRP_APPROVAL', 'ACTIVE', 'COMPLETED', 'CANCELLED'))`,
            { type: QueryTypes.RAW }
          );
          console.log(`✅ Added constraint: check_multi_tdp_status`);
        }
      } else {
        console.log(`⏭️  Column already exists: ${column}`);
      }
    }

    // Migrate existing data
    console.log('\n🔄 Migrating existing contract data...');
    
    // Update existing contracts to set primaryDatasetId = datasetId and primaryTdpId = tdpId
    const updateResult = await db.sequelize.query(
      `UPDATE contracts 
       SET "primaryDatasetId" = "datasetId", 
           "primaryTdpId" = "tdpId",
           "datasetCount" = 1,
           "tdpCount" = 1,
           "totalPrice" = price,
           "contractDatasets" = json_build_array(
             json_build_object(
               'datasetId', "datasetId",
               'tdpId', "tdpId",
               'datasetName', (SELECT name FROM datasets WHERE id = "datasetId"),
               'tdpName', (SELECT name FROM users WHERE id = "tdpId"),
               'individualPrice', price,
               'paymentStatus', 'PENDING'
             )
           ),
           "tdpSignatures" = json_build_object(
             "tdpId", json_build_object(
               'signed', "tdpSigned",
               'signedAt', "tdpSignedAt",
               'paymentAmount', price
             )
           ),
           "tdpPayments" = json_build_object(
             "tdpId", json_build_object(
               'amount', price,
               'status', CASE WHEN "tdpSigned" THEN 'PAID' ELSE 'PENDING' END,
               'paidAt', CASE WHEN "tdpSigned" THEN "tdpSignedAt" ELSE NULL END
             )
           ),
           "multiTdpStatus" = CASE 
             WHEN "tdpSigned" THEN 'ALL_TDP_APPROVED'
             ELSE 'PENDING_ALL_TDP_APPROVAL'
           END
       WHERE "primaryDatasetId" IS NULL`,
      { type: QueryTypes.UPDATE }
    );
    
    console.log(`✅ Migrated ${updateResult[1]} existing contracts`);

    // Verify migration
    const contractCount = await db.Contract.count();
    const migratedCount = await db.Contract.count({
      where: {
        primaryDatasetId: { [db.Sequelize.Op.ne]: null }
      }
    });
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   Total contracts: ${contractCount}`);
    console.log(`   Migrated contracts: ${migratedCount}`);
    console.log(`   Migration success: ${contractCount === migratedCount ? '✅' : '❌'}`);

    // Test the new structure
    console.log('\n🧪 Testing new structure...');
    const testContract = await db.Contract.findOne({
      include: [
        { model: db.User, as: 'tdp' },
        { model: db.User, as: 'tdc' },
        { model: db.Dataset, as: 'dataset' }
      ]
    });

    if (testContract) {
      console.log('✅ Test contract found:');
      console.log(`   Contract ID: ${testContract.contractId}`);
      console.log(`   Primary Dataset ID: ${testContract.primaryDatasetId}`);
      console.log(`   Primary TDP ID: ${testContract.primaryTdpId}`);
      console.log(`   Dataset Count: ${testContract.datasetCount}`);
      console.log(`   TDP Count: ${testContract.tdpCount}`);
      console.log(`   Total Price: $${testContract.totalPrice}`);
      console.log(`   Multi-TDP Status: ${testContract.multiTdpStatus}`);
      console.log(`   Dataset Name: ${testContract.dataset?.name}`);
      console.log(`   TDP Name: ${testContract.tdp?.name}`);
    }

    console.log('\n🎉 Multiple TDPs support added successfully!');
    console.log('\n📋 New Features:');
    console.log('   ✅ Support for up to 3 datasets from different TDPs');
    console.log('   ✅ Individual payments for each dataset/TDP');
    console.log('   ✅ Individual signatures from each TDP');
    console.log('   ✅ Payment tracking for each TDP');
    console.log('   ✅ Multi-TDP status tracking');
    console.log('   ✅ Backward compatibility with existing contracts');

  } catch (error) {
    console.error('❌ Error adding multiple TDPs support:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Run the migration
addMultipleTDPsSupport(); 