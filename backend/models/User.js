/**
 * User Model
 * 
 * This model represents users in the Contract Management System with role-based access control.
 * Users can be one of three types: TDP, TDC, or CCRP, each with different permissions.
 * 
 * User Types:
 * - TDP (Training Data Provider): Dataset owners who can create and manage datasets
 * - TDC (Training Data Consumer): Contract initiators who can create contracts
 * - CCRP (Confidential Clean Room Provider): Runtime environment providers who set up secure environments for data analytics or AI model training based on contracts
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
module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('User', {
    // Primary key
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Ethereum wallet address (unique identifier)
    walletAddress: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        is: function(value) {
          if (value && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
            throw new Error('Invalid Ethereum address format');
          }
        }
      },
      comment: 'Ethereum wallet address (optional for enterprise users)'
    },
    
    // Public key for cryptographic operations (hex format)
    publicKey: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true,
      comment: 'Public key for cryptographic operations (hex format, optional for enterprise users)'
    },
    
    // User role in the system (TDP, TDC, CCRP, or AppAdmin)
    partyType: {
      type: Sequelize.DataTypes.ENUM('TDP', 'TDC', 'CCRP', 'AppAdmin'),
      allowNull: false
    },
    
    // Human-readable name
    name: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false
    },
    
    // Email address (unique)
    email: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    
    // Password for database authentication (hashed)
    password: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      comment: 'Hashed password for database authentication (fallback when Keycloak is not available)'
    },
    
    // Optional description of the user/company
    description: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    
    // Registration status flag
    isRegistered: {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Date when user was registered
    registrationDate: {
      type: Sequelize.DataTypes.DATE,
      defaultValue: Sequelize.DataTypes.NOW
    },
    
    // Active status flag (for soft deletes)
    isActive: {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    // IAM Integration fields
    iamUserId: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Keycloak user ID for IAM integration'
    },
    
    iamUsername: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      comment: 'Keycloak username (usually email)'
    },
    
    // DID (Decentralized Identifier) support
    did: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Decentralized Identifier for blockchain identity'
    },
    
    // DID source - whether it was created by system or brought by user
    didSource: {
      type: Sequelize.DataTypes.ENUM('SYSTEM_GENERATED', 'USER_PROVIDED'),
      allowNull: true,
      comment: 'Source of the DID - system generated or user provided'
    },
    
    // DID verification status
    didVerified: {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the user-provided DID has been verified'
    },
    
    // DID verification method (how it was verified)
    didVerificationMethod: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      comment: 'Method used to verify the DID (e.g., signature, credential)'
    },
    
    // Onboarding status
    onboardingStatus: {
      type: Sequelize.DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'),
      defaultValue: 'PENDING',
      comment: 'User onboarding status'
    },
    
    // Profile completion
    profileCompleted: {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether user has completed profile setup'
    },
    
    // Email verification status
    emailVerified: {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Email verification status from IAM'
    },
    
    // Email verification token (for fallback verification)
    emailVerificationToken: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      comment: 'Token for email verification when Keycloak is not available'
    },
    
    // Email verification token expiry
    emailVerificationExpires: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
      comment: 'Expiry date for email verification token'
    },
    
    // Last login timestamp
    lastLoginAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
      comment: 'Last login timestamp'
    },
    
    // Additional profile fields
    organization: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      comment: 'User organization/company'
    },
    
    phoneNumber: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      comment: 'User phone number'
    },
    
    website: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      comment: 'User website URL'
    },
    
    location: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      comment: 'User location/country'
    },
    
    // Password reset fields
    passwordResetToken: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      comment: 'Token for password reset functionality'
    },
    
    passwordResetExpires: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
      comment: 'Expiry date for password reset token'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    
    // Database indexes for performance optimization
    indexes: [
      {
        unique: true,
        fields: ['walletAddress'],
        where: {
          walletAddress: {
            [Sequelize.Op.ne]: null
          }
        }
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
        fields: ['publicKey'],
        where: {
          publicKey: {
            [Sequelize.Op.ne]: null
          }
        }
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