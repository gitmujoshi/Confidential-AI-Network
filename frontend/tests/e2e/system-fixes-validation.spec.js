const { test, expect } = require('@playwright/test');

test.describe('System Fixes Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/');
    await page.getByLabel(/email/i).fill('admin@contractmanagement.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should load admin dashboard without 500 errors', async ({ page }) => {
    // Check if dashboard loads successfully
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check for key metrics cards
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-contracts"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-datasets"]')).toBeVisible();
    
    // Check for recent users section
    await expect(page.locator('[data-testid="recent-users"]')).toBeVisible();
    
    // Verify no error messages are displayed
    await expect(page.locator('text=500')).not.toBeVisible();
    await expect(page.locator('text=Internal Server Error')).not.toBeVisible();
  });

  test('should load datasets page and view details work', async ({ page }) => {
    // Navigate to datasets page
    await page.click('text=Datasets');
    await expect(page).toHaveURL(/.*datasets/);
    
    // Check if datasets are displayed
    await expect(page.locator('h1')).toContainText('Datasets');
    
    // Wait for datasets to load
    await page.waitForSelector('[data-testid="dataset-card"]', { timeout: 10000 });
    
    // Check if View Details button is clickable
    const viewDetailsButton = page.locator('[data-testid="dataset-card"]').first().locator('text=View Details');
    await expect(viewDetailsButton).toBeVisible();
    
    // Click View Details and verify navigation
    await viewDetailsButton.click();
    
    // Should navigate to dataset detail page
    await expect(page).toHaveURL(/.*datasets\/.*/);
  });

  test('should support both card and table view modes for datasets', async ({ page }) => {
    // Navigate to datasets page
    await page.click('text=Datasets');
    await expect(page).toHaveURL(/.*datasets/);
    
    // Check if view mode toggle is present
    await expect(page.locator('[aria-label="view mode"]')).toBeVisible();
    
    // Test grid view (default)
    await expect(page.locator('[aria-label="grid view"]')).toBeVisible();
    await expect(page.locator('[data-testid="dataset-card"]')).toHaveCount({ min: 1 });
    
    // Switch to table view
    await page.click('[aria-label="table view"]');
    
    // Check if table view is displayed
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th')).toContainText('Name');
    await expect(page.locator('th')).toContainText('Category');
    await expect(page.locator('th')).toContainText('Price');
    
    // Switch back to grid view
    await page.click('[aria-label="grid view"]');
    
    // Check if grid view is displayed again
    await expect(page.locator('[data-testid="dataset-card"]')).toHaveCount({ min: 1 });
  });

  test('should load contracts page without 500 errors', async ({ page }) => {
    // Navigate to contracts page
    await page.click('text=Contracts');
    await expect(page).toHaveURL(/.*contracts/);
    
    // Check if contracts page loads
    await expect(page.locator('h1')).toContainText('Contracts');
    
    // Wait for contracts to load
    await page.waitForSelector('[data-testid="contract-card"]', { timeout: 10000 });
    
    // Verify no error messages are displayed
    await expect(page.locator('text=500')).not.toBeVisible();
    await expect(page.locator('text=Internal Server Error')).not.toBeVisible();
    
    // Check if contracts are displayed
    const contractCards = page.locator('[data-testid="contract-card"]');
    await expect(contractCards).toHaveCount({ min: 1 });
  });

  test('should load users page without 500 errors', async ({ page }) => {
    // Navigate to users page
    await page.click('text=Users');
    await expect(page).toHaveURL(/.*admin\/users/);
    
    // Check if users page loads
    await expect(page.locator('h1')).toContainText('Users');
    
    // Wait for users to load
    await page.waitForSelector('[data-testid="user-card"]', { timeout: 10000 });
    
    // Verify no error messages are displayed
    await expect(page.locator('text=500')).not.toBeVisible();
    await expect(page.locator('text=Internal Server Error')).not.toBeVisible();
    
    // Check if users are displayed
    const userCards = page.locator('[data-testid="user-card"]');
    await expect(userCards).toHaveCount({ min: 1 });
  });

  test('should display CCRP menu only for CCRP users', async ({ page }) => {
    // As admin, CCRP-specific menu items should NOT be visible
    await expect(page.locator('text=Environments')).not.toBeVisible();
    await expect(page.locator('text=Infrastructure')).not.toBeVisible();
    await expect(page.locator('text=Cloud Credentials')).not.toBeVisible();
    
    // But Users menu should be visible for admin
    await expect(page.locator('text=Users')).toBeVisible();
  });

  test('should validate DEPA ID format for datasets', async ({ page }) => {
    // Navigate to datasets page
    await page.click('text=Datasets');
    await expect(page).toHaveURL(/.*datasets/);
    
    // Wait for datasets to load
    await page.waitForSelector('[data-testid="dataset-card"]', { timeout: 10000 });
    
    // Check if dataset cards show DEPA IDs in correct format
    const datasetCards = page.locator('[data-testid="dataset-card"]');
    const firstCard = datasetCards.first();
    
    // Look for DEPA ID in the format DATASET-<GUID>
    const depaIdElement = firstCard.locator('text=/DATASET-[a-f0-9-]+/i');
    await expect(depaIdElement).toBeVisible();
  });

  test('should handle first login flag correctly', async ({ page }) => {
    // Admin user should not be redirected to password change wizard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Should not see first login wizard
    await expect(page.locator('text=Change Password')).not.toBeVisible();
    await expect(page.locator('text=First Login')).not.toBeVisible();
  });

  test('should display proper navigation menu for admin', async ({ page }) => {
    // Check that admin sees the correct menu items
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Datasets')).toBeVisible();
    await expect(page.locator('text=Contracts')).toBeVisible();
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=Enterprise DID')).toBeVisible();
    
    // CCRP-specific items should not be visible for admin
    await expect(page.locator('text=Environments')).not.toBeVisible();
    await expect(page.locator('text=Infrastructure')).not.toBeVisible();
    await expect(page.locator('text=Cloud Credentials')).not.toBeVisible();
  });

  test('should validate all API endpoints are working', async ({ page }) => {
    // Test that all admin API endpoints return data without errors
    const response = await page.request.get('http://localhost:5001/api/admin/users');
    expect(response.status()).toBe(200);
    
    const contractsResponse = await page.request.get('http://localhost:5001/api/admin/contracts');
    expect(contractsResponse.status()).toBe(200);
    
    const datasetsResponse = await page.request.get('http://localhost:5001/api/admin/datasets');
    expect(datasetsResponse.status()).toBe(200);
    
    const breachesResponse = await page.request.get('http://localhost:5001/api/admin/data-breaches');
    expect(breachesResponse.status()).toBe(200);
    
    const complianceResponse = await page.request.get('http://localhost:5001/api/admin/compliance');
    expect(complianceResponse.status()).toBe(200);
  });

  test('should validate dataset view details navigation', async ({ page }) => {
    // Navigate to datasets page
    await page.click('text=Datasets');
    await expect(page).toHaveURL(/.*datasets/);
    
    // Wait for datasets to load
    await page.waitForSelector('[data-testid="dataset-card"]', { timeout: 10000 });
    
    // Get the first dataset card
    const firstDatasetCard = page.locator('[data-testid="dataset-card"]').first();
    
    // Click View Details button
    const viewDetailsButton = firstDatasetCard.locator('text=View Details');
    await viewDetailsButton.click();
    
    // Should navigate to dataset detail page
    await expect(page).toHaveURL(/.*datasets\/.*/);
    
    // Check if dataset details are displayed
    await expect(page.locator('h1')).toContainText('Dataset Details');
    
    // Check for key dataset information
    await expect(page.locator('text=Description')).toBeVisible();
    await expect(page.locator('text=Dataset Information')).toBeVisible();
    await expect(page.locator('text=Owner Information')).toBeVisible();
  });
});
