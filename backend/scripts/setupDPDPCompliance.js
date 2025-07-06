/**
 * DPDP Compliance Database Setup Script
 * 
 * This script creates the necessary database tables and indexes for
 * Digital Personal Data Protection (DPDP) Act 2023 compliance.
 * 
 * Tables Created:
 * - consents: User consent records
 * - data_processing_records: Records of data processing activities
 * - data_breaches: Data breach incidents
 * - dpdp_audit_logs: DPDP-specific audit logs
 * - dpia_reports: Data Protection Impact Assessment reports
 * - data_retention_policies: Data retention configuration
 * - grievance_records: User grievance and complaint records
 */

const { Sequelize, DataTypes } = require('sequelize');
const db = require('../models');

async function setupDPDPCompliance() {
  console.log('🔐 Setting up DPDP compliance database tables...');

  try {
    // 1. Consents Table
    const Consent = db.sequelize.define('Consent', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      purpose: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Purpose for which consent is given'
      },
      dataTypes: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'JSON array of data types being processed'
      },
      consentType: {
        type: DataTypes.ENUM('EXPLICIT', 'IMPLIED', 'LEGITIMATE_INTEREST'),
        allowNull: false,
        defaultValue: 'EXPLICIT'
      },
      consentText: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Text of the consent provided to user'
      },
      grantedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      withdrawnAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      version: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '1.0'
      },
      withdrawalMethod: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Method used to withdraw consent'
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      tableName: 'consents',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['purpose'] },
        { fields: ['isActive'] },
        { fields: ['grantedAt'] }
      ]
    });

    // 2. Data Processing Records Table
    const DataProcessingRecord = db.sequelize.define('DataProcessingRecord', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      processingActivity: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Description of the processing activity'
      },
      purpose: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Purpose of data processing'
      },
      dataTypes: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'JSON array of data types processed'
      },
      legalBasis: {
        type: DataTypes.ENUM('CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS'),
        allowNull: false
      },
      consentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'consents',
          key: 'id'
        }
      },
      processedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      retentionPeriod: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'How long data will be retained'
      },
      securityMeasures: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object describing security measures'
      }
    }, {
      tableName: 'data_processing_records',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['processingActivity'] },
        { fields: ['purpose'] },
        { fields: ['processedAt'] }
      ]
    });

    // 3. Data Breaches Table
    const DataBreach = db.sequelize.define('DataBreach', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      incidentType: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Type of data breach incident'
      },
      severity: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
        allowNull: false
      },
      affectedUsers: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of affected user IDs'
      },
      dataTypes: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'JSON array of affected data types'
      },
      detectedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      reportedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('DETECTED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'),
        allowNull: false,
        defaultValue: 'DETECTED'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      impactAssessment: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Assessment of breach impact'
      },
      remediationActions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of remediation actions taken'
      },
      notifiedAuthorities: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      notifiedUsers: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    }, {
      tableName: 'data_breaches',
      timestamps: true,
      indexes: [
        { fields: ['severity'] },
        { fields: ['status'] },
        { fields: ['detectedAt'] }
      ]
    });

    // 4. DPDP Audit Logs Table
    const DPDPAuditLog = db.sequelize.define('DPDPAuditLog', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      eventType: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Type of DPDP event'
      },
      dataType: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Type of data involved'
      },
      purpose: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Purpose of data processing'
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      details: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with additional details'
      },
      sessionId: {
        type: DataTypes.STRING,
        allowNull: true
      }
    }, {
      tableName: 'dpdp_audit_logs',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['eventType'] },
        { fields: ['timestamp'] },
        { fields: ['dataType'] }
      ]
    });

    // 5. DPIA Reports Table
    const DPIAReport = db.sequelize.define('DPIAReport', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      processingActivity: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Description of the processing activity'
      },
      riskLevel: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
        allowNull: false
      },
      dataTypes: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'JSON array of data types involved'
      },
      purposes: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'JSON array of processing purposes'
      },
      retentionPeriod: {
        type: DataTypes.STRING,
        allowNull: false
      },
      securityMeasures: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object describing security measures'
      },
      riskAssessment: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detailed risk assessment'
      },
      mitigationMeasures: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of risk mitigation measures'
      },
      conductedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      conductedBy: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Name of person who conducted DPIA'
      },
      status: {
        type: DataTypes.ENUM('DRAFT', 'REVIEWED', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'DRAFT'
      },
      approvedBy: {
        type: DataTypes.STRING,
        allowNull: true
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      tableName: 'dpia_reports',
      timestamps: true,
      indexes: [
        { fields: ['riskLevel'] },
        { fields: ['status'] },
        { fields: ['conductedAt'] }
      ]
    });

    // 6. Data Retention Policies Table
    const DataRetentionPolicy = db.sequelize.define('DataRetentionPolicy', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      dataType: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Type of data this policy applies to'
      },
      retentionPeriod: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'How long data should be retained (e.g., "7 years")'
      },
      retentionReason: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Legal or business reason for retention'
      },
      disposalMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'SECURE_DELETION',
        comment: 'Method used for data disposal'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      lastReviewDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      nextReviewDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
      tableName: 'data_retention_policies',
      timestamps: true,
      indexes: [
        { fields: ['dataType'] },
        { fields: ['isActive'] },
        { fields: ['nextReviewDate'] }
      ]
    });

    // 7. Grievance Records Table
    const GrievanceRecord = db.sequelize.define('GrievanceRecord', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      grievanceType: {
        type: DataTypes.ENUM('DATA_ACCESS', 'DATA_CORRECTION', 'DATA_DELETION', 'CONSENT_WITHDRAWAL', 'BREACH_COMPLAINT', 'OTHER'),
        allowNull: false
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
        allowNull: false,
        defaultValue: 'PENDING'
      },
      priority: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
        defaultValue: 'MEDIUM'
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      assignedTo: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Name of person assigned to handle grievance'
      },
      resolution: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Description of how grievance was resolved'
      },
      userSatisfaction: {
        type: DataTypes.ENUM('SATISFIED', 'DISSATISFIED', 'NEUTRAL'),
        allowNull: true
      }
    }, {
      tableName: 'grievance_records',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['grievanceType'] },
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['submittedAt'] }
      ]
    });

    // Sync all models with database
    await db.sequelize.sync({ force: false });
    console.log('✅ DPDP compliance tables created successfully');

    // Insert default data retention policies
    await insertDefaultRetentionPolicies();

    console.log('🎉 DPDP compliance database setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up DPDP compliance database:', error);
    throw error;
  }
}

