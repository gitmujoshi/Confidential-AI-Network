const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../config.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || undefined, // Use undefined for trust authentication
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
    },
    dialectOptions: {
      // Force IPv4 connection
      family: 4
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

// Import SCITT CCF models
db.ScittClaim = require('./ScittClaim')(sequelize, Sequelize);
db.SystemHealthLog = require('./SystemHealthLog')(sequelize, Sequelize);

// Import provenance models
const MerkleTree = require('./MerkleTree')(sequelize);
const ProvenanceNode = require('./ProvenanceNode')(sequelize);
const ProvenanceCapture = require('./ProvenanceCapture')(sequelize);
const ProvenanceVerification = require('./ProvenanceVerification')(sequelize);

// Import ContractDataset junction model
const ContractDataset = require('./ContractDataset')(sequelize, Sequelize);

// Add provenance models to the models object
db.MerkleTree = MerkleTree;
db.ProvenanceNode = ProvenanceNode;
db.ProvenanceCapture = ProvenanceCapture;
db.ProvenanceVerification = ProvenanceVerification;

// Add ContractDataset model to the models object
db.ContractDataset = ContractDataset;

// Define associations
// Note: Most associations are defined in the individual model files to avoid conflicts
// Only keep associations that are not defined elsewhere and are truly cross-cutting

// CCRP Azure credentials associations (not defined in User model)
db.User.hasOne(db.CCRPAzureCredentials, { foreignKey: 'ccrpUserId', as: 'azureCredentials' });
db.CCRPAzureCredentials.belongsTo(db.User, { foreignKey: 'ccrpUserId', as: 'ccrp' });

// Contract template associations (not defined in ContractTemplate model)
db.User.hasMany(db.ContractTemplate, { foreignKey: 'createdBy', as: 'createdTemplates' });

// DPDP-related associations (not defined in individual models)
// Note: These associations are already defined in DataProcessingRecord model
// db.Consent.hasMany(db.DataProcessingRecord, { foreignKey: 'consentId', as: 'dataProcessingRecords' });
// db.DataProcessingRecord.belongsTo(db.Consent, { foreignKey: 'consentId', as: 'consent' });

// Training environment associations (not defined in individual models)
// Note: These associations are already defined in EnvironmentResource and EnvironmentCost models
// db.TrainingEnvironment.hasMany(db.EnvironmentResource, { foreignKey: 'environmentId', sourceKey: 'environmentId', as: 'resources' });
// db.EnvironmentResource.belongsTo(db.TrainingEnvironment, { foreignKey: 'environmentId', targetKey: 'environmentId', as: 'environment' });

// db.TrainingEnvironment.hasMany(db.EnvironmentCost, { foreignKey: 'environmentId', sourceKey: 'environmentId', as: 'costs' });
// db.EnvironmentCost.belongsTo(db.TrainingEnvironment, { foreignKey: 'environmentId', targetKey: 'environmentId', as: 'environment' });

// Call associate function for provenance models
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db; 