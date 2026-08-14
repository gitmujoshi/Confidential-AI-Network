// Export all services as classes (no singleton instantiation here)
const BlockchainService = require('./blockchainService');
const ContractService = require('./contractService');
const DIDService = require('./didService');
const DPDPService = require('./dpdpService');
const EmailService = require('./emailService');
const KeycloakService = require('./keycloakService');
const OciIdentityService = require('./ociIdentityService');
const EntraIdentityService = require('./entraIdentityService');
const GcpIdentityService = require('./gcpIdentityService');
const NotificationService = require('./notificationService');
const SigningService = require('./signingService');
const AuditService = require('./auditService');
const gmaseOpaService = require('./gmaseOpaService');

const DEPAIdService = require('./depaIdService');
const GlobalDEPAIdService = require('./globalDEPAIdService');
const ricardianContractService = require('./ricardianContractService');

module.exports = {
  BlockchainService,
  ContractService,
  DIDService,
  DPDPService,
  EmailService,
  KeycloakService,
  OciIdentityService,
  EntraIdentityService,
  GcpIdentityService,
  NotificationService,
  SigningService,
  AuditService,
  gmaseOpaService,
  DEPAIdService,
  GlobalDEPAIdService,
  ricardianContractService // Export as singleton instance
}; 