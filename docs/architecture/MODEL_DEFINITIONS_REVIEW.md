# Model Definitions Review

## 📋 **Overview**
This document reviews all Sequelize model definitions in the Contract Management System to ensure they follow proper conventions and are free of conflicts.

## 🎯 **Naming Conventions**
- **Models:** PascalCase (e.g., `User`, `Contract`)
- **Tables:** snake_case, plural (e.g., `users`, `contracts`)
- **Columns:** snake_case (e.g., `user_id`, `created_at`)
- **Foreign Keys:** `{table_name}_id` (e.g., `user_id`, `contract_id`)

## 📊 **Core Models**

### **1. User Model** (`User.js`)
**Purpose:** Represents all users in the system (TDC, TDP, CCRP, AppAdmin)

**Key Fields:**
- `id` (Primary Key)
- `name`, `email`, `role`
- `wallet_address`, `depa_id`
- `cloud_providers` (JSONB)
- `is_active`, `onboarding_status`

**Relationships:**
- `hasMany` Contracts (as TDC)
- `hasMany` Contracts (as CCRP)
- `hasMany` Datasets (as TDP)
- `hasMany` TrainingJobs

**Issues Found:**
- [ ] Review field definitions
- [ ] Check for naming conflicts

### **2. Contract Model** (`Contract.js`)
**Purpose:** Core contract entity with Ricardian contract support

**Key Fields:**
- `id` (Primary Key)
- `contract_id` (Unique identifier)
- `tdc_id`, `ccrp_id` (Foreign Keys)
- `status`, `price`, `duration`
- `legal_document_hash`, `ricardian_signature`
- `environment_specs`, `training_params`
- `provenance_tree_id`, `provenance_root`, `provenance_status`

**Relationships:**
- `belongsTo` User (as TDC)
- `belongsTo` User (as CCRP)
- `belongsToMany` Dataset (through ContractDataset)
- `belongsToMany` User (as TDPs, through ContractDataset)

**Issues Found:**
- [ ] **CRITICAL:** SQL query shows `"tdp_id"` and `"dataset_id"` fields being selected
- [ ] Check for hidden/legacy field definitions
- [ ] Verify all blockchain fields are removed

### **3. Dataset Model** (`Dataset.js`)
**Purpose:** Represents training datasets provided by TDPs

**Key Fields:**
- `id` (Primary Key)
- `dataset_id` (Unique identifier)
- `name`, `description`, `category`
- `tdp_id` (Foreign Key to User)
- `price`, `size`, `format`
- `confidential_computing_support`

**Relationships:**
- `belongsTo` User (as TDP)
- `belongsToMany` Contract (through ContractDataset)

### **4. ContractDataset Model** (`ContractDataset.js`)
**Purpose:** Junction table for many-to-many relationship between contracts and datasets

**Key Fields:**
- `id` (Primary Key)
- `contract_id` (Foreign Key)
- `dataset_id` (Foreign Key)
- `tdp_id` (Foreign Key)
- `individual_price`, `payment_status`

**Relationships:**
- `belongsTo` Contract
- `belongsTo` Dataset
- `belongsTo` User (as TDP)

## 🔗 **Relationship Models**

### **5. ContractTemplate Model** (`ContractTemplate.js`)
**Purpose:** Predefined contract templates

**Key Fields:**
- `template_id` (Primary Key)
- `name`, `description`, `category`
- `template_data` (JSONB)
- `is_active`, `version`

### **6. AIModel Model** (`AIModel.js`)
**Purpose:** Available AI models for training

**Key Fields:**
- `id` (Primary Key)
- `name`, `description`, `category`
- `model_type`, `parameters`
- `privacy_techniques`, `validation_metrics`

## 🏗️ **Infrastructure Models**

### **7. TrainingEnvironment Model** (`TrainingEnvironment.js`)
**Purpose:** Cloud environments for training

**Key Fields:**
- `id` (Primary Key)
- `contract_id` (Foreign Key)
- `environment_id`, `status`
- `cloud_provider`, `region`
- `compute_specs`, `storage_specs`

### **8. TrainingJob Model** (`TrainingJob.js`)
**Purpose:** Individual training jobs

**Key Fields:**
- `id` (Primary Key)
- `contract_id` (Foreign Key)
- `job_id`, `status`
- `start_time`, `end_time`
- `metrics`, `logs`

### **9. CCRPCloudCredentials Model** (`CCRPCloudCredentials.js`)
**Purpose:** Cloud provider credentials for CCRPs

**Key Fields:**
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `cloud_provider`, `credentials`
- `is_active`, `expires_at`

### **10. CCRPAzureCredentials Model** (`CCRPAzureCredentials.js`)
**Purpose:** Azure-specific credentials

**Key Fields:**
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `subscription_id`, `tenant_id`
- `client_id`, `client_secret`

## 🔒 **Security & Compliance Models**

### **11. PrivacyBudget Model** (`PrivacyBudget.js`)
**Purpose:** Differential privacy budget tracking

**Key Fields:**
- `id` (Primary Key)
- `contract_id` (Foreign Key)
- `budget_type`, `total_budget`
- `used_budget`, `remaining_budget`

