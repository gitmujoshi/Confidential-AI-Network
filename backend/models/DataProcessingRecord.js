module.exports = (sequelize, DataTypes) => {
  const DataProcessingRecord = sequelize.define('DataProcessingRecord', {
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
      allowNull: false
    },
    purpose: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dataTypes: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'JSON string of data types processed'
    },
    legalBasis: {
      type: DataTypes.STRING,
      allowNull: false
    },
    consentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Consents',
        key: 'id'
      }
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    retentionPeriod: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Retention period in days'
    },
    processingDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional processing details'
    }
  }, {
    tableName: 'DataProcessingRecords',
    timestamps: true
  });

  DataProcessingRecord.associate = (models) => {
    DataProcessingRecord.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    DataProcessingRecord.belongsTo(models.Consent, { foreignKey: 'consentId', as: 'consent' });
  };

  return DataProcessingRecord;
}; 