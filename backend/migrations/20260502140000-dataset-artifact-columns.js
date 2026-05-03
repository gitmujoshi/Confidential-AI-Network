'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('datasets', 'storage_backend', {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'none',
      comment: 'none | local (Phase A); future: s3, azure_blob, gcs',
    });
    await queryInterface.addColumn('datasets', 'artifact_file_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('datasets', 'artifact_total_bytes', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('datasets', 'content_format', {
      type: Sequelize.STRING(64),
      allowNull: true,
      comment: 'csv | parquet | image_folder — hints local trainer',
    });
    await queryInterface.addColumn('datasets', 'artifacts_updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('datasets', 'artifacts_updated_at');
    await queryInterface.removeColumn('datasets', 'content_format');
    await queryInterface.removeColumn('datasets', 'artifact_total_bytes');
    await queryInterface.removeColumn('datasets', 'artifact_file_count');
    await queryInterface.removeColumn('datasets', 'storage_backend');
  },
};
