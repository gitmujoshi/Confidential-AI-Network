const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./User')(sequelize, Sequelize);
db.Dataset = require('./Dataset')(sequelize, Sequelize);
db.Contract = require('./Contract')(sequelize, Sequelize);
db.Notification = require('./Notification')(sequelize, Sequelize);
db.AIModel = require('./AIModel')(sequelize, Sequelize);

// Import contract template model
db.ContractTemplate = require('./ContractTemplate')(sequelize, Sequelize);

// Import training environment models
db.TrainingEnvironment = require('./TrainingEnvironment')(sequelize, Sequelize);
db.TrainingJob = require('./TrainingJob')(sequelize, Sequelize);
db.EnvironmentResource = require('./EnvironmentResource')(sequelize, Sequelize);
db.EnvironmentCost = require('./EnvironmentCost')(sequelize, Sequelize);

// Import DPDP-related models
db.Consent = require('./Consent')(sequelize, Sequelize);
db.DataProcessingRecord = require('./DataProcessingRecord')(sequelize, Sequelize);
db.Grievance = require('./Grievance')(sequelize, Sequelize);
db.DataBreach = require('./DataBreach')(sequelize, Sequelize);
db.AuditLog = require('./AuditLog')(sequelize, Sequelize);

// Import CCRP Azure credentials model
db.CCRPAzureCredentials = require('./CCRPAzureCredentials')(sequelize, Sequelize);

// Define associations
db.User.hasMany(db.Dataset, { foreignKey: 'ownerId', as: 'datasets' });
db.Dataset.belongsTo(db.User, { foreignKey: 'ownerId', as: 'owner' });

db.User.hasMany(db.Contract, { foreignKey: 'tdpId', as: 'tdpContracts' });
db.User.hasMany(db.Contract, { foreignKey: 'tdcId', as: 'tdcContracts' });
db.User.hasMany(db.Contract, { foreignKey: 'ccrpId', as: 'ccrpContracts' });

db.Contract.belongsTo(db.User, { foreignKey: 'tdpId', as: 'tdp' });
db.Contract.belongsTo(db.User, { foreignKey: 'tdcId', as: 'tdc' });
db.Contract.belongsTo(db.User, { foreignKey: 'ccrpId', as: 'ccrp' });

// CCRP Azure credentials associations
db.User.hasOne(db.CCRPAzureCredentials, { foreignKey: 'ccrpUserId', as: 'azureCredentials' });
db.CCRPAzureCredentials.belongsTo(db.User, { foreignKey: 'ccrpUserId', as: 'ccrp' });

// Contract template associations
db.User.hasMany(db.ContractTemplate, { foreignKey: 'createdBy', as: 'createdTemplates' });
db.ContractTemplate.belongsTo(db.User, { foreignKey: 'createdBy', as: 'creator' });

db.ContractTemplate.hasMany(db.Contract, { foreignKey: 'templateId', sourceKey: 'templateId', as: 'contracts' });
db.Contract.belongsTo(db.ContractTemplate, { foreignKey: 'templateId', targetKey: 'templateId', as: 'template' });

db.Contract.belongsTo(db.Dataset, { foreignKey: 'datasetId', as: 'dataset' });
db.Dataset.hasMany(db.Contract, { foreignKey: 'datasetId', as: 'contracts' });

// AI Model associations (removed - AI models are independent of contracts)
// db.AIModel.hasMany(db.Contract, { foreignKey: 'modelId', sourceKey: 'modelId', as: 'contracts' });
// db.Contract.belongsTo(db.AIModel, { foreignKey: 'modelId', targetKey: 'modelId', as: 'aiModel' });

db.User.hasMany(db.Notification, { foreignKey: 'userId', as: 'notifications' });
db.Notification.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// DPDP-related associations
db.User.hasMany(db.Consent, { foreignKey: 'userId', as: 'consents' });
db.Consent.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.DataProcessingRecord, { foreignKey: 'userId', as: 'dataProcessingRecords' });
db.DataProcessingRecord.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.Grievance, { foreignKey: 'userId', as: 'grievances' });
db.Grievance.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.Grievance, { foreignKey: 'assignedTo', as: 'assignedGrievances' });
db.Grievance.belongsTo(db.User, { foreignKey: 'assignedTo', as: 'assignedUser' });

db.User.hasMany(db.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
db.AuditLog.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.Consent.hasMany(db.DataProcessingRecord, { foreignKey: 'consentId', as: 'dataProcessingRecords' });
db.DataProcessingRecord.belongsTo(db.Consent, { foreignKey: 'consentId', as: 'consent' });

// Training environment associations
db.Contract.hasMany(db.TrainingEnvironment, { foreignKey: 'contractId', sourceKey: 'contractId', as: 'trainingEnvironments' });
db.TrainingEnvironment.belongsTo(db.Contract, { foreignKey: 'contractId', targetKey: 'contractId', as: 'contract' });

// Training job associations
db.Contract.hasMany(db.TrainingJob, { foreignKey: 'contractId', sourceKey: 'contractId', as: 'trainingJobs' });
db.TrainingJob.belongsTo(db.Contract, { foreignKey: 'contractId', targetKey: 'contractId', as: 'contract' });

db.User.hasMany(db.TrainingJob, { foreignKey: 'createdBy', as: 'createdTrainingJobs' });
db.TrainingJob.belongsTo(db.User, { foreignKey: 'createdBy', as: 'creator' });

db.TrainingEnvironment.hasMany(db.EnvironmentResource, { foreignKey: 'environmentId', sourceKey: 'environmentId', as: 'resources' });
db.EnvironmentResource.belongsTo(db.TrainingEnvironment, { foreignKey: 'environmentId', targetKey: 'environmentId', as: 'environment' });

db.TrainingEnvironment.hasMany(db.EnvironmentCost, { foreignKey: 'environmentId', sourceKey: 'environmentId', as: 'costs' });
db.EnvironmentCost.belongsTo(db.TrainingEnvironment, { foreignKey: 'environmentId', targetKey: 'environmentId', as: 'environment' });

db.User.hasMany(db.TrainingEnvironment, { foreignKey: 'createdBy', as: 'createdEnvironments' });
db.TrainingEnvironment.belongsTo(db.User, { foreignKey: 'createdBy', as: 'creator' });

db.User.hasMany(db.TrainingEnvironment, { foreignKey: 'updatedBy', as: 'updatedEnvironments' });
db.TrainingEnvironment.belongsTo(db.User, { foreignKey: 'updatedBy', as: 'updater' });

module.exports = db; 