### **12. PrivacyOperationsLog Model** (`PrivacyOperationsLog.js`)
**Purpose:** Log of privacy operations

**Key Fields:**
- `id` (Primary Key)
- `contract_id` (Foreign Key)
- `operation_type`, `privacy_cost`
- `timestamp`, `details`

### **13. DataBreach Model** (`DataBreach.js`)
**Purpose:** Data breach incident tracking

**Key Fields:**
- `id` (Primary Key)
- `contract_id` (Foreign Key)
- `breach_type`, `severity`
- `detected_at`, `resolved_at`

### **14. DataProcessingRecord Model** (`DataProcessingRecord.js`)
**Purpose:** Data processing activity logs

**Key Fields:**
- `id` (Primary Key)
- `contract_id` (Foreign Key)
- `processing_type`, `data_subject`
- `timestamp`, `legal_basis`

### **15. Consent Model** (`Consent.js`)
**Purpose:** User consent management

**Key Fields:**
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `contract_id` (Foreign Key)
- `consent_type`, `status`
- `granted_at`, `revoked_at`

### **16. Grievance Model** (`Grievance.js`)
**Purpose:** User grievance tracking

**Key Fields:**
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `contract_id` (Foreign Key)
- `grievance_type`, `status`
- `submitted_at`, `resolved_at`

## 🔍 **Provenance Models**

### **17. MerkleTree Model** (`MerkleTree.js`)
**Purpose:** Merkle tree for data provenance

**Key Fields:**
- `id` (Primary Key)
- `tree_id`, `root_hash`
- `node_count`, `depth`
- `created_at`

### **18. ProvenanceNode Model** (`ProvenanceNode.js`)
**Purpose:** Individual nodes in provenance tree

**Key Fields:**
- `id` (Primary Key)
- `tree_id` (Foreign Key)
- `node_hash`, `parent_hash`
- `node_type`, `data_reference`

### **19. ProvenanceCapture Model** (`ProvenanceCapture.js`)
**Purpose:** Captures provenance data during training

**Key Fields:**
- `id` (Primary Key)
- `contract_id` (Foreign Key)
- `capture_type`, `data_hash`
- `timestamp`, `metadata`

### **20. ProvenanceVerification Model** (`ProvenanceVerification.js`)
**Purpose:** Verification results for provenance

**Key Fields:**
- `id` (Primary Key)
- `capture_id` (Foreign Key)
- `verification_type`, `result`
- `verified_at`, `proof`

## 📊 **Monitoring & Logging Models**

### **21. SystemHealthLog Model** (`SystemHealthLog.js`)
**Purpose:** System health monitoring

**Key Fields:**
- `id` (Primary Key)
- `service_name`, `status`
- `metrics`, `timestamp`
- `details`

### **22. ScittClaim Model** (`ScittClaim.js`)
**Purpose:** SCITT CCF claims

**Key Fields:**
- `id` (Primary Key)
- `claim_id`, `claim_type`
- `payload`, `signature`
- `submitted_at`, `status`

### **23. Notification Model** (`Notification.js`)
**Purpose:** User notifications

**Key Fields:**
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `type`, `title`, `message`
- `read_at`, `created_at`

### **24. AuditLog Model** (`AuditLog.js`)
**Purpose:** System audit trail

**Key Fields:**
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `action`, `resource_type`
- `resource_id`, `timestamp`
- `details`

### **25. EnvironmentCost Model** (`EnvironmentCost.js`)
**Purpose:** Cloud environment cost tracking

**Key Fields:**
- `id` (Primary Key)
- `environment_id` (Foreign Key)
- `cost_type`, `amount`
- `period_start`, `period_end`

### **26. EnvironmentResource Model** (`EnvironmentResource.js`)
**Purpose:** Cloud resource tracking

**Key Fields:**
- `id` (Primary Key)
- `environment_id` (Foreign Key)
- `resource_type`, `resource_id`
- `specifications`, `status`

## 🚨 **Critical Issues to Address**

### **1. Contract Model Field Conflict**
**Issue:** SQL query shows `"tdp_id"` and `"dataset_id"` fields being selected
**Impact:** Database queries failing
**Action Required:** Find and remove these field definitions

### **2. Naming Convention Compliance**
**Issue:** Some models may not follow snake_case for columns
**Impact:** Inconsistent database schema
**Action Required:** Review all field definitions

### **3. Relationship Consistency**
**Issue:** Some relationships may be missing or incorrect
**Impact:** Data integrity issues
**Action Required:** Verify all foreign key relationships

## 📋 **Review Checklist**

- [ ] **Contract Model:** Remove `tdp_id` and `dataset_id` fields
- [ ] **All Models:** Verify snake_case column naming
- [ ] **All Models:** Check for unused/legacy fields
- [ ] **All Models:** Verify foreign key relationships
- [ ] **All Models:** Ensure proper indexes
- [ ] **All Models:** Check data types and constraints
- [ ] **All Models:** Verify timestamps are consistent

## 🎯 **Next Steps**

1. **Fix Contract Model** - Remove conflicting fields
2. **Review All Models** - Ensure naming conventions
3. **Test Relationships** - Verify foreign keys work
4. **Sync Database** - Create clean schema
5. **Validate** - Test all CRUD operations
