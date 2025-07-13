/**
 * Check Ricardian Contract Fields
 * 
 * This script checks what Ricardian contract fields are present in the database
 * and displays them to understand the data structure.
 */

const db = require('./models');

async function checkRicardianContracts() {
  try {
    console.log('🔍 Checking Ricardian Contract Fields...\n');

    // Get all contracts
    const contracts = await db.Contract.findAll({
      include: [
        { model: db.User, as: 'tdp', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.User, as: 'tdc', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.User, as: 'ccrp', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.Dataset, as: 'dataset', attributes: ['id', 'name', 'description', 'category', 'price'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    if (contracts.length === 0) {
      console.log('❌ No contracts found in database');
      return;
    }

    console.log(`📊 Found ${contracts.length} contracts. Checking Ricardian fields...\n`);

    contracts.forEach((contract, index) => {
      console.log(`📋 Contract ${index + 1}: ${contract.contractId}`);
      console.log(`   Status: ${contract.status}`);
      console.log(`   Created: ${contract.createdAt}`);
      
      // Check Ricardian fields
      const ricardianFields = {
        legalDocumentHash: contract.legalDocumentHash,
        ricardianSignature: contract.ricardianSignature,
        smartContractAddress: contract.smartContractAddress,
        smartContractNetwork: contract.smartContractNetwork,
        blockchainContractId: contract.blockchainContractId,
        legalDocument: contract.legalDocument,
        environmentSpecs: contract.environmentSpecs,
        trainingParams: contract.trainingParams,
        kmsConfigs: contract.kmsConfigs,
        attestationVerified: contract.attestationVerified,
        attestationReport: contract.attestationReport,
        multiTdpStatus: contract.multiTdpStatus,
        totalPrice: contract.totalPrice,
        datasetCount: contract.datasetCount,
        tdpCount: contract.tdpCount,
        contractDatasets: contract.contractDatasets,
        tdpSignatures: contract.tdpSignatures,
        tdpPayments: contract.tdpPayments
      };

      console.log('   Ricardian Fields:');
      Object.entries(ricardianFields).forEach(([field, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === 'object') {
            console.log(`     ✅ ${field}: [Object] ${JSON.stringify(value).substring(0, 100)}...`);
          } else {
            console.log(`     ✅ ${field}: ${value}`);
          }
        } else {
          console.log(`     ❌ ${field}: null/undefined`);
        }
      });

      // Check if this is a Ricardian contract
      const hasRicardianFields = Object.values(ricardianFields).some(value => 
        value !== null && value !== undefined
      );

      if (hasRicardianFields) {
        console.log('   🎯 This appears to be a Ricardian contract');
      } else {
        console.log('   📝 This appears to be a regular contract');
      }

      console.log('');
    });

    // Check database schema
    console.log('🔍 Checking database schema for Ricardian fields...');
    const tableInfo = await db.sequelize.query(
      "PRAGMA table_info(contracts);",
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const ricardianColumns = tableInfo.filter(col => 
      col.name.toLowerCase().includes('legal') ||
      col.name.toLowerCase().includes('ricardian') ||
      col.name.toLowerCase().includes('smart') ||
      col.name.toLowerCase().includes('attestation') ||
      col.name.toLowerCase().includes('training') ||
      col.name.toLowerCase().includes('environment') ||
      col.name.toLowerCase().includes('kms') ||
      col.name.toLowerCase().includes('multi')
    );

    console.log('   Ricardian columns in database:');
    ricardianColumns.forEach(col => {
      console.log(`     📊 ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
    });

  } catch (error) {
    console.error('❌ Error checking Ricardian contracts:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkRicardianContracts(); 