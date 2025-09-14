/**
 * Complete Schema Migration
 * 
 * This migration ensures ALL models have corresponding database tables
 * with proper columns, indexes, and constraints.
 * 
 * This is a comprehensive migration that covers all models in the system.
 */

const { QueryInterface, DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    console.log('🚀 Starting complete schema migration...');
    
    try {
      // 1. Create missing tables for contract signing
      await createContractSigningTables(queryInterface);
      
      // 2. Create missing tables for provenance tracking
      await createProvenanceTables(queryInterface);
      
      // 3. Create missing tables for system monitoring
      await createSystemMonitoringTables(queryInterface);
      
      // 4. Create missing tables for AI models
      await createAIModelTables(queryInterface);
      
      // 5. Create missing tables for privacy and compliance
      await createPrivacyComplianceTables(queryInterface);
      
      // 6. Create missing tables for enterprise features
      await createEnterpriseTables(queryInterface);
      
      // 7. Create missing tables for training environment
      await createTrainingTables(queryInterface);
      
      // 8. Create missing tables for notifications and audit
      await createNotificationAuditTables(queryInterface);
      
      console.log('🎉 Complete schema migration finished successfully!');
      
    } catch (error) {
      console.error('❌ Complete schema migration failed:', error.message);
      throw error;
    }
  },

  down: async (queryInterface) => {
    console.log('🔄 Rolling back complete schema migration...');
    // Rollback logic if needed
  }
};

async function createContractSigningTables(queryInterface) {
  console.log('📝 Creating contract signing tables...');
  
  // SigningEvent table
  await createTableIfNotExists(queryInterface, 'signing_events', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    event_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Type of signing event (SIGN_REQUESTED, SIGNED, VERIFIED, etc.)'
    },
    event_data: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Event-specific data in JSON format'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the user who triggered the event'
    },
    contract_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the contract involved in the event'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Signature table
  await createTableIfNotExists(queryInterface, 'signatures', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contract_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the contract being signed'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID of the user who signed the contract'
    },
    signature_data: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'JSON containing signature, algorithm, timestamp, and contract hash'
    },
    signature_algorithm: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Algorithm used for signing (ECDSA-P256, RSA-2048, etc.)'
    },
    key_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'ID of the signing key used'
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the signature has been verified'
    },
    verification_timestamp: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the signature was verified'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // SigningRequest table
  await createTableIfNotExists(queryInterface, 'signing_requests', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contract_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the contract'
    },
    requester_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID of the user requesting the signature'
    },
    signer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID of the user who needs to sign'
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SIGNED', 'REJECTED', 'EXPIRED'),
      allowNull: false,
      defaultValue: 'PENDING',
      comment: 'Status of the signing request'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the signing request expires'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional message with the signing request'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // UserKey table
  await createTableIfNotExists(queryInterface, 'user_keys', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the user who owns this key'
    },
    key_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'Unique identifier for this key'
    },
    key_type: {
      type: DataTypes.ENUM('ECDSA-P256', 'RSA-2048', 'RSA-4096'),
      allowNull: false,
      comment: 'Type of cryptographic key'
    },
    public_key: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Public key in PEM format'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this key is currently active'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When this key expires'
    }
  });

  // EnterpriseKey table
  await createTableIfNotExists(queryInterface, 'enterprise_keys', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the user who owns this key'
    },
    key_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'Unique identifier for this key'
    },
    key_type: {
      type: DataTypes.ENUM('ECDSA-P256', 'RSA-2048', 'RSA-4096'),
      allowNull: false,
      comment: 'Type of cryptographic key'
    },
    cloud_provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Cloud provider (AWS, Azure, GCP, OCI)'
    },
    kms_key_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Key ID in the cloud KMS'
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Cloud region where the key is stored'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this key is currently active'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  console.log('✅ Contract signing tables created');
}

