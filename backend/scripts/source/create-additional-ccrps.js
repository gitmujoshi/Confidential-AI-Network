#!/usr/bin/env node

/**
 * Create Additional CCRPs Script
 * 
 * This script creates additional CCRP users.
 */

const { User } = require('../../models');
const GlobalDEPAIdService = require('../../services/globalDEPAIdService');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'blue') {
  console.log(`${colors[color]}[ADDITIONAL CCRPS]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

const additionalCCRPs = [
  {
    name: 'Quantum Secure Computing',
    email: 'ccrp.quantum@example.com',
    description: 'Quantum-resistant secure computing environment for sensitive data processing',
    organization: 'Quantum Secure Computing Ltd.',
    location: 'Zurich, Switzerland',
    website: 'https://quantumsecure.com',
    phoneNumber: '+41-44-123-4567'
  },
  {
    name: 'Edge Computing Solutions',
    email: 'ccrp.edge@example.com',
    description: 'Edge computing infrastructure for real-time data processing',
    organization: 'Edge Computing Solutions Inc.',
    location: 'San Francisco, CA',
    website: 'https://edgecomputing.ai',
    phoneNumber: '+1-415-555-0123'
  },
  {
    name: 'Federated Learning Hub',
    email: 'ccrp.federated@example.com',
    description: 'Specialized in federated learning environments for distributed AI training',
    organization: 'Federated Learning Hub',
    location: 'Berlin, Germany',
    website: 'https://federatedhub.de',
    phoneNumber: '+49-30-987-6543'
  },
  {
    name: 'Homomorphic Encryption Labs',
    email: 'ccrp.homomorphic@example.com',
    description: 'Advanced homomorphic encryption for secure computation on encrypted data',
    organization: 'Homomorphic Encryption Labs',
    location: 'Tel Aviv, Israel',
    website: 'https://homomorphic.ai',
    phoneNumber: '+972-3-123-4567'
  },
  {
    name: 'Zero-Knowledge Proof Systems',
    email: 'ccrp.zeroknowledge@example.com',
    description: 'Zero-knowledge proof systems for privacy-preserving computations',
    organization: 'Zero-Knowledge Proof Systems',
    location: 'Singapore',
    website: 'https://zkproof.sg',
    phoneNumber: '+65-6789-0123'
  },
  {
    name: 'Secure Multi-Party Computation',
    email: 'ccrp.multiparty@example.com',
    description: 'Secure multi-party computation environments for collaborative data analysis',
    organization: 'Secure MPC Solutions',
    location: 'Amsterdam, Netherlands',
    website: 'https://securempc.nl',
    phoneNumber: '+31-20-123-4567'
  }
];

async function createAdditionalCCRPs() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}🔒 CREATING ADDITIONAL CCRPS${colors.reset}`);
  console.log('='.repeat(60));
  
  try {
    const depaIdService = new GlobalDEPAIdService();
    
    for (const ccrpData of additionalCCRPs) {
      try {
        log(`🔒 Creating CCRP: ${ccrpData.name} (${ccrpData.email})`);
        
        // Check if user already exists
        const existingUser = await User.findOne({
          where: { email: ccrpData.email }
        });
        
        if (existingUser) {
          logWarning(`CCRP ${ccrpData.email} already exists, skipping...`);
          continue;
        }
        
        // Generate DEPA ID for CCRP
        const depaId = depaIdService.generateGlobalUserDEPAId('CCRP');
        
        // Create CCRP user
        const ccrpUser = await User.create({
          name: ccrpData.name,
          email: ccrpData.email,
          password: 'password123', // Default password
          description: ccrpData.description,
          partyType: 'CCRP',
          organization: ccrpData.organization,
          location: ccrpData.location,
          website: ccrpData.website,
          phoneNumber: ccrpData.phoneNumber,
          isActive: true,
          isRegistered: true,
          depaId: depaId,
          iamUsername: ccrpData.email.split('@')[0], // Use email prefix as IAM username
          profileCompleted: true,
          emailVerified: true,
          cloudProviders: {
            aws: true,
            azure: true,
            gcp: true
          }
        });
        
        logSuccess(`Created CCRP: ${ccrpData.name} with DEPA ID: ${depaId}`);
        
      } catch (error) {
        logError(`Failed to create CCRP ${ccrpData.name}: ${error.message}`);
      }
    }
    
    // Final summary
    console.log(`\n${colors.bold}📊 FINAL SUMMARY:${colors.reset}`);
    console.log('='.repeat(60));
    
    const totalCCRPs = await User.count({ where: { partyType: 'CCRP', isActive: true } });
    
    console.log(`${colors.green}${colors.bold}🎉 ADDITIONAL CCRPS CREATED!${colors.reset}`);
    console.log(`  Total CCRPs: ${totalCCRPs}`);
    
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createAdditionalCCRPs();
}

module.exports = { createAdditionalCCRPs }; 