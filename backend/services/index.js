// Export all services as classes (no singleton instantiation here)
const BlockchainService = require('./blockchainService');
const ContractService = require('./contractService');
const DIDService = require('./didService');
const DPDPService = require('./dpdpService');
const EmailService = require('./emailService');
const KeycloakService = require('./***REMOVED-KEYCLOAK_DB_PASSWORD***Service');
const NotificationService = require('./notificationService');
const SigningService = require('./signingService');
const AuditService = require('./auditService');
const ricardianContractService = require('./ricardianContractService');

module.exports = {
  BlockchainService,
  ContractService,
  DIDService,
  DPDPService,
  EmailService,
  KeycloakService,
  NotificationService,
  SigningService,
  AuditService,
  ricardianContractService // This is a singleton instance
}; 