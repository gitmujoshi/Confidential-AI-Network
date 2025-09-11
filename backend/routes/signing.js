const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const keyManagementService = require('../services/keyManagementService');
const db = require('../models');
const { User, Contract, Signature, SigningEvent, UserKey } = db;

// Get key management configuration (public endpoint)
router.get('/config', (req, res) => {
  try {
    const config = keyManagementService.getConfiguration();
    
    // Return only safe configuration (no private keys or sensitive data)
    res.json({
      success: true,
      config: {
        supportedAlgorithms: config.supportedAlgorithms,
        defaultAlgorithm: config.defaultAlgorithm,
        keyIdPrefix: config.keyIdPrefix,
        keyExpiryDays: config.keyExpiryDays,
        encryptionAlgorithm: config.encryptionAlgorithm,
        algorithms: config.supportedAlgorithms.map(alg => ({
          name: alg,
          description: keyManagementService.getAlgorithmDescription(alg),
          info: keyManagementService.getAlgorithmInfo(alg)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching key management config:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch key management configuration' 
    });
  }
});

// Get user's signing keys
router.get('/keys', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    
    const keys = await UserKey.findAll({
      where: { userId, keyStatus: 'active' },
      attributes: ['id', 'keyId', 'keyType', 'keyStatus', 'createdAt', 'lastUsedAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, keys });
  } catch (error) {
    console.error('Error fetching user keys:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch signing keys' 
    });
  }
});

// Generate new signing key
router.post('/keys/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { keyType = 'ECDSA-P256' } = req.body;

    // Generate key pair
    const keyData = await keyManagementService.generateKeyPair({
      algorithm: keyType,
      userId
    });

    // Store key in database
    const userKey = await UserKey.create({
      userId,
      keyId: keyData.keyId,
      keyType: keyData.keyType,
      publicKey: keyData.publicKey,
      keyStatus: 'active',
      createdAt: keyData.createdAt
    });

    // Log key generation event
    await SigningEvent.create({
      userId,
      eventType: 'key_generated',
      eventData: {
        keyId: keyData.keyId,
        keyType: keyData.keyType
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ 
      success: true, 
      key: {
        id: userKey.id,
        keyId: userKey.keyId,
        keyType: userKey.keyType,
        keyStatus: userKey.keyStatus,
        createdAt: userKey.createdAt
      }
    });
  } catch (error) {
    console.error('Error generating key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate signing key' 
    });
  }
});

// Import signing key
router.post('/keys/import', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { keyData, keyType } = req.body;

    // Validate key data
    if (!keyManagementService.validateKeyData(keyData)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid key data format'
      });
    }

    // Check if key already exists
    const existingKey = await UserKey.findOne({
      where: { keyId: keyData.keyId, userId }
    });

    if (existingKey) {
      return res.status(400).json({
        success: false,
        error: 'Key with this ID already exists'
      });
    }

    // Store imported key
    const userKey = await UserKey.create({
      userId,
      keyId: keyData.keyId,
      keyType: keyData.keyType,
      publicKey: keyData.publicKey,
      keyStatus: 'active',
      createdAt: new Date()
    });

    // Log key import event
    await SigningEvent.create({
      userId,
      eventType: 'key_imported',
      eventData: {
        keyId: keyData.keyId,
        keyType: keyData.keyType
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ 
      success: true, 
      key: {
        id: userKey.id,
        keyId: userKey.keyId,
        keyType: userKey.keyType,
        keyStatus: userKey.keyStatus,
        createdAt: userKey.createdAt
      }
    });
  } catch (error) {
    console.error('Error importing key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to import signing key' 
    });
  }
});

// Delete signing key
router.delete('/keys/:keyId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { keyId } = req.params;

    const userKey = await UserKey.findOne({
      where: { id: keyId, userId }
    });

    if (!userKey) {
      return res.status(404).json({
        success: false,
        error: 'Key not found'
      });
    }

    // Soft delete by updating status
    await userKey.update({ keyStatus: 'revoked' });

    // Log key deletion event
    await SigningEvent.create({
      userId,
      eventType: 'key_deleted',
      eventData: {
        keyId: userKey.keyId,
        keyType: userKey.keyType
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete signing key' 
    });
  }
});