async function createProvenanceTables(queryInterface) {
  console.log('🔗 Creating provenance tracking tables...');
  
  // ProvenanceNode table
  await createTableIfNotExists(queryInterface, 'provenance_nodes', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    node_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'Unique identifier for this provenance node'
    },
    node_type: {
      type: DataTypes.ENUM('DATA', 'CODE', 'MODEL', 'EXECUTION', 'CONTRACT'),
      allowNull: false,
      comment: 'Type of provenance node'
    },
    data_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Hash of the data this node represents'
    },
    parent_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Hash of the parent node in the provenance chain'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata about this node'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // ProvenanceVerification table
  await createTableIfNotExists(queryInterface, 'provenance_verifications', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    node_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Reference to the provenance node'
    },
    verification_status: {
      type: DataTypes.ENUM('PENDING', 'VERIFIED', 'FAILED'),
      allowNull: false,
      comment: 'Status of the verification'
    },
    verification_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Data used for verification'
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the verification was completed'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // MerkleTree table
  await createTableIfNotExists(queryInterface, 'merkle_trees', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tree_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'Unique identifier for this Merkle tree'
    },
    root_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Root hash of the Merkle tree'
    },
    leaf_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Number of leaves in the tree'
    },
    tree_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Serialized tree structure'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // ProvenanceCapture table
  await createTableIfNotExists(queryInterface, 'provenance_captures', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    capture_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'Unique identifier for this capture'
    },
    node_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Reference to the provenance node'
    },
    capture_type: {
      type: DataTypes.ENUM('AUTOMATIC', 'MANUAL', 'SYSTEM'),
      allowNull: false,
      comment: 'How this capture was triggered'
    },
    capture_data: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Data captured at this point'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  console.log('✅ Provenance tracking tables created');
}

async function createSystemMonitoringTables(queryInterface) {
  console.log('📊 Creating system monitoring tables...');
  
  // SystemHealthLog table
  await createTableIfNotExists(queryInterface, 'system_health_log', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    system_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Name of the system being monitored'
    },
    health_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      comment: 'Whether the system is healthy'
    },
    response_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Response time in milliseconds'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if system is unhealthy'
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metrics data'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  console.log('✅ System monitoring tables created');
}

async function createAIModelTables(queryInterface) {
  console.log('🤖 Creating AI model tables...');
  
  // AIModel table
  await createTableIfNotExists(queryInterface, 'ai_models', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Name of the AI model'
    },
    model_type: {
      type: DataTypes.ENUM('CLASSIFICATION', 'REGRESSION', 'CLUSTERING', 'DEEP_LEARNING'),
      allowNull: false,
      comment: 'Type of AI model'
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Version of the model'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of the model'
    },
    model_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Model configuration and metadata'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this model is currently active'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  console.log('✅ AI model tables created');
}

async function createPrivacyComplianceTables(queryInterface) {
  console.log('🔒 Creating privacy and compliance tables...');
  
  // PrivacyBudget table
  await createTableIfNotExists(queryInterface, 'privacy_budgets', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the user'
    },
    budget_type: {
      type: DataTypes.ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'),
      allowNull: false,
      comment: 'Type of privacy budget'
    },
    total_budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Total privacy budget allocated'
    },
    used_budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Privacy budget used so far'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'When this budget expires'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // PrivacyBudgetLog table
  await createTableIfNotExists(queryInterface, 'privacy_budget_logs', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    budget_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the privacy budget'
    },
    operation_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Type of operation that consumed budget'
    },
    budget_consumed: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Amount of budget consumed'
    },
    operation_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional data about the operation'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // DataBreach table
  await createTableIfNotExists(queryInterface, 'data_breaches', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    breach_type: {
      type: DataTypes.ENUM('UNAUTHORIZED_ACCESS', 'DATA_LEAK', 'SYSTEM_COMPROMISE'),
      allowNull: false,
      comment: 'Type of data breach'
    },
    severity: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
      allowNull: false,
      comment: 'Severity of the breach'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Description of the breach'
    },
    affected_users: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of users affected'
    },
    breach_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional breach information'
    },
    status: {
      type: DataTypes.ENUM('DETECTED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'),
      allowNull: false,
      defaultValue: 'DETECTED',
      comment: 'Current status of the breach'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  console.log('✅ Privacy and compliance tables created');
}

