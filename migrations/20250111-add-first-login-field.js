// Migration file - DataTypes will be available from Sequelize parameter

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add firstLogin column to users table
    await queryInterface.addColumn('users', 'first_login', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this is the user\'s first login (requires password change)'
    });

    console.log('✅ Added first_login column to users table');
  },

  async down(queryInterface, Sequelize) {
    // Remove firstLogin column from users table
    await queryInterface.removeColumn('users', 'first_login');
    
    console.log('✅ Removed first_login column from users table');
  }
};
