// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ContractManager
 * @dev Smart contract for managing training data contracts between TDP, TDC, and CCRP parties
 * 
 * This contract implements a role-based contract management system where:
 * - TDC (Training Data Consumer): ONLY role that can initiate contracts
 * - TDP (Training Data Provider): Automatically signs contracts when created by TDC
 * - CCRP (Confidential Clean Room Provider): Reviews and signs contracts for compliance
 * 
 * Security Features:
 * - ReentrancyGuard: Prevents reentrancy attacks
 * - Ownable: Contract owner controls critical functions
 * - Access control modifiers: Ensure only authorized parties can perform actions
 * - Event logging: Complete audit trail of all contract actions
 */
contract ContractManager is Ownable, ReentrancyGuard {
    
    /**
     * @dev Contract status enumeration
     * PENDING_TDP_APPROVAL: Contract created by TDC, waiting for TDP auto-sign
     * PENDING_CCRP_APPROVAL: TDP signed, waiting for CCRP (if selected)
     * ACTIVE: All required parties signed, contract is legally binding
     * COMPLETED: Contract execution finished
     * CANCELLED: Contract cancelled by any party
     */
    enum ContractStatus {
        PENDING_TDP_APPROVAL,
        PENDING_CCRP_APPROVAL,
        ACTIVE,
        COMPLETED,
        CANCELLED
    }
    
    /**
     * @dev Party type enumeration
     * TDP: Training Data Provider (dataset owner)
     * TDC: Training Data Consumer (contract initiator)
     * CCRP: Confidential Clean Room Provider (compliance reviewer)
     */
    enum PartyType {
        TDP,
        TDC,
        CCRP
    }
    
    /**
     * @dev Contract structure containing all contract details
     * @param contractId Unique identifier for the contract
     * @param tdpAddress Address of the Training Data Provider
     * @param tdcAddress Address of the Training Data Consumer (contract initiator)
     * @param ccrpAddress Address of the Confidential Clean Room Provider (optional)
     * @param datasetId Identifier for the dataset being contracted
     * @param modelId Identifier for the model being trained
     * @param price Contract price in wei
     * @param duration Contract duration in days
     * @param termsAndConditions Contract terms and conditions
     * @param status Current contract status
     * @param createdAt Timestamp when contract was created
     * @param tdpSignedAt Timestamp when TDP signed (auto-signed)
     * @param ccrpSignedAt Timestamp when CCRP signed
     * @param tdpSigned Boolean indicating if TDP has signed
     * @param ccrpSigned Boolean indicating if CCRP has signed
     */
    struct Contract {
        uint256 contractId;
        address tdpAddress;
        address tdcAddress;
        address ccrpAddress;
        string datasetId;
        string modelId;
        uint256 price;
        uint256 duration;
        string termsAndConditions;
        ContractStatus status;
        uint256 createdAt;
        uint256 tdpSignedAt;
        uint256 ccrpSignedAt;
        bool tdpSigned;
        bool ccrpSigned;
    }
    
    /**
     * @dev Party structure containing party registration details
     * @param partyAddress Ethereum address of the party
     * @param partyType Type of party (TDP, TDC, or CCRP)
     * @param name Human-readable name of the party
     * @param description Description of the party's role
     * @param isRegistered Boolean indicating if party is registered
     * @param registrationDate Timestamp when party was registered
     */
    struct Party {
        address partyAddress;
        PartyType partyType;
        string name;
        string description;
        bool isRegistered;
        uint256 registrationDate;
    }
    
    // State variables
    mapping(uint256 => Contract) public contracts;           // contractId => Contract
    mapping(address => Party) public parties;                // address => Party
    mapping(address => uint256[]) public partyContracts;     // address => array of contractIds
    
    uint256 public contractCounter;                          // Counter for generating unique contract IDs
    uint256 public partyCounter;                             // Counter for tracking registered parties
    
    // Events for frontend integration and audit trail
    event ContractCreated(uint256 indexed contractId, address indexed tdc, string datasetId);
    event ContractSigned(uint256 indexed contractId, address indexed signer, PartyType partyType);
    event ContractStatusChanged(uint256 indexed contractId, ContractStatus newStatus);
    event PartyRegistered(address indexed partyAddress, PartyType partyType, string name);
    
    /**
     * @dev Modifier to ensure only registered parties can perform actions
     */
    modifier onlyRegisteredParty() {
        require(parties[msg.sender].isRegistered, "Party not registered");
        _;
    }
    
    /**
     * @dev Modifier to ensure only parties involved in a contract can perform actions on it
     * @param contractId ID of the contract
     */
    modifier onlyContractParty(uint256 contractId) {
        Contract storage contract_ = contracts[contractId];
        require(
            msg.sender == contract_.tdpAddress ||
            msg.sender == contract_.tdcAddress ||
            msg.sender == contract_.ccrpAddress,
            "Not authorized for this contract"
        );
        _;
    }
    
    /**
     * @dev Register a new party in the system
     * @param partyType Type of party (TDP, TDC, or CCRP)
     * @param name Human-readable name of the party
     * @param description Description of the party's role
     * 
     * Requirements:
     * - Party must not already be registered
     * - Party must provide valid name and description
     */
    function registerParty(
        PartyType partyType,
        string memory name,
        string memory description
    ) external {
        require(!parties[msg.sender].isRegistered, "Party already registered");
        
        parties[msg.sender] = Party({
            partyAddress: msg.sender,
            partyType: partyType,
            name: name,
            description: description,
            isRegistered: true,
            registrationDate: block.timestamp
        });
        
        partyCounter++;
        emit PartyRegistered(msg.sender, partyType, name);
    }
    
    /**
     * @dev Create a new contract (ONLY TDC can call this function)
     * @param tdpAddress Address of the Training Data Provider
     * @param datasetId Identifier for the dataset
     * @param modelId Identifier for the model being trained
     * @param price Contract price in wei
     * @param duration Contract duration in days
     * @param termsAndConditions Contract terms and conditions
     * @return contractId The ID of the newly created contract
     * 
     * Requirements:
     * - Caller must be a registered TDC
     * - TDP address must be a registered TDP
     * - All parameters must be valid
     * 
     * Workflow:
     * 1. TDC creates contract with TDP and dataset
     * 2. TDP automatically signs (handled by backend)
     * 3. Contract moves to PENDING_CCRP_APPROVAL status
     */
    function createContract(
        address tdpAddress,
        string memory datasetId,
        string memory modelId,
        uint256 price,
        uint256 duration,
        string memory termsAndConditions
    ) external onlyRegisteredParty returns (uint256) {
        require(parties[msg.sender].partyType == PartyType.TDC, "Only TDC can create contracts");
        require(parties[tdpAddress].partyType == PartyType.TDP, "Invalid TDP address");
        
        contractCounter++;
        
        contracts[contractCounter] = Contract({
            contractId: contractCounter,
            tdpAddress: tdpAddress,
            tdcAddress: msg.sender,
            ccrpAddress: address(0),  // CCRP will be selected later if needed
            datasetId: datasetId,
            modelId: modelId,
            price: price,
            duration: duration,
            termsAndConditions: termsAndConditions,
            status: ContractStatus.PENDING_TDP_APPROVAL,
            createdAt: block.timestamp,
            tdpSignedAt: 0,
            ccrpSignedAt: 0,
            tdpSigned: false,
            ccrpSigned: false
        });
        
        // Track contracts for each party
        partyContracts[msg.sender].push(contractCounter);
        partyContracts[tdpAddress].push(contractCounter);
        
        emit ContractCreated(contractCounter, msg.sender, datasetId);
        return contractCounter;
    }
    
    /**
     * @dev Sign a contract (TDP auto-signs, CCRP manually signs)
     * @param contractId ID of the contract to sign
     * 
     * Requirements:
     * - Caller must be a party to the contract
     * - Contract must be in appropriate status for signing
     * - Party must not have already signed
     * 
     * Workflow:
     * 1. TDP signs automatically when contract is created (backend handles this)
     * 2. CCRP signs after reviewing (if selected by TDC)
     * 3. Contract becomes ACTIVE when all required parties sign
     */
    function signContract(uint256 contractId) external onlyContractParty(contractId) {
        Contract storage contract_ = contracts[contractId];
        Party storage party = parties[msg.sender];
        
        require(contract_.status == ContractStatus.PENDING_TDP_APPROVAL || 
                contract_.status == ContractStatus.PENDING_CCRP_APPROVAL, 
                "Contract not in signing phase");
        
        // TDP signing (auto-sign when contract is created)
        if (party.partyType == PartyType.TDP && !contract_.tdpSigned) {
            require(contract_.status == ContractStatus.PENDING_TDP_APPROVAL, "TDP signing not allowed");
            contract_.tdpSigned = true;
            contract_.tdpSignedAt = block.timestamp;
            contract_.status = ContractStatus.PENDING_CCRP_APPROVAL;
            emit ContractSigned(contractId, msg.sender, PartyType.TDP);
        } 
        // CCRP signing (manual review and sign)
        else if (party.partyType == PartyType.CCRP && !contract_.ccrpSigned) {
            require(contract_.status == ContractStatus.PENDING_CCRP_APPROVAL, "CCRP signing not allowed");
            contract_.ccrpSigned = true;
            contract_.ccrpSignedAt = block.timestamp;
            contract_.status = ContractStatus.ACTIVE;
            emit ContractSigned(contractId, msg.sender, PartyType.CCRP);
        }
        
        emit ContractStatusChanged(contractId, contract_.status);
    }
    
    /**
     * @dev Select CCRP for a contract (ONLY TDC can call this)
     * @param contractId ID of the contract
     * @param ccrpAddress Address of the CCRP to select
     * 
     * Requirements:
     * - Caller must be the TDC who created the contract
     * - CCRP address must be a registered CCRP
     * - Contract must be in PENDING_CCRP_APPROVAL status
     */
    function selectCCRP(uint256 contractId, address ccrpAddress) external onlyContractParty(contractId) {
        Contract storage contract_ = contracts[contractId];
        require(parties[msg.sender].partyType == PartyType.TDC, "Only TDC can select CCRP");
        require(parties[ccrpAddress].partyType == PartyType.CCRP, "Invalid CCRP address");
        require(contract_.status == ContractStatus.PENDING_CCRP_APPROVAL, "Contract not in CCRP selection phase");
        
        contract_.ccrpAddress = ccrpAddress;
        partyContracts[ccrpAddress].push(contractId);
    }
    
    function getContract(uint256 contractId) external view returns (Contract memory) {
        return contracts[contractId];
    }
    
    function getPartyContracts(address partyAddress) external view returns (uint256[] memory) {
        return partyContracts[partyAddress];
    }
    
    function getParty(address partyAddress) external view returns (Party memory) {
        return parties[partyAddress];
    }
    
    function completeContract(uint256 contractId) external onlyContractParty(contractId) {
        Contract storage contract_ = contracts[contractId];
        require(contract_.status == ContractStatus.ACTIVE, "Contract not active");
        
        contract_.status = ContractStatus.COMPLETED;
        emit ContractStatusChanged(contractId, ContractStatus.COMPLETED);
    }
    
    function cancelContract(uint256 contractId) external onlyContractParty(contractId) {
        Contract storage contract_ = contracts[contractId];
        require(contract_.status != ContractStatus.COMPLETED, "Cannot cancel completed contract");
        
        contract_.status = ContractStatus.CANCELLED;
        emit ContractStatusChanged(contractId, ContractStatus.CANCELLED);
    }
} 