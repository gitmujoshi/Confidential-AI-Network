/**
 * User Model
 * 
 * This model represents users in the Contract Management System with role-based access control.
 * Users can be one of three types: TDP, TDC, or CCRP, each with different permissions.
 * 
 * User Types:
 * - TDP (Training Data Provider): Dataset owners who can create and manage datasets
 * - TDC (Training Data Consumer): Contract initiators who can create contracts
 * - CCRP (Confidential Clean Room Provider): Compliance reviewers who sign contracts
 * 
 * Security Features:
 * - Wallet address validation (Ethereum address format)
 * - Email validation and uniqueness
 * - Public key storage for cryptographic operations
 * - Role-based access control
 * 
 * Relationships:
 * - Has many datasets (as owner)
 * - Has many contracts (as TDP, TDC, or CCRP)
 * - Has many notifications
 */
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // Primary key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Ethereum wallet address (unique identifier)
    walletAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^0x[a-fA-F0-9]{40}$/  // Ethereum address format validation
      }
    },
    
    // Public key for cryptographic operations (hex format)
    publicKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Public key for cryptographic operations (hex format)'
    },
    
    // User role in the system (TDP, TDC, or CCRP)
    partyType: {
      type: DataTypes.ENUM('TDP', 'TDC', 'CCRP'),
      allowNull: false
    },
    
    // Human-readable name
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    
    // Email address (unique)
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    
    // Optional description of the user/company
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Registration status flag
    isRegistered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Date when user was registered
    registrationDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    // Active status flag (for soft deletes)
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    // IAM Integration fields
    iamUserId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Keycloak user ID for IAM integration'
    },
    
    iamUsername: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Keycloak username (usually email)'
    },
    
    // DID (Decentralized Identifier) support
    did: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Decentralized Identifier for blockchain identity'
    },
    
    // Onboarding status
    onboardingStatus: {
      type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'),
      defaultValue: 'PENDING',
      comment: 'User onboarding status'
    },
    
    // Profile completion
    profileCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether user has completed profile setup'
    },
    
    // Email verification status
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Email verification status from IAM'
    },
    
    // Last login timestamp
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last login timestamp'
    },
    
    // Additional profile fields
    organization: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User organization/company'
    },
    
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User phone number'
    },
    
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User website URL'
    },
    
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User location/country'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    
    // Database indexes for performance optimization
    indexes: [
      {
        unique: true,
        fields: ['walletAddress']  // Fast wallet address lookups
      },
      {
        unique: true,
        fields: ['iamUserId']      // Fast IAM user lookups
      },
      {
        unique: true,
        fields: ['did']            // Fast DID lookups
      },
      {
        fields: ['partyType']      // Fast role-based queries
      },
      {
        fields: ['email']          // Fast email lookups
      },
      {
        fields: ['publicKey']      // Fast public key lookups
      },
      {
        fields: ['onboardingStatus'] // Fast onboarding status queries
      },
      {
        fields: ['profileCompleted'] // Fast profile completion queries
      },
      {
        fields: ['lastLoginAt']    // Fast login history queries
      }
    ]
  });

  /**
   * Define associations with other models
   * @param {Object} models - All Sequelize models
   */
  User.associate = (models) => {
    // User can own multiple datasets (TDP only)
    User.hasMany(models.Dataset, { foreignKey: 'ownerId', as: 'datasets' });
    
    // User can be involved in contracts as different parties
    User.hasMany(models.Contract, { foreignKey: 'tdpId', as: 'tdpContracts' });
    User.hasMany(models.Contract, { foreignKey: 'tdcId', as: 'tdcContracts' });
    User.hasMany(models.Contract, { foreignKey: 'ccrpId', as: 'ccrpContracts' });
    
    // User can receive multiple notifications
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
  };

  return User;
}; 