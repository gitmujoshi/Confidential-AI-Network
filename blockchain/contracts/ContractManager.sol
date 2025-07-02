// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ContractManager is Ownable, ReentrancyGuard {
    
    enum ContractStatus {
        PENDING_TDP_APPROVAL,
        PENDING_CCRP_APPROVAL,
        ACTIVE,
        COMPLETED,
        CANCELLED
    }
    
    enum PartyType {
        TDP,
        TDC,
        CCRP
    }
    
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
    
    struct Party {
        address partyAddress;
        PartyType partyType;
        string name;
        string description;
        bool isRegistered;
        uint256 registrationDate;
    }
    
    mapping(uint256 => Contract) public contracts;
    mapping(address => Party) public parties;
    mapping(address => uint256[]) public partyContracts;
    
    uint256 public contractCounter;
    uint256 public partyCounter;
    
    event ContractCreated(uint256 indexed contractId, address indexed tdc, string datasetId);
    event ContractSigned(uint256 indexed contractId, address indexed signer, PartyType partyType);
    event ContractStatusChanged(uint256 indexed contractId, ContractStatus newStatus);
    event PartyRegistered(address indexed partyAddress, PartyType partyType, string name);
    
    modifier onlyRegisteredParty() {
        require(parties[msg.sender].isRegistered, "Party not registered");
        _;
    }
    
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
            ccrpAddress: address(0),
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
        
        partyContracts[msg.sender].push(contractCounter);
        partyContracts[tdpAddress].push(contractCounter);
        
        emit ContractCreated(contractCounter, msg.sender, datasetId);
        return contractCounter;
    }
    
    function signContract(uint256 contractId) external onlyContractParty(contractId) {
        Contract storage contract_ = contracts[contractId];
        Party storage party = parties[msg.sender];
        
        require(contract_.status == ContractStatus.PENDING_TDP_APPROVAL || 
                contract_.status == ContractStatus.PENDING_CCRP_APPROVAL, 
                "Contract not in signing phase");
        
        if (party.partyType == PartyType.TDP && !contract_.tdpSigned) {
            require(contract_.status == ContractStatus.PENDING_TDP_APPROVAL, "TDP signing not allowed");
            contract_.tdpSigned = true;
            contract_.tdpSignedAt = block.timestamp;
            contract_.status = ContractStatus.PENDING_CCRP_APPROVAL;
            emit ContractSigned(contractId, msg.sender, PartyType.TDP);
        } else if (party.partyType == PartyType.CCRP && !contract_.ccrpSigned) {
            require(contract_.status == ContractStatus.PENDING_CCRP_APPROVAL, "CCRP signing not allowed");
            contract_.ccrpSigned = true;
            contract_.ccrpSignedAt = block.timestamp;
            contract_.status = ContractStatus.ACTIVE;
            emit ContractSigned(contractId, msg.sender, PartyType.CCRP);
        }
        
        emit ContractStatusChanged(contractId, contract_.status);
    }
    
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