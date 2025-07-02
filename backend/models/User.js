module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    walletAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^0x[a-fA-F0-9]{40}$/
      }
    },
    publicKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Public key for cryptographic operations (hex format)'
    },
    partyType: {
      type: DataTypes.ENUM('TDP', 'TDC', 'CCRP'),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isRegistered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    registrationDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['walletAddress']
      },
      {
        fields: ['partyType']
      },
      {
        fields: ['email']
      },
      {
        fields: ['publicKey']
      }
    ]
  });

  User.associate = (models) => {
    User.hasMany(models.Dataset, { foreignKey: 'ownerId', as: 'datasets' });
    User.hasMany(models.Contract, { foreignKey: 'tdpId', as: 'tdpContracts' });
    User.hasMany(models.Contract, { foreignKey: 'tdcId', as: 'tdcContracts' });
    User.hasMany(models.Contract, { foreignKey: 'ccrpId', as: 'ccrpContracts' });
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
  };

  return User;
}; 