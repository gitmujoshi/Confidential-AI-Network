/**
 * SCITT CCF API Routes
 * 
 * Provides RESTful API endpoints for SCITT CCF Ledger operations
 * including contract management, claims processing, and health monitoring.
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2025-01-08
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const ScittCcfService = require('../services/scittCcfService');
const ContractRouterService = require('../services/contractRouterService');
const SystemHealthMonitor = require('../services/systemHealthMonitor');

// Initialize services
const scittCcfService = new ScittCcfService();
const contractRouter = new ContractRouterService();
const healthMonitor = new SystemHealthMonitor();

// Initialize services asynchronously
let servicesInitialized = false;

async function initializeServices() {
  if (servicesInitialized) return;
  
  try {
    console.log('🔧 Initializing SCITT CCF services...');
    
    // Initialize SCITT CCF service
    await scittCcfService.initialize();
    console.log('✅ SCITT CCF service initialized');
    
    // Initialize contract router service
    await contractRouter.initialize();
    console.log('✅ Contract router service initialized');
    
    // Initialize health monitor
    await healthMonitor.startMonitoring();
    console.log('✅ Health monitor started');
    
    servicesInitialized = true;
    console.log('🎉 All SCITT CCF services initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize SCITT CCF services:', error.message);
    servicesInitialized = false;
    throw error;
  }
}

// Initialize services when the module is loaded
initializeServices().catch(error => {
  console.error('❌ SCITT CCF services initialization failed:', error.message);
});

// Health and Status Endpoints
router.get('/health', async (req, res) => {
  try {
    const health = await healthMonitor.checkScittCcfHealth();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      scittCcf: health
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'SCITT CCF service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const metrics = await scittCcfService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
});

// Contract Operations
router.post('/contracts', authenticateToken, async (req, res) => {
  try {
    // Ensure services are initialized
    if (!servicesInitialized) {
      await initializeServices();
    }
    
    const contractData = req.body;
    console.log('🔍 Route Debug - contractData:', JSON.stringify(contractData, null, 2));
    console.log('🔍 Route Debug - contractData.contractId:', contractData.contractId);
    
    const result = await contractRouter.createContract(contractData);
    
    res.status(201).json({
      success: true,
      source: 'SCITT_CCF',
      claimId: result.claimId,
      receipt: result.receipt,
      contractId: result.contractId,
      message: 'Contract created successfully in SCITT CCF'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Contract creation failed',
      message: error.message
    });
  }
});

router.get('/contracts/:claimId/status', authenticateToken, async (req, res) => {
  try {
    const { claimId } = req.params;
    const status = await scittCcfService.getContractStatus(claimId);
    
    res.json({
      claimId,
      status: status.status,
      timestamp: new Date().toISOString(),
      contractId: status.contractId
    });
  } catch (error) {
    res.status(404).json({
      error: 'Contract status not found',
      message: error.message
    });
  }
});

router.get('/contracts', authenticateToken, async (req, res) => {
  try {
    const contracts = await scittCcfService.listContracts(req.user.id);
    res.json({ contracts });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve contracts',
      message: error.message
    });
  }
});

// Claims Management
router.post('/claims', authenticateToken, async (req, res) => {
  try {
    const claimData = req.body;
    const result = await scittCcfService.submitGeneralClaim(claimData);
    
    res.status(201).json({
      claimId: result.claimId,
      status: 'submitted',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      error: 'Claim submission failed',
      message: error.message
    });
  }
});

router.get('/claims/:claimId', authenticateToken, async (req, res) => {
  try {
    const { claimId } = req.params;
    const claim = await scittCcfService.getClaim(claimId);
    
    res.json({
      claimId: claim.claimId,
      type: claim.type,
      data: claim.data,
      status: claim.status
    });
  } catch (error) {
    res.status(404).json({
      error: 'Claim not found',
      message: error.message
    });
  }
});

router.get('/claims', authenticateToken, async (req, res) => {
  try {
    const claims = await scittCcfService.listClaims(req.user.id);
    res.json({ claims });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve claims',
      message: error.message
    });
  }
});

// TEE Attestation
router.post('/contracts/:contractId/verify-attestation', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const attestation = await scittCcfService.verifyTeeAttestation(contractId);
    
    res.json({
      verified: attestation.verified,
      teeProvider: attestation.teeProvider,
      attestationReport: attestation.attestationReport
    });
  } catch (error) {
    res.status(500).json({
      error: 'Attestation verification failed',
      message: error.message
    });
  }
});

router.get('/contracts/:contractId/attestation', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const attestation = await scittCcfService.getAttestationStatus(contractId);
    
    res.json({
      attestationVerified: attestation.verified,
      attestationReport: attestation.report,
      teeProvider: attestation.provider
    });
  } catch (error) {
    res.status(404).json({
      error: 'Attestation status not found',
      message: error.message
    });
  }
});

// Migration Management
router.get('/migration/mode', authenticateToken, async (req, res) => {
  try {
    const mode = contractRouter.getMigrationMode();
    const description = getMigrationModeDescription(mode);
    
    res.json({
      mode,
      description,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get migration mode',
      message: error.message
    });
  }
});

router.put('/migration/mode', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { mode } = req.body;
    const result = await contractRouter.switchMigrationMode(mode);
    
    res.json({
      mode: result.migrationMode,
      description: getMigrationModeDescription(result.migrationMode),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      error: 'Invalid migration mode',
      message: error.message
    });
  }
});

router.get('/migration/status', authenticateToken, async (req, res) => {
  try {
    const status = await contractRouter.getMigrationStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get migration status',
      message: error.message
    });
  }
});

router.post('/migration/contracts/:contractId', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const result = await contractRouter.migrateContract(contractId);
    
    res.json({
      success: true,
      contractId,
      scittClaimId: result.scittClaimId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Contract migration failed',
      message: error.message
    });
  }
});

// Configuration Management
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const config = await scittCcfService.getConfiguration();
    res.json(config);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get configuration',
      message: error.message
    });
  }
});

router.put('/config', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const configUpdate = req.body;
    const result = await scittCcfService.updateConfiguration(configUpdate);
    
    res.json({
      nodeUrl: result.nodeUrl,
      enabled: result.enabled,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      error: 'Configuration update failed',
      message: error.message
    });
  }
});

// Helper function to get migration mode description
function getMigrationModeDescription(mode) {
  const descriptions = {
    'ETHEREUM_ONLY': 'Using only traditional Ethereum blockchain',
    'SCITT_CCF_ONLY': 'Using only SCITT CCF Ledger',
    'HYBRID': 'Using both SCITT CCF and Ethereum'
  };
  return descriptions[mode] || 'Unknown mode';
}

module.exports = router;