// Export signing key
router.get('/keys/:keyId/export', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { keyId } = req.params;

    const userKey = await UserKey.findOne({
      where: { id: keyId, userId, keyStatus: 'active' }
    });

    if (!userKey) {
      return res.status(404).json({
        success: false,
        error: 'Key not found'
      });
    }

    // In production, you would decrypt the private key here
    const exportData = {
      keyId: userKey.keyId,
      keyType: userKey.keyType,
      publicKey: userKey.publicKey,
      // privateKey: decryptedPrivateKey, // Only include if user has access
      createdAt: userKey.createdAt
    };

    res.json({ success: true, keyData: exportData });
  } catch (error) {
    console.error('Error exporting key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export signing key' 
    });
  }
});

// Sign a contract
router.post('/sign', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { contractId, keyId, signatureData } = req.body;

    // Validate required fields
    if (!contractId || !keyId || !signatureData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractId, keyId, signatureData'
      });
    }

    // Get contract
    const contract = await Contract.findByPk(contractId, {
      include: [
        { model: User, as: 'tdc', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'ccrp', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    // Get user's key
    const userKey = await UserKey.findOne({
      where: { id: keyId, userId, keyStatus: 'active' }
    });

    if (!userKey) {
      return res.status(404).json({
        success: false,
        error: 'Signing key not found or inactive'
      });
    }

    // Check if user is authorized to sign this contract
    const isAuthorized = contract.tdcId === userId || 
                        contract.ccrpId === userId || 
                        req.user.localUser?.partyType === 'AppAdmin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to sign this contract'
      });
    }

    // Check if already signed by this user (check SCITT CCF claims)
    const existingSignatureClaim = await db.ScittClaim.findOne({
      where: { 
        contractId: contract.contractId,
        claimType: 'contract_signature',
        'claimData.signer': req.user.localUser?.depaId || req.user.depaId
      }
    });

    if (existingSignatureClaim) {
      return res.status(400).json({
        success: false,
        error: 'Contract already signed by this user'
      });
    }

    // Generate signature
    const contractHash = crypto.createHash('sha256')
      .update(JSON.stringify({
        contractId: contract.contractId,
        contractData: contract.contractData,
        timestamp: Date.now()
      }))
      .digest('hex');

    const signature = await keyManagementService.generateSignature(
      contractHash,
      userKey.privateKey, // In production, this should be decrypted
      userKey.keyType
    );

    // Create SCITT CCF signature claim
    const signatureClaim = {
      type: 'contract_signature',
      data: {
        contractId: contract.contractId,
        signer: req.user.localUser?.depaId || req.user.depaId,
        signerRole: req.user.localUser?.partyType || req.user.partyType,
        signature: signature.signature,
        algorithm: signature.algorithm,
        timestamp: signature.timestamp,
        contractHash: contractHash,
        metadata: {
          system: 'Contract Management System',
          version: '1.0.0',
          teeProvider: 'virtual'
        }
      }
    };

    // Submit signature claim to SCITT CCF
    const scittCcfService = require('../services/scittCcfService');
    const scittResult = await scittCcfService.submitClaim(signatureClaim);

    // Store claim locally for tracking
    await db.ScittClaim.create({
      claimId: scittResult.claimId,
      contractId: contract.contractId,
      claimType: 'contract_signature',
      claimData: signatureClaim.data,
      receipt: scittResult.receipt,
      status: 'SUBMITTED'
    });

    // Update key last used timestamp
    await userKey.update({ lastUsedAt: new Date() });

    // Log signing event
    await SigningEvent.create({
      contractId: contract.id,
      userId,
      eventType: 'contract_signed',
      eventData: {
        scittClaimId: scittResult.claimId,
        keyId: userKey.keyId,
        contractHash
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      signature: {
        scittClaimId: scittResult.claimId,
        signature: signature.signature,
        algorithm: signature.algorithm,
        timestamp: signature.timestamp,
        contractHash,
        scittReceipt: scittResult.receipt
      }
    });
  } catch (error) {
    console.error('Error signing contract:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sign contract' 
    });
  }
});

