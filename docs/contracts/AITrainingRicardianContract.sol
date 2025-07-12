// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AITrainingRicardianContract
 * @dev Smart contract for AI model training on private/confidential data
 * using Ricardian Contract pattern with CCRP cloud platforms
 * 
 * This contract implements the Ricardian pattern by:
 * 1. Binding human-readable legal documents to smart contract execution
 * 2. Automating AI training workflow with privacy-preserving techniques
 * 3. Managing secure environment provisioning through CCRP
 * 4. Handling automated payments and data cleanup
 * 
 * Contract Workflow:
 * 1. TDC creates training contract with legal document hash
 * 2. CCRP provisions secure training environment
 * 3. Model training executes with privacy techniques
 * 4. Model validation against agreed metrics
 * 5. Automated payment release and data cleanup
 */
contract AITrainingRicardianContract is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    /**
     * @dev Contract status enumeration for AI training workflow
     */
    enum TrainingStatus {
        CREATED,                    // Contract created, waiting for environment
        ENVIRONMENT_PROVISIONING,   // CCRP provisioning secure environment
        ENVIRONMENT_READY,          // Environment ready for training
        TRAINING_IN_PROGRESS,       // AI model training in progress
        TRAINING_COMPLETED,         // Training completed, waiting validation
        MODEL_VALIDATED,            // Model validated against metrics
        PAYMENT_RELEASED,           // All payments released
        DATA_CLEANED,               // All data securely deleted
        CANCELLED                   // Contract cancelled
    }
    
    /**
     * @dev Party roles in AI training contract
     */
    enum PartyRole {
        DATA_PROVIDER,      // TDP - owns confidential data
        MODEL_TRAINER,      // TDC - trains AI model
        CCRP               // Clean Room Provider - secure environment
    }
    
    /**
     * @dev Environment specifications for secure training
     */
    struct EnvironmentSpecs {
        string computeType;         // "DEDICATED_SERVERS", "PRIVATE_CLOUD"
        string gpuConfiguration;    // "8x NVIDIA A100", "4x V100"
        string isolationType;       // "PHYSICAL_SEPARATION", "LOGICAL_ISOLATION"
        string encryptionLevel;     // "AES-256-XTS", "AES-128"
        string networkType;         // "PRIVATE_NETWORK", "VPN_ONLY"
        uint256 securityLevel;      // 1-10 scale
        bool multiFactorAuth;       // MFA required
        bool auditLogging;          // Comprehensive logging
        bool realTimeMonitoring;    // 24x7 monitoring
    }
    
    /**
     * @dev Training parameters and specifications
     */
    struct TrainingParams {
        string modelType;           // "DIAGNOSTIC_AI", "PREDICTIVE_MODEL"
        string framework;           // "TensorFlow", "PyTorch"
        string privacyTechniques;   // "FEDERATED_LEARNING", "DIFFERENTIAL_PRIVACY"
        uint256 targetAccuracy;     // Target accuracy (95% = 9500)
        uint256 maxTrainingDays;    // Maximum training duration
        uint256 batchSize;          // Training batch size
        uint256 learningRate;       // Learning rate (scaled by 10000)
        string validationMetrics;   // "PRECISION,RECALL,F1_SCORE"
    }
    
    /**
     * @dev Model validation metrics
     */
    struct ModelMetrics {
        uint256 accuracy;           // Model accuracy (scaled by 10000)
        uint256 precision;          // Precision score (scaled by 10000)
        uint256 recall;             // Recall score (scaled by 10000)
        uint256 f1Score;            // F1 score (scaled by 10000)
        uint256 aucRoc;             // AUC-ROC score (scaled by 10000)
        bool meetsTargets;          // Whether all targets met
        uint256 validationTimestamp; // When validation performed
    }
    
    /**
     * @dev Payment structure for milestone-based payments
     */
    struct PaymentSchedule {
        uint256 dataProviderPayment;    // Payment to data provider
        uint256 ccrpPayment;            // Payment to CCRP
        uint256 milestone1Percent;      // Payment on contract activation
        uint256 milestone2Percent;      // Payment on training completion
        uint256 milestone3Percent;      // Payment on model validation
        uint256 milestone1Paid;         // Whether milestone 1 paid
        uint256 milestone2Paid;         // Whether milestone 2 paid
        uint256 milestone3Paid;         // Whether milestone 3 paid
    }
    
    /**
     * @dev Main contract structure for AI training
     */
    struct AITrainingContract {
        uint256 contractId;                     // Unique contract identifier
        bytes32 legalDocumentHash;              // Hash of legal document (Ricardian binding)
        bytes32 ricardianSignature;             // Cryptographic signature binding legal to smart contract
        
        address dataProvider;                   // Data provider address
        address modelTrainer;                   // Model trainer address
        address ccrp;                          // CCRP address
        
        string datasetId;                       // Dataset identifier
        string modelId;                         // Model identifier
        
        EnvironmentSpecs environmentSpecs;      // Environment specifications
        TrainingParams trainingParams;          // Training parameters
        ModelMetrics modelMetrics;              // Model validation metrics
        
        TrainingStatus status;                  // Current training status
        PaymentSchedule payments;               // Payment schedule
        
        uint256 createdAt;                      // Contract creation timestamp
        uint256 environmentProvisionedAt;       // Environment provisioned timestamp
        uint256 trainingStartedAt;              // Training started timestamp
        uint256 trainingCompletedAt;            // Training completed timestamp
        uint256 modelValidatedAt;               // Model validated timestamp
        uint256 dataCleanedAt;                  // Data cleaned timestamp
        
        bool environmentProvisioned;            // Environment provisioned flag
        bool trainingStarted;                   // Training started flag
        bool trainingCompleted;                 // Training completed flag
        bool modelValidated;                    // Model validated flag
        bool dataCleaned;                       // Data cleaned flag
    }
    
    // State variables
    Counters.Counter private _contractCounter;
    mapping(uint256 => AITrainingContract) public contracts;
    mapping(address => uint256[]) public partyContracts;
    mapping(address => PartyRole) public partyRoles;
    
    // Events for frontend integration and audit trail
    event TrainingContractCreated(
        uint256 indexed contractId,
        address indexed modelTrainer,
        bytes32 legalDocumentHash,
        string datasetId
    );
    
    event EnvironmentProvisioned(
        uint256 indexed contractId,
        address indexed ccrp,
        EnvironmentSpecs environmentSpecs
    );
    
    event TrainingStarted(
        uint256 indexed contractId,
        address indexed modelTrainer,
        TrainingParams trainingParams
    );
    
    event TrainingCompleted(
        uint256 indexed contractId,
        uint256 trainingDuration
    );
    
    event ModelValidated(
        uint256 indexed contractId,
        ModelMetrics metrics
    );
    
    event PaymentReleased(
        uint256 indexed contractId,
        address indexed recipient,
        uint256 amount,
        uint256 milestone
    );
    
    event DataCleaned(
        uint256 indexed contractId,
        address indexed ccrp,
        uint256 cleanedAt
    );
    
    event StatusChanged(
        uint256 indexed contractId,
        TrainingStatus newStatus
    );
    
    /**
     * @dev Modifier to ensure only registered parties can perform actions
     */
    modifier onlyRegisteredParty() {
        require(partyRoles[msg.sender] != PartyRole(0), "Party not registered");
        _;
    }
    
    /**
     * @dev Modifier to ensure only CCRP can perform CCRP-specific actions
     */
    modifier onlyCCRP() {
        require(partyRoles[msg.sender] == PartyRole.CCRP, "Only CCRP can perform this action");
        _;
    }
    
    /**
     * @dev Modifier to ensure only model trainer can perform training actions
     */
    modifier onlyModelTrainer() {
        require(partyRoles[msg.sender] == PartyRole.MODEL_TRAINER, "Only model trainer can perform this action");
        _;
    }
    
    /**
     * @dev Modifier to ensure only contract parties can perform actions
     */
    modifier onlyContractParty(uint256 contractId) {
        AITrainingContract storage contract_ = contracts[contractId];
        require(
            msg.sender == contract_.dataProvider ||
            msg.sender == contract_.modelTrainer ||
            msg.sender == contract_.ccrp,
            "Not authorized for this contract"
        );
        _;
    }
    
    /**
     * @dev Register a party in the AI training system
     * @param role Role of the party (DATA_PROVIDER, MODEL_TRAINER, CCRP)
     */
    function registerParty(PartyRole role) external {
        require(partyRoles[msg.sender] == PartyRole(0), "Party already registered");
        partyRoles[msg.sender] = role;
    }
    
    /**
     * @dev Create a new AI training contract with Ricardian binding
     * @param legalDocumentHash Hash of the legal document (Ricardian binding)
     * @param ricardianSignature Cryptographic signature binding legal to smart contract
     * @param dataProvider Address of the data provider
     * @param ccrp Address of the CCRP
     * @param datasetId Identifier for the dataset
     * @param modelId Identifier for the model
     * @param envSpecs Environment specifications
     * @param trainParams Training parameters
     * @param dataProviderPayment Payment to data provider
     * @param ccrpPayment Payment to CCRP
     * @return contractId The ID of the newly created contract
     */
    function createTrainingContract(
        bytes32 legalDocumentHash,
        bytes32 ricardianSignature,
        address dataProvider,
        address ccrp,
        string memory datasetId,
        string memory modelId,
        EnvironmentSpecs memory envSpecs,
        TrainingParams memory trainParams,
        uint256 dataProviderPayment,
        uint256 ccrpPayment
    ) external onlyModelTrainer returns (uint256) {
        require(partyRoles[dataProvider] == PartyRole.DATA_PROVIDER, "Invalid data provider");
        require(partyRoles[ccrp] == PartyRole.CCRP, "Invalid CCRP");
        require(envSpecs.securityLevel >= 8, "Insufficient security level");
        require(trainParams.targetAccuracy >= 9500, "Target accuracy too low");
        
        _contractCounter.increment();
        uint256 contractId = _contractCounter.current();
        
        contracts[contractId] = AITrainingContract({
            contractId: contractId,
            legalDocumentHash: legalDocumentHash,
            ricardianSignature: ricardianSignature,
            dataProvider: dataProvider,
            modelTrainer: msg.sender,
            ccrp: ccrp,
            datasetId: datasetId,
            modelId: modelId,
            environmentSpecs: envSpecs,
            trainingParams: trainParams,
            modelMetrics: ModelMetrics(0, 0, 0, 0, 0, false, 0),
            status: TrainingStatus.CREATED,
            payments: PaymentSchedule({
                dataProviderPayment: dataProviderPayment,
                ccrpPayment: ccrpPayment,
                milestone1Percent: 50,  // 50% on contract activation
                milestone2Percent: 30,  // 30% on training completion
                milestone3Percent: 20,  // 20% on model validation
                milestone1Paid: 0,
                milestone2Paid: 0,
                milestone3Paid: 0
            }),
            createdAt: block.timestamp,
            environmentProvisionedAt: 0,
            trainingStartedAt: 0,
            trainingCompletedAt: 0,
            modelValidatedAt: 0,
            dataCleanedAt: 0,
            environmentProvisioned: false,
            trainingStarted: false,
            trainingCompleted: false,
            modelValidated: false,
            dataCleaned: false
        });
        
        // Track contracts for each party
        partyContracts[msg.sender].push(contractId);
        partyContracts[dataProvider].push(contractId);
        partyContracts[ccrp].push(contractId);
        
        emit TrainingContractCreated(contractId, msg.sender, legalDocumentHash, datasetId);
        emit StatusChanged(contractId, TrainingStatus.CREATED);
        
        return contractId;
    }
    
    /**
     * @dev CCRP provisions secure training environment
     * @param contractId ID of the contract
     * @param envSpecs Updated environment specifications
     */
    function provisionEnvironment(
        uint256 contractId,
        EnvironmentSpecs memory envSpecs
    ) external onlyCCRP onlyContractParty(contractId) {
        AITrainingContract storage contract_ = contracts[contractId];
        require(contract_.status == TrainingStatus.CREATED, "Contract not in creation status");
        require(envSpecs.securityLevel >= 8, "Insufficient security level");
        
        contract_.environmentSpecs = envSpecs;
        contract_.environmentProvisioned = true;
        contract_.environmentProvisionedAt = block.timestamp;
        contract_.status = TrainingStatus.ENVIRONMENT_READY;
        
        emit EnvironmentProvisioned(contractId, msg.sender, envSpecs);
        emit StatusChanged(contractId, TrainingStatus.ENVIRONMENT_READY);
        
        // Release milestone 1 payment (50%)
        _releaseMilestonePayment(contractId, 1);
    }
    
    /**
     * @dev Start AI model training in secure environment
     * @param contractId ID of the contract
     * @param trainParams Updated training parameters
     */
    function startTraining(
        uint256 contractId,
        TrainingParams memory trainParams
    ) external onlyModelTrainer onlyContractParty(contractId) {
        AITrainingContract storage contract_ = contracts[contractId];
        require(contract_.status == TrainingStatus.ENVIRONMENT_READY, "Environment not ready");
        require(contract_.environmentProvisioned, "Environment not provisioned");
        require(trainParams.targetAccuracy >= 9500, "Target accuracy too low");
        
        contract_.trainingParams = trainParams;
        contract_.trainingStarted = true;
        contract_.trainingStartedAt = block.timestamp;
        contract_.status = TrainingStatus.TRAINING_IN_PROGRESS;
        
        emit TrainingStarted(contractId, msg.sender, trainParams);
        emit StatusChanged(contractId, TrainingStatus.TRAINING_IN_PROGRESS);
    }
    
    /**
     * @dev Complete AI model training
     * @param contractId ID of the contract
     */
    function completeTraining(uint256 contractId) external onlyModelTrainer onlyContractParty(contractId) {
        AITrainingContract storage contract_ = contracts[contractId];
        require(contract_.status == TrainingStatus.TRAINING_IN_PROGRESS, "Training not in progress");
        require(contract_.trainingStarted, "Training not started");
        
        contract_.trainingCompleted = true;
        contract_.trainingCompletedAt = block.timestamp;
        contract_.status = TrainingStatus.TRAINING_COMPLETED;
        
        uint256 trainingDuration = contract_.trainingCompletedAt - contract_.trainingStartedAt;
        
        emit TrainingCompleted(contractId, trainingDuration);
        emit StatusChanged(contractId, TrainingStatus.TRAINING_COMPLETED);
        
        // Release milestone 2 payment (30%)
        _releaseMilestonePayment(contractId, 2);
    }
    
    /**
     * @dev Validate trained model against agreed metrics
     * @param contractId ID of the contract
     * @param metrics Model validation metrics
     */
    function validateModel(
        uint256 contractId,
        ModelMetrics memory metrics
    ) external onlyModelTrainer onlyContractParty(contractId) {
        AITrainingContract storage contract_ = contracts[contractId];
        require(contract_.status == TrainingStatus.TRAINING_COMPLETED, "Training not completed");
        require(contract_.trainingCompleted, "Training not completed");
        
        // Validate against agreed targets
        require(metrics.accuracy >= contract_.trainingParams.targetAccuracy, "Accuracy below target");
        require(metrics.precision >= 9000, "Precision below 90%");
        require(metrics.recall >= 9000, "Recall below 90%");
        
        contract_.modelMetrics = metrics;
        contract_.modelValidated = true;
        contract_.modelValidatedAt = block.timestamp;
        contract_.status = TrainingStatus.MODEL_VALIDATED;
        
        emit ModelValidated(contractId, metrics);
        emit StatusChanged(contractId, TrainingStatus.MODEL_VALIDATED);
        
        // Release milestone 3 payment (20%)
        _releaseMilestonePayment(contractId, 3);
    }
    
    /**
     * @dev CCRP cleans up all data and environment
     * @param contractId ID of the contract
     */
    function cleanupData(uint256 contractId) external onlyCCRP onlyContractParty(contractId) {
        AITrainingContract storage contract_ = contracts[contractId];
        require(contract_.status == TrainingStatus.MODEL_VALIDATED, "Model not validated");
        require(contract_.modelValidated, "Model not validated");
        
        contract_.dataCleaned = true;
        contract_.dataCleanedAt = block.timestamp;
        contract_.status = TrainingStatus.DATA_CLEANED;
        
        emit DataCleaned(contractId, msg.sender, block.timestamp);
        emit StatusChanged(contractId, TrainingStatus.DATA_CLEANED);
    }
    
    /**
     * @dev Release milestone payment to parties
     * @param contractId ID of the contract
     * @param milestone Milestone number (1, 2, or 3)
     */
    function _releaseMilestonePayment(uint256 contractId, uint256 milestone) internal {
        AITrainingContract storage contract_ = contracts[contractId];
        PaymentSchedule storage payments = contract_.payments;
        
        if (milestone == 1 && payments.milestone1Paid == 0) {
            uint256 dataProviderAmount = (payments.dataProviderPayment * payments.milestone1Percent) / 100;
            uint256 ccrpAmount = (payments.ccrpPayment * payments.milestone1Percent) / 100;
            
            payments.milestone1Paid = 1;
            
            emit PaymentReleased(contractId, contract_.dataProvider, dataProviderAmount, 1);
            emit PaymentReleased(contractId, contract_.ccrp, ccrpAmount, 1);
        } else if (milestone == 2 && payments.milestone2Paid == 0) {
            uint256 dataProviderAmount = (payments.dataProviderPayment * payments.milestone2Percent) / 100;
            uint256 ccrpAmount = (payments.ccrpPayment * payments.milestone2Percent) / 100;
            
            payments.milestone2Paid = 1;
            
            emit PaymentReleased(contractId, contract_.dataProvider, dataProviderAmount, 2);
            emit PaymentReleased(contractId, contract_.ccrp, ccrpAmount, 2);
        } else if (milestone == 3 && payments.milestone3Paid == 0) {
            uint256 dataProviderAmount = (payments.dataProviderPayment * payments.milestone3Percent) / 100;
            uint256 ccrpAmount = (payments.ccrpPayment * payments.milestone3Percent) / 100;
            
            payments.milestone3Paid = 1;
            
            emit PaymentReleased(contractId, contract_.dataProvider, dataProviderAmount, 3);
            emit PaymentReleased(contractId, contract_.ccrp, ccrpAmount, 3);
        }
    }
    
    /**
     * @dev Get contract details
     * @param contractId ID of the contract
     * @return contract_ The contract details
     */
    function getContract(uint256 contractId) external view returns (AITrainingContract memory) {
        return contracts[contractId];
    }
    
    /**
     * @dev Get contracts for a party
     * @param partyAddress Address of the party
     * @return contractIds Array of contract IDs
     */
    function getPartyContracts(address partyAddress) external view returns (uint256[] memory) {
        return partyContracts[partyAddress];
    }
    
    /**
     * @dev Get party role
     * @param partyAddress Address of the party
     * @return role Role of the party
     */
    function getPartyRole(address partyAddress) external view returns (PartyRole) {
        return partyRoles[partyAddress];
    }
    
    /**
     * @dev Cancel contract (only contract parties can cancel)
     * @param contractId ID of the contract
     */
    function cancelContract(uint256 contractId) external onlyContractParty(contractId) {
        AITrainingContract storage contract_ = contracts[contractId];
        require(contract_.status != TrainingStatus.DATA_CLEANED, "Cannot cancel completed contract");
        
        contract_.status = TrainingStatus.CANCELLED;
        emit StatusChanged(contractId, TrainingStatus.CANCELLED);
    }
} 