async function insertDefaultRetentionPolicies() {
  console.log('📋 Inserting default data retention policies...');

  const defaultPolicies = [
    {
      dataType: 'USER_PROFILE',
      retentionPeriod: '7 years',
      retentionReason: 'Contract management and legal compliance requirements',
      disposalMethod: 'SECURE_DELETION',
      createdBy: 'SYSTEM'
    },
    {
      dataType: 'CONTRACT_DATA',
      retentionPeriod: '10 years',
      retentionReason: 'Legal and regulatory requirements for contract records',
      disposalMethod: 'SECURE_DELETION',
      createdBy: 'SYSTEM'
    },
    {
      dataType: 'CONSENT_RECORDS',
      retentionPeriod: '7 years',
      retentionReason: 'Legal compliance and audit trail requirements',
      disposalMethod: 'SECURE_DELETION',
      createdBy: 'SYSTEM'
    },
    {
      dataType: 'AUDIT_LOGS',
      retentionPeriod: '7 years',
      retentionReason: 'Regulatory compliance and security monitoring',
      disposalMethod: 'SECURE_DELETION',
      createdBy: 'SYSTEM'
    },
    {
      dataType: 'TRANSACTION_DATA',
      retentionPeriod: '5 years',
      retentionReason: 'Financial compliance and audit requirements',
      disposalMethod: 'SECURE_DELETION',
      createdBy: 'SYSTEM'
    },
    {
      dataType: 'BREACH_RECORDS',
      retentionPeriod: '7 years',
      retentionReason: 'Regulatory reporting and incident management',
      disposalMethod: 'SECURE_DELETION',
      createdBy: 'SYSTEM'
    }
  ];

  for (const policy of defaultPolicies) {
    await db.sequelize.models.DataRetentionPolicy.findOrCreate({
      where: { dataType: policy.dataType },
      defaults: policy
    });
  }

  console.log('✅ Default retention policies inserted successfully');
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDPDPCompliance()
    .then(() => {
      console.log('🎯 DPDP compliance setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 DPDP compliance setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDPDPCompliance, insertDefaultRetentionPolicies }; 