async function createEnterpriseTables(queryInterface) {
  console.log('🏢 Creating enterprise tables...');
  
  // CCRPCloudCredentials table
  await createTableIfNotExists(queryInterface, 'ccrp_cloud_credentials', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the user'
    },
    cloud_provider: {
      type: DataTypes.ENUM('AWS', 'AZURE', 'GCP', 'OCI'),
      allowNull: false,
      comment: 'Cloud provider'
    },
    credentials_data: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Encrypted cloud credentials'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether these credentials are active'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // CCRPAzureCredentials table
  await createTableIfNotExists(queryInterface, 'ccrp_azure_credentials', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the user'
    },
    tenant_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Azure tenant ID'
    },
    client_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Azure client ID'
    },
    credentials_data: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Encrypted Azure credentials'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether these credentials are active'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  console.log('✅ Enterprise tables created');
}

async function createTrainingTables(queryInterface) {
  console.log('🏋️ Creating training environment tables...');
  
  // TrainingEnvironment table (if not exists)
  await createTableIfNotExists(queryInterface, 'training_environments', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Name of the training environment'
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PROVISIONING', 'ACTIVE', 'TERMINATED', 'ERROR'),
      allowNull: false,
      defaultValue: 'PENDING',
      comment: 'Current status of the environment'
    },
    environment_type: {
      type: DataTypes.ENUM('LOCAL', 'CLOUD', 'HYBRID'),
      allowNull: false,
      comment: 'Type of training environment'
    },
    provisioning_method: {
      type: DataTypes.ENUM('MANUAL', 'AUTOMATED', 'HYBRID'),
      allowNull: false,
      defaultValue: 'AUTOMATED',
      comment: 'Method used to provision this environment'
    },
    cloud_provider: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Cloud provider for this environment'
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Geographic region of the environment'
    },
    instance_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Type of compute instance'
    },
    resource_specs: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Resource specifications for the environment'
    },
    security_config: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Security configuration for the environment'
    },
    attestation_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Attestation data for the environment'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // TrainingJob table (if not exists)
  await createTableIfNotExists(queryInterface, 'training_jobs', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Name of the training job'
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PENDING',
      comment: 'Current status of the training job'
    },
    environment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the training environment used for this job'
    },
    model_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the AI model being trained'
    },
    contract_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the contract associated with this training job'
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL'),
      allowNull: false,
      defaultValue: 'NORMAL',
      comment: 'Priority level of the training job'
    },
    estimated_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Estimated duration in minutes'
    },
    actual_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Actual duration in minutes'
    },
    resource_requirements: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Resource requirements for the training job'
    },
    training_configuration: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Training configuration parameters'
    },
    provenance_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Provenance tracking data for the training job'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // TrainingProgress table (if not exists)
  await createTableIfNotExists(queryInterface, 'training_progress', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID of the training job'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp of the progress update'
    },
    progress: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: 'Progress percentage (0-100)'
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Training metrics at this point'
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Status at this point in training'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Status message'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  console.log('✅ Training environment tables created');
}

async function createNotificationAuditTables(queryInterface) {
  console.log('📢 Creating notification and audit tables...');
  
  // Notification table (if not exists)
  await createTableIfNotExists(queryInterface, 'notifications', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('INFO', 'WARNING', 'ERROR', 'SUCCESS'),
      allowNull: false,
      comment: 'Type of notification'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Title of the notification'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Message content'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the notification has been read'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the user'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // AuditLog table
  await createTableIfNotExists(queryInterface, 'audit_logs', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Reference to the user who performed the action'
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Action performed'
    },
    resource_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Type of resource affected'
    },
    resource_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the resource affected'
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional details about the action'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address of the user'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent string'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  console.log('✅ Notification and audit tables created');
}

// Helper function to create table only if it doesn't exist
async function createTableIfNotExists(queryInterface, tableName, tableDefinition) {
  try {
    await queryInterface.createTable(tableName, tableDefinition);
    console.log(`  ✅ Table '${tableName}' created`);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`  ⚠️ Table '${tableName}' already exists, skipping`);
    } else {
      throw error;
    }
  }
}
