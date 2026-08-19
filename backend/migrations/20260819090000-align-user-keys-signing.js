'use strict';

/**
 * Align user_keys with UserKey model used for party signing at registration.
 * Older schema used is_active without private_key / key_status.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('user_keys').catch(() => null);
    if (!table) return;

    if (!table.private_key) {
      await queryInterface.addColumn('user_keys', 'private_key', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Private key PEM (encrypt at rest in production)',
      });
    }

    if (!table.key_status) {
      await queryInterface.addColumn('user_keys', 'key_status', {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'active',
        comment: 'active | inactive | revoked | expired',
      });
      if (table.is_active) {
        await queryInterface.sequelize.query(`
          UPDATE user_keys
          SET key_status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END
          WHERE key_status IS NULL OR key_status = 'active'
        `);
      }
    }

    if (!table.last_used_at) {
      await queryInterface.addColumn('user_keys', 'last_used_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!table.expires_at && !table.expiresAt) {
      // some DBs already have expires_at from complete-schema
      const cols = await queryInterface.describeTable('user_keys');
      if (!cols.expires_at) {
        await queryInterface.addColumn('user_keys', 'expires_at', {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }
    }

    if (!table.metadata) {
      await queryInterface.addColumn('user_keys', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true,
      });
    }

    if (!table.updated_at) {
      await queryInterface.addColumn('user_keys', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('user_keys').catch(() => null);
    if (!table) return;
    for (const col of ['private_key', 'key_status', 'last_used_at', 'metadata', 'updated_at']) {
      if (table[col]) {
        await queryInterface.removeColumn('user_keys', col);
      }
    }
  },
};
