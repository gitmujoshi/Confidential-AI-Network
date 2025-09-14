cd# 📊 **Contract Management System - Data Model Reference**

## 🎯 **Purpose**
This document serves as the **single source of truth** for all data model definitions, associations, and configurations. All development must reference this document.

## 🏗️ **Core Data Model**

### **1. User Management**
```
users
├── id (PK)
├── name, email, password
├── party_type (TDP, TDC, CCRP, AppAdmin)
├── depa_id (unique identifier)
├── wallet_address, iam_user_id, did
├── organization, public_key
└── timestamps (created_at, updated_at)
```

### **2. Data Assets**
```
datasets
├── id (PK)
├── dataset_id (unique identifier)
├── name, description, category
├── size, record_count, price, license
├── owner_id (FK → users.id)
├── depa_id (unique identifier)
├── confidential_computing_required
├── provenance_tree_id (FK → merkle_trees.tree_id)
├── data_lineage (TEXT)
├── provenance_hash (VARCHAR)
└── timestamps

ai_models
├── id (PK)
├── model_id (unique identifier)
├── name, description, version
├── model_type, framework
├── owner_id (FK → users.id)
├── depa_id (unique identifier)
└── timestamps
```

### **3. Contract Management**
```
contracts
├── id (PK)
├── contract_id (unique identifier)
├── name, description, status
├── tdc_id (FK → users.id)
├── ccrp_id (FK → users.id)
├── tdp_ids (INTEGER[] - Array of TDP user IDs)
├── datasets (JSONB - Array of dataset objects with TDP info)
├── template_id (FK → contract_templates.template_id)
├── price, duration, terms_and_conditions
├── legal_document, environment_specs
├── training_params, depa_id
└── timestamps

contract_datasets (NEW - Junction Table)
├── id (PK)
├── contract_id (FK → contracts.contract_id)
├── dataset_id (FK → datasets.dataset_id)
├── tdp_id (FK → users.id)
├── individual_price, payment_status
└── timestamps

contract_templates
├── id (PK)
├── template_id (unique identifier)
├── name, description, category
├── contract_type, base_price, price_multiplier
├── created_by (FK → users.id)
├── usage_count, status
└── timestamps
```

### **4. Training Environment**
```
training_environments
├── id (PK)
├── environment_id (unique identifier)
├── contract_id (FK → contracts.contract_id)
├── status, cloud_provider
├── created_by, updated_by (FK → users.id)
└── timestamps

training_jobs
├── id (PK)
├── job_id (unique identifier)
├── contract_id (FK → contracts.contract_id)
├── status, progress, created_by (FK → users.id)
└── timestamps

environment_resources
├── id (PK)
├── environment_id (FK → training_environments.environment_id)
├── resource_type, resource_id, resource_name
├── resource_config, status
└── timestamps

environment_costs
├── id (PK)
├── environment_id (FK → training_environments.environment_id)
├── cost_type, amount, currency, period
└── timestamps
```

### **5. Provenance Tracking (NEW)**
```
merkle_trees
├── id (PK)
├── tree_id (unique identifier)
├── contract_id (FK → contracts.contract_id)
├── tree_type, hash_algorithm, max_depth
├── root_hash, node_count
└── timestamps

provenance_nodes
├── id (PK)
├── node_id (unique identifier)
├── tree_id (FK → merkle_trees.tree_id)
├── node_type, data_hash
├── parent_hash, left_child_hash, right_child_hash
├── level, position, metadata
├── timestamp, is_verified
└── (no timestamps - managed by parent)

provenance_captures
├── id (PK)
├── capture_id (unique identifier)
├── contract_id (FK → contracts.contract_id)
├── capture_type, data_source, data_hash
├── merkle_proof, verification_status
├── captured_at, verified_at
└── (no timestamps - managed by parent)

provenance_verifications
├── id (PK)
├── verification_id (unique identifier)
├── capture_id (FK → provenance_captures.capture_id)
├── verification_method, status, details
├── verified_at
└── (no timestamps - managed by parent)
```

### **6. SCITT CCF Integration**
```
scitt_claims
├── id (PK)
├── claim_id (unique identifier)
├── contract_id (FK → contracts.contract_id)
├── claim_data (JSONB), status
├── receipt, provenance_tree_id
├── provenance_root
└── timestamps

system_health_logs
├── id (PK)
├── service_name, status, message
├── details (JSONB), timestamp
└── (no timestamps - managed by parent)
```

### **7. DPDP (Data Privacy & Protection)**
```
consents
├── id (PK)
├── user_id (FK → users.id)
├── consent_type, status, granted_at
└── timestamps

data_processing_records
├── id (PK)
├── user_id (FK → users.id)
├── consent_id (FK → consents.id)
├── processing_type, data_processed
└── timestamps

grievances
├── id (PK)
├── user_id (FK → users.id)
├── assigned_to (FK → users.id)
├── type, status, description
└── timestamps

audit_logs
├── id (PK)
├── user_id (FK → users.id)
├── action, resource, details
└── timestamps
```

## 🔗 **Association Rules**

### **Golden Rule: Define associations in ONE place only**

1. **User Associations** → Defined in `User.js` model
2. **Dataset Associations** → Defined in `Dataset.js` model  
3. **Contract Associations** → Defined in `Contract.js` model
4. **Training Environment Associations** → Defined in respective models
5. **Provenance Associations** → Defined in provenance models
6. **Cross-cutting Associations** → Only in `models/index.js` if not defined elsewhere

### **Association Patterns:**
```javascript
// ✅ CORRECT: Define in model file
User.associate = (models) => {
  User.hasMany(models.Dataset, { foreignKey: 'ownerId', as: 'datasets' });
  User.hasMany(models.Contract, { foreignKey: 'tdpId', as: 'tdpContracts' });
};

// ❌ WRONG: Define in multiple places
// This causes "duplicate alias" errors
```

## ⚙️ **Configuration Standards**

### **Database Configuration:**
```bash
# Single source of truth: config.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USER=***REMOVED-DB_PASSWORD***
DB_PASSWORD=***REMOVED-DB_PASSWORD***  # Required for production, optional for dev with trust auth
```

### **Environment Files:**
- **`config.env`** → Main configuration (source of truth)
- **`backend/config.env`** → Backend-specific overrides (if needed)
- **Docker Compose** → Container-specific overrides

## 🚀 **Implementation Checklist**

### **Before Implementing Any Feature:**
- [ ] Check this data model reference
- [ ] Verify no duplicate associations exist
- [ ] Update this document if adding new entities
- [ ] Test database connectivity
- [ ] Validate associations work correctly

### **When Adding New Models:**
- [ ] Define model structure here first
- [ ] Create Sequelize model file
- [ ] Define associations in the model file only
- [ ] Add to models/index.js (import only)
- [ ] Update this document

## 🔧 **Current Issues & Solutions**

### **Issue 1: Association Conflicts**
- **Cause**: Duplicate associations defined in multiple places
- **Solution**: Follow the "Golden Rule" above

### **Issue 2: Database Connection Problems**
- **Cause**: Inconsistent configuration files
- **Solution**: Use `config.env` as single source of truth

### **Issue 3: Model Synchronization**
- **Cause**: Models and database schema out of sync
- **Solution**: Always run migrations after model changes

## 📝 **Next Steps for Provenance Integration**

1. **Verify this data model** is complete and accurate
2. **Run provenance migration** using the existing script
3. **Test provenance services** with sample data
4. **Integrate with SCITT CCF** service
5. **Update this document** with any changes

---

**Remember**: This document is the **single source of truth**. Always reference it before making changes to the data model.