// Verify signature
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { scittClaimId, contractId } = req.body;

    // Get signature claim from SCITT CCF
    const signatureClaim = await db.ScittClaim.findOne({
      where: { 
        claimId: scittClaimId,
        contractId: contractId,
        claimType: 'contract_signature'
      }
    });

    if (!signatureClaim) {
      return res.status(404).json({
        success: false,
        error: 'Signature claim not found'
      });
    }

    // Get the signer's public key
    const signer = await User.findOne({
      where: { depaId: signatureClaim.claimData.signer }
    });

    if (!signer) {
      return res.status(404).json({
        success: false,
        error: 'Signer not found'
      });
    }

    const userKey = await UserKey.findOne({
      where: { 
        userId: signer.id,
        keyId: signatureClaim.claimData.keyId || 'default'
      }
    });

    if (!userKey) {
      return res.status(404).json({
        success: false,
        error: 'Signer key not found'
      });
    }

    // Verify signature cryptographically
    const contractHash = crypto.createHash('sha256')
      .update(JSON.stringify({
        contractId: contractId,
        contractData: signatureClaim.claimData.contractData,
        timestamp: signatureClaim.claimData.timestamp
      }))
      .digest('hex');

    const cryptographicValid = await keyManagementService.verifySignature(
      contractHash,
      signatureClaim.claimData.signature,
      userKey.publicKey,
      signatureClaim.claimData.algorithm
    );

    // Verify signature exists in SCITT CCF Ledger
    const scittCcfService = require('../services/scittCcfService');
    const scittVerification = await scittCcfService.getClaim(scittClaimId);

    const scittValid = scittVerification && scittVerification.status === 'verified';
    const overallValid = cryptographicValid && scittValid;

    // Update claim status
    await signatureClaim.update({
      status: overallValid ? 'VERIFIED' : 'FAILED',
      updatedAt: new Date()
    });

    res.json({
      success: true,
      verified: overallValid,
      verification: {
        cryptographicValid,
        scittValid,
        overallValid,
        scittReceipt: signatureClaim.receipt,
        algorithm: signatureClaim.claimData.algorithm,
        timestamp: signatureClaim.claimData.timestamp
      }
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify signature' 
    });
  }
});

// Get contract signatures
router.get('/contracts/:contractId/signatures', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const userId = req.user.localUser?.id || req.user.id;

    // Check if user has access to this contract
    const contract = await Contract.findByPk(contractId);
    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    const isAuthorized = contract.tdcId === userId || 
                        contract.ccrpId === userId || 
                        req.user.localUser?.partyType === 'AppAdmin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view contract signatures'
      });
    }

    // Get signature claims from SCITT CCF
    const signatureClaims = await db.ScittClaim.findAll({
      where: { 
        contractId: contract.contractId,
        claimType: 'contract_signature'
      },
      order: [['createdAt', 'ASC']]
    });

    // Get signer information for each signature
    const signatures = await Promise.all(signatureClaims.map(async (claim) => {
      const signer = await User.findOne({
        where: { depaId: claim.claimData.signer },
        attributes: ['id', 'name', 'email', 'partyType', 'depaId']
      });

      return {
        scittClaimId: claim.claimId,
        signer: signer ? {
          id: signer.id,
          name: signer.name,
          email: signer.email,
          partyType: signer.partyType,
          depaId: signer.depaId
        } : { depaId: claim.claimData.signer },
        algorithm: claim.claimData.algorithm,
        timestamp: claim.claimData.timestamp,
        status: claim.status,
        scittReceipt: claim.receipt,
        createdAt: claim.createdAt
      };
    }));

    res.json({
      success: true,
      signatures,
      total: signatures.length
    });
  } catch (error) {
    console.error('Error fetching contract signatures:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch contract signatures' 
    });
  }
});

// Get signing events for audit
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    // Only admin can view all events
    if (req.user.localUser?.partyType !== 'AppAdmin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const events = await SigningEvent.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Contract, as: 'contract', attributes: ['id', 'contractId'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      events: events.rows,
      total: events.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching signing events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch signing events' 
    });
  }
});

module.exports = router;