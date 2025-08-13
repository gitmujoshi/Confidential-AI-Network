/**
 * Fix User Table Schema Migration
 * 
 * This migration fixes the User table to match the Sequelize model definition
 * by adding missing columns and ensuring proper naming conventions.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🔧 Fixing User table schema...');

      // Add missing columns if they don't exist
      const tableInfo = await queryInterface.describeTable('users');
      
      // Add publicKey column if it doesn't exist
      if (!tableInfo.publicKey && !tableInfo.public_key) {
        await queryInterface.addColumn('users', 'publicKey', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Public key for cryptographic operations (hex format, optional for enterprise users)'
        });
        console.log('✅ Added publicKey column');
      }

      // Add iamUsername column if it doesn't exist
      if (!tableInfo.iamUsername && !tableInfo.iam_username) {
        await queryInterface.addColumn('users', 'iamUsername', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Keycloak IAM username for authentication'
        });
        console.log('✅ Added iamUsername column');
      }

      // Add isActive column if it doesn't exist
      if (!tableInfo.isActive && !tableInfo.is_active) {
        await queryInterface.addColumn('users', 'isActive', {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          comment: 'Whether the user account is active'
        });
        console.log('✅ Added isActive column');
      }

      // Add lastLoginAt column if it doesn't exist
      if (!tableInfo.lastLoginAt && !tableInfo.last_login_at) {
        await queryInterface.addColumn('users', 'lastLoginAt', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp of last login'
        });
        console.log('✅ Added lastLoginAt column');
      }

      // Add emailVerified column if it doesn't exist
      if (!tableInfo.emailVerified && !tableInfo.email_verified) {
        await queryInterface.addColumn('users', 'emailVerified', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether the email has been verified'
        });
        console.log('✅ Added emailVerified column');
      }

      // Add did column if it doesn't exist
      if (!tableInfo.did) {
        await queryInterface.addColumn('users', 'did', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Decentralized Identifier (DID)'
        });
        console.log('✅ Added did column');
      }

      // Add organization column if it doesn't exist
      if (!tableInfo.organization) {
        await queryInterface.addColumn('users', 'organization', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'User organization or company'
        });
        console.log('✅ Added organization column');
      }

      console.log('🎉 User table schema fixed successfully!');
      
    } catch (error) {
      console.error('❌ Error fixing User table schema:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Rolling back User table schema changes...');
      
      // Remove added columns
      const columnsToRemove = [
        'publicKey',
        'iamUsername', 
        'isActive',
        'lastLoginAt',
        'emailVerified',
        'did',
        'organization'
      ];

      for (const column of columnsToRemove) {
        try {
          await queryInterface.removeColumn('users', column);
          console.log(`✅ Removed ${column} column`);
        } catch (err) {
          console.log(`⚠️ Column ${column} doesn't exist or can't be removed`);
        }
      }

      console.log('🔄 User table schema rollback completed');
      
    } catch (error) {
      console.error('❌ Error rolling back User table schema:', error);
      throw error;
    }
  }
};
