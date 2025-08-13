-- Initialize Contract Management Database
-- This script creates the main database schema for the Contract Management System

-- Create the main database if it doesn't exist
SELECT 'CREATE DATABASE contract_management'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'contract_management')\gexec

-- Connect to the contract_management database
\c contract_management;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USERS TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    party_type VARCHAR(50) NOT NULL CHECK (party_type IN ('TDP', 'TDC', 'CCRP', 'AppAdmin')),
    organization VARCHAR(255),
    wallet_address VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_registered BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    depa_id VARCHAR(255) UNIQUE,
    public_key TEXT,
    iam_username VARCHAR(255),
    did VARCHAR(255) UNIQUE,
    last_login_at TIMESTAMP,
    description TEXT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    iam_user_id VARCHAR(255) UNIQUE,
    did_source VARCHAR(100) CHECK (did_source IN ('SYSTEM_GENERATED', 'USER_PROVIDED')),
    did_verified BOOLEAN DEFAULT FALSE,
    onboarding_status VARCHAR(100) DEFAULT 'pending' CHECK (onboarding_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED')),
    profile_completed BOOLEAN DEFAULT FALSE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    cloud_providers JSONB,
    did_verification_method VARCHAR(100),
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    phone_number VARCHAR(20),
    website VARCHAR(255),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. DATASETS TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS datasets (
    id SERIAL PRIMARY KEY,
    dataset_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Computer Vision', 'Natural Language Processing', 'Audio', 'Tabular', 'Multimodal')),
    size INTEGER NOT NULL,
    record_count INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    license VARCHAR(255) NOT NULL,
    tags JSONB,
    metadata JSONB,
    is_public BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    confidential_computing_required BOOLEAN DEFAULT FALSE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    depa_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. CONTRACTS TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    contract_id VARCHAR(255) UNIQUE NOT NULL,
    blockchain_contract_id INTEGER,
    legal_document_hash VARCHAR(66),
    ricardian_signature VARCHAR(132),
    smart_contract_address VARCHAR(42),
    smart_contract_network VARCHAR(50) DEFAULT 'goerli',
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_TDP', 'PENDING_TDP_APPROVAL', 'PENDING_TDC', 
        'PENDING_CCRP', 'PENDING_CCRP_APPROVAL', 'SIGNED', 'EXECUTING', 
        'COMPLETED', 'REJECTED', 'FAILED'
    )),
    price DECIMAL(10, 2) NOT NULL,
    duration INTEGER NOT NULL,
    terms_and_conditions TEXT NOT NULL,
    template_id VARCHAR(255),
    legal_document JSONB,
    environment_specs JSONB,
    training_params JSONB,
    ai_model_ids JSONB,
    attestation_verified BOOLEAN DEFAULT FALSE,
    attestation_report JSONB,
    kms_configs JSONB,
    tdp_signed BOOLEAN DEFAULT FALSE,
    ccrp_signed BOOLEAN DEFAULT FALSE,
    tdp_signed_at TIMESTAMP,
    ccrp_signed_at TIMESTAMP,
    tdc_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ccrp_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ccrp_cloud_provider VARCHAR(50),
    ccrp_azure_subscription_id VARCHAR(255),
    ccrp_azure_tenant_id VARCHAR(255),
    ccrp_azure_location VARCHAR(100) DEFAULT 'eastus',
    ccrp_azure_resource_group_prefix VARCHAR(100) DEFAULT 'training',
    ccrp_azure_vm_size VARCHAR(100) DEFAULT 'Standard_D2s_v3',
    ccrp_azure_storage_sku VARCHAR(100) DEFAULT 'Standard_LRS',
    ccrp_azure_database_sku VARCHAR(100) DEFAULT 'Basic',
    ccrp_azure_enable_encryption BOOLEAN DEFAULT TRUE,
    ccrp_azure_enable_monitoring BOOLEAN DEFAULT TRUE,
    ccrp_azure_budget_limit DECIMAL(10, 2),
    contract_datasets JSONB NOT NULL,
    dataset_count INTEGER NOT NULL DEFAULT 1 CHECK (dataset_count >= 1 AND dataset_count <= 3),
    tdp_count INTEGER NOT NULL DEFAULT 1 CHECK (tdp_count >= 1 AND tdp_count <= 3),
    total_price DECIMAL(10, 2),
    tdp_signatures JSONB,
    tdp_payments JSONB,
    multi_tdp_status VARCHAR(50) DEFAULT 'DRAFT' CHECK (multi_tdp_status IN (
        'DRAFT', 'PENDING_TDP', 'PENDING_ALL_TDP_APPROVAL', 'PENDING_TDC',
        'PENDING_CCRP', 'SIGNED', 'EXECUTING', 'COMPLETED', 'REJECTED', 'FAILED'
    )),
    depa_id VARCHAR(255) UNIQUE,
    service_account VARCHAR(255),
    container_image VARCHAR(255),
    log_destination VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. NOTIFICATIONS TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'USER_REGISTERED', 'CONTRACT_CREATED', 'CONTRACT_SIGNED', 
        'CONTRACT_COMPLETED', 'CONTRACT_CANCELLED', 'CCRP_SELECTED'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. AI MODELS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_models (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_type VARCHAR(100) NOT NULL,
    version VARCHAR(50),
    framework VARCHAR(100),
    parameters BIGINT,
    accuracy DECIMAL(5, 4),
    training_data_requirements JSONB,
    privacy_techniques JSONB,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    depa_id VARCHAR(255) UNIQUE,
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. CONTRACT TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contract_templates (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(100) NOT NULL,
    legal_document_template JSONB NOT NULL,
    smart_contract_template TEXT,
    parameters_schema JSONB,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    version VARCHAR(50) DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. SCITT CLAIMS TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS scitt_claims (
    id SERIAL PRIMARY KEY,
    claim_id VARCHAR(255) UNIQUE NOT NULL,
    claim_type VARCHAR(100) NOT NULL,
    claim_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    scitt_node_url VARCHAR(255),
    scitt_claim_hash VARCHAR(255),
    attestation_status VARCHAR(50),
    attestation_report JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. SYSTEM HEALTH LOGS TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_health_logs (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('HEALTHY', 'DEGRADED', 'UNHEALTHY')),
    response_time INTEGER,
    error_message TEXT,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. PRIVACY BUDGET TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS privacy_budget (
    id SERIAL PRIMARY KEY,
    budget_id VARCHAR(255) UNIQUE NOT NULL,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    total_budget DECIMAL(10, 4) NOT NULL,
    used_budget DECIMAL(10, 4) DEFAULT 0,
    remaining_budget DECIMAL(10, 4) GENERATED ALWAYS AS (total_budget - used_budget) STORED,
    budget_type VARCHAR(50) NOT NULL CHECK (budget_type IN ('EPSILON', 'DELTA', 'SENSITIVITY')),
    privacy_mechanism VARCHAR(100),
    parameters JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 10. PRIVACY OPERATIONS LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS privacy_operations_log (
    id SERIAL PRIMARY KEY,
    operation_id VARCHAR(255) UNIQUE NOT NULL,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    operation_type VARCHAR(100) NOT NULL,
    privacy_cost DECIMAL(10, 4) NOT NULL,
    operation_details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 11. CCRP CLOUD CREDENTIALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ccrp_cloud_credentials (
    id SERIAL PRIMARY KEY,
    credential_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cloud_provider VARCHAR(50) NOT NULL CHECK (cloud_provider IN ('AWS', 'GCP', 'Azure', 'OCI')),
    credential_type VARCHAR(50) NOT NULL CHECK (credential_type IN ('API_KEY', 'SERVICE_ACCOUNT', 'IAM_ROLE', 'ACCESS_TOKEN')),
    credentials JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 12. CCRP AZURE CREDENTIALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ccrp_azure_credentials (
    id SERIAL PRIMARY KEY,
    credential_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    resource_group VARCHAR(255),
    location VARCHAR(100) DEFAULT 'eastus',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 13. TRAINING ENVIRONMENT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS training_environment (
    id SERIAL PRIMARY KEY,
    environment_id VARCHAR(255) UNIQUE NOT NULL,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    environment_name VARCHAR(255) NOT NULL,
    environment_type VARCHAR(100) NOT NULL,
    cloud_provider VARCHAR(50) NOT NULL,
    compute_specs JSONB NOT NULL,
    storage_specs JSONB,
    network_specs JSONB,
    security_config JSONB,
    status VARCHAR(50) DEFAULT 'CREATING' CHECK (status IN ('CREATING', 'RUNNING', 'STOPPED', 'TERMINATED', 'ERROR')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 14. TRAINING JOB TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS training_job (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    environment_id INTEGER NOT NULL REFERENCES training_environment(id) ON DELETE CASCADE,
    job_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    training_script TEXT,
    hyperparameters JSONB,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    metrics JSONB,
    logs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 15. ENVIRONMENT COST TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS environment_cost (
    id SERIAL PRIMARY KEY,
    cost_id VARCHAR(255) UNIQUE NOT NULL,
    environment_id INTEGER NOT NULL REFERENCES training_environment(id) ON DELETE CASCADE,
    cost_type VARCHAR(50) NOT NULL CHECK (cost_type IN ('COMPUTE', 'STORAGE', 'NETWORK', 'OTHER')),
    amount DECIMAL(10, 4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_period VARCHAR(20),
    cost_details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 16. ENVIRONMENT RESOURCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS environment_resource (
    id SERIAL PRIMARY KEY,
    resource_id VARCHAR(255) UNIQUE NOT NULL,
    environment_id INTEGER NOT NULL REFERENCES training_environment(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('VM', 'CONTAINER', 'STORAGE', 'NETWORK')),
    resource_name VARCHAR(255) NOT NULL,
    resource_specs JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'CREATING' CHECK (status IN ('CREATING', 'RUNNING', 'STOPPED', 'TERMINATED', 'ERROR')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 17. DATA BREACH TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS data_breach (
    id SERIAL PRIMARY KEY,
    breach_id VARCHAR(255) UNIQUE NOT NULL,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    breach_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    affected_data JSONB,
    mitigation_actions JSONB,
    status VARCHAR(50) DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'INVESTIGATING', 'MITIGATED', 'RESOLVED')),
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 18. DATA PROCESSING RECORD TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS data_processing_record (
    id SERIAL PRIMARY KEY,
    record_id VARCHAR(255) UNIQUE NOT NULL,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    processing_type VARCHAR(100) NOT NULL,
    data_subject_count INTEGER,
    processing_purpose TEXT,
    legal_basis VARCHAR(100),
    retention_period INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 19. GRIEVANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS grievance (
    id SERIAL PRIMARY KEY,
    grievance_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
    grievance_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED')),
    resolution TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 20. AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    log_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 21. CONSENT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS consent (
    id SERIAL PRIMARY KEY,
    consent_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
    consent_type VARCHAR(100) NOT NULL,
    purpose TEXT NOT NULL,
    data_categories JSONB,
    third_parties JSONB,
    consent_given BOOLEAN NOT NULL,
    consent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    withdrawal_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_party_type ON users(party_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_depa_id ON users(depa_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_did ON users(did) WHERE did IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_iam_user_id ON users(iam_user_id) WHERE iam_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_onboarding_status ON users(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at) WHERE last_login_at IS NOT NULL;

-- Datasets table indexes
CREATE INDEX IF NOT EXISTS idx_datasets_dataset_id ON datasets(dataset_id);
CREATE INDEX IF NOT EXISTS idx_datasets_category ON datasets(category);
CREATE INDEX IF NOT EXISTS idx_datasets_owner_id ON datasets(owner_id);
CREATE INDEX IF NOT EXISTS idx_datasets_is_public ON datasets(is_public);
CREATE INDEX IF NOT EXISTS idx_datasets_confidential_computing_required ON datasets(confidential_computing_required);
CREATE INDEX IF NOT EXISTS idx_datasets_depa_id ON datasets(depa_id) WHERE depa_id IS NOT NULL;

-- Contracts table indexes
CREATE INDEX IF NOT EXISTS idx_contracts_contract_id ON contracts(contract_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_tdc_id ON contracts(tdc_id);
CREATE INDEX IF NOT EXISTS idx_contracts_ccrp_id ON contracts(ccrp_id) WHERE ccrp_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_blockchain_contract_id ON contracts(blockchain_contract_id) WHERE blockchain_contract_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_legal_document_hash ON contracts(legal_document_hash) WHERE legal_document_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_smart_contract_address ON contracts(smart_contract_address) WHERE smart_contract_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_attestation_verified ON contracts(attestation_verified);
CREATE INDEX IF NOT EXISTS idx_contracts_depa_id ON contracts(depa_id) WHERE depa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_multi_tdp_status ON contracts(multi_tdp_status);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- AI Models table indexes
CREATE INDEX IF NOT EXISTS idx_ai_models_model_id ON ai_models(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_owner_id ON ai_models(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_model_type ON ai_models(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_models_is_public ON ai_models(is_public);
CREATE INDEX IF NOT EXISTS idx_ai_models_depa_id ON ai_models(depa_id) WHERE depa_id IS NOT NULL;

-- Contract Templates table indexes
CREATE INDEX IF NOT EXISTS idx_contract_templates_template_id ON contract_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_created_by ON contract_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_contract_templates_template_type ON contract_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_contract_templates_is_active ON contract_templates(is_active);

-- SCITT Claims table indexes
CREATE INDEX IF NOT EXISTS idx_scitt_claims_claim_id ON scitt_claims(claim_id);
CREATE INDEX IF NOT EXISTS idx_scitt_claims_claim_type ON scitt_claims(claim_type);
CREATE INDEX IF NOT EXISTS idx_scitt_claims_status ON scitt_claims(status);
CREATE INDEX IF NOT EXISTS idx_scitt_claims_scitt_claim_hash ON scitt_claims(scitt_claim_hash) WHERE scitt_claim_hash IS NOT NULL;

-- System Health Logs table indexes
CREATE INDEX IF NOT EXISTS idx_system_health_logs_service_name ON system_health_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_status ON system_health_logs(status);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_timestamp ON system_health_logs(timestamp);

-- Privacy Budget table indexes
CREATE INDEX IF NOT EXISTS idx_privacy_budget_budget_id ON privacy_budget(budget_id);
CREATE INDEX IF NOT EXISTS idx_privacy_budget_contract_id ON privacy_budget(contract_id);
CREATE INDEX IF NOT EXISTS idx_privacy_budget_budget_type ON privacy_budget(budget_type);

-- Privacy Operations Log table indexes
CREATE INDEX IF NOT EXISTS idx_privacy_operations_log_operation_id ON privacy_operations_log(operation_id);
CREATE INDEX IF NOT EXISTS idx_privacy_operations_log_contract_id ON privacy_operations_log(contract_id);
CREATE INDEX IF NOT EXISTS idx_privacy_operations_log_operation_type ON privacy_operations_log(operation_type);
CREATE INDEX IF NOT EXISTS idx_privacy_operations_log_timestamp ON privacy_operations_log(timestamp);

-- CCRP Cloud Credentials table indexes
CREATE INDEX IF NOT EXISTS idx_ccrp_cloud_credentials_credential_id ON ccrp_cloud_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_ccrp_cloud_credentials_user_id ON ccrp_cloud_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_ccrp_cloud_credentials_cloud_provider ON ccrp_cloud_credentials(cloud_provider);
CREATE INDEX IF NOT EXISTS idx_ccrp_cloud_credentials_is_active ON ccrp_cloud_credentials(is_active);

-- CCRP Azure Credentials table indexes
CREATE INDEX IF NOT EXISTS idx_ccrp_azure_credentials_credential_id ON ccrp_azure_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_ccrp_azure_credentials_user_id ON ccrp_azure_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_ccrp_azure_credentials_subscription_id ON ccrp_azure_credentials(subscription_id);
CREATE INDEX IF NOT EXISTS idx_ccrp_azure_credentials_is_active ON ccrp_azure_credentials(is_active);

-- Training Environment table indexes
CREATE INDEX IF NOT EXISTS idx_training_environment_environment_id ON training_environment(environment_id);
CREATE INDEX IF NOT EXISTS idx_training_environment_contract_id ON training_environment(contract_id);
CREATE INDEX IF NOT EXISTS idx_training_environment_cloud_provider ON training_environment(cloud_provider);
CREATE INDEX IF NOT EXISTS idx_training_environment_status ON training_environment(status);

-- Training Job table indexes
CREATE INDEX IF NOT EXISTS idx_training_job_job_id ON training_job(job_id);
CREATE INDEX IF NOT EXISTS idx_training_job_contract_id ON training_job(contract_id);
CREATE INDEX IF NOT EXISTS idx_training_job_environment_id ON training_job(environment_id);
CREATE INDEX IF NOT EXISTS idx_training_job_status ON training_job(status);

-- Environment Cost table indexes
CREATE INDEX IF NOT EXISTS idx_environment_cost_cost_id ON environment_cost(cost_id);
CREATE INDEX IF NOT EXISTS idx_environment_cost_environment_id ON environment_cost(environment_id);
CREATE INDEX IF NOT EXISTS idx_environment_cost_cost_type ON environment_cost(cost_type);
CREATE INDEX IF NOT EXISTS idx_environment_cost_timestamp ON environment_cost(timestamp);

-- Environment Resource table indexes
CREATE INDEX IF NOT EXISTS idx_environment_resource_resource_id ON environment_resource(resource_id);
CREATE INDEX IF NOT EXISTS idx_environment_resource_environment_id ON environment_resource(environment_id);
CREATE INDEX IF NOT EXISTS idx_environment_resource_resource_type ON environment_resource(resource_type);
CREATE INDEX IF NOT EXISTS idx_environment_resource_status ON environment_resource(status);

-- Data Breach table indexes
CREATE INDEX IF NOT EXISTS idx_data_breach_breach_id ON data_breach(breach_id);
CREATE INDEX IF NOT EXISTS idx_data_breach_contract_id ON data_breach(contract_id);
CREATE INDEX IF NOT EXISTS idx_data_breach_severity ON data_breach(severity);
CREATE INDEX IF NOT EXISTS idx_data_breach_status ON data_breach(status);

-- Data Processing Record table indexes
CREATE INDEX IF NOT EXISTS idx_data_processing_record_record_id ON data_processing_record(record_id);
CREATE INDEX IF NOT EXISTS idx_data_processing_record_contract_id ON data_processing_record(contract_id);
CREATE INDEX IF NOT EXISTS idx_data_processing_record_processing_type ON data_processing_record(processing_type);

-- Grievance table indexes
CREATE INDEX IF NOT EXISTS idx_grievance_grievance_id ON grievance(grievance_id);
CREATE INDEX IF NOT EXISTS idx_grievance_user_id ON grievance(user_id);
CREATE INDEX IF NOT EXISTS idx_grievance_contract_id ON grievance(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grievance_status ON grievance(status);

-- Audit Log table indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_log_id ON audit_log(log_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON audit_log(resource_type) WHERE resource_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);

-- Consent table indexes
CREATE INDEX IF NOT EXISTS idx_consent_consent_id ON consent(consent_id);
CREATE INDEX IF NOT EXISTS idx_consent_user_id ON consent(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_contract_id ON consent(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consent_consent_type ON consent(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_is_active ON consent(is_active);

-- =====================================================
-- UPDATE TIMESTAMP TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at columns
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'users', 'datasets', 'contracts', 'notifications', 'ai_models',
            'contract_templates', 'scitt_claims', 'system_health_logs',
            'privacy_budget', 'privacy_operations_log', 'ccrp_cloud_credentials',
            'ccrp_azure_credentials', 'training_environment', 'training_job',
            'environment_cost', 'environment_resource', 'data_breach',
            'data_processing_record', 'grievance', 'audit_log', 'consent'
        )
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at 
                BEFORE UPDATE ON %I 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default admin user
INSERT INTO users (name, email, party_type, organization, wallet_address, is_active, is_registered, depa_id) 
VALUES (
    'System Administrator', 
    'admin@contract-management.local', 
    'AppAdmin', 
    'Contract Management System',
    '0x0000000000000000000000000000000000000000',
    true,
    true,
    'ADMIN-' || gen_random_uuid()
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant all privileges to postgres user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Contract Management System Database Initialized!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Total tables created: %', (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public'
    );
    RAISE NOTICE 'Total indexes created: %', (
        SELECT COUNT(*) FROM pg_indexes 
        WHERE schemaname = 'public'
    );
    RAISE NOTICE '=====================================================';
END $$;
