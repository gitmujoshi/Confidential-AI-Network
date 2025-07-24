/**
 * Migration: Add Terraform Fields to Training Environments
 * 
 * Adds provisioning method and Terraform state fields to support
 * Infrastructure as Code capabilities
 */

const db = require('../../models');

async function addTerraformFields() {
  try {
    console.log('🏗️ Adding Terraform fields to training_environments table...');

    // Add provisioning method column
    await db.sequelize.query(`
      ALTER TABLE training_environments 
      ADD COLUMN provisioning_method ENUM('SDK', 'TERRAFORM') DEFAULT 'SDK' 
      COMMENT 'Infrastructure provisioning method'
    `);

    console.log('✅ Added provisioning_method column');

    // Add Terraform state column
    await db.sequelize.query(`
      ALTER TABLE training_environments 
      ADD COLUMN terraform_state JSON 
      COMMENT 'Terraform state and outputs for Infrastructure as Code'
    `);

    console.log('✅ Added terraform_state column');

    // Update existing records to use SDK method
    await db.sequelize.query(`
      UPDATE training_environments 
      SET provisioning_method = 'SDK' 
      WHERE provisioning_method IS NULL
    `);

    console.log('✅ Updated existing records to use SDK method');

    console.log('🎉 Terraform fields migration completed successfully!');

  } catch (error) {
    console.error('❌ Error adding Terraform fields:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addTerraformFields()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addTerraformFields; 