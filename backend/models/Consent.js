module.exports = (sequelize, DataTypes) => {
  const Consent = sequelize.define('Consent', {
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
      allowNull: false
    },
    dataTypes: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'JSON string of data types being processed'
    },
    consentType: {
      type: DataTypes.ENUM('EXPLICIT', 'IMPLICIT'),
      allowNull: false,
      defaultValue: 'EXPLICIT'
    },
    consentText: {
      type: DataTypes.TEXT,
      allowNull: false
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
      allowNull: true
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
    tableName: 'Consents',
    timestamps: true
  });

  Consent.associate = (models) => {
    Consent.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Consent;
}; 