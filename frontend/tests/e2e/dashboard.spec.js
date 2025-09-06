import { test, expect } from '@playwright/test';

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('http://localhost:3000/dashboard');
  });

  test('should display TDC dashboard correctly', async ({ page }) => {
    // Check if dashboard loads
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check for contract summary
    await expect(page.locator('[data-testid="contract-summary"]')).toBeVisible();
    
    // Check for dataset access
    await expect(page.locator('[data-testid="dataset-access"]')).toBeVisible();
  });

  test('should display TDP dashboard correctly', async ({ page }) => {
    // Navigate to TDP dashboard
    await page.goto('http://localhost:3000/dashboard/tdp');
    
    // Check if TDP dashboard loads
    await expect(page.locator('h1')).toContainText('TDP Dashboard');
    
    // Check for dataset management
    await expect(page.locator('[data-testid="dataset-management"]')).toBeVisible();
    
    // Check for contract requests
    await expect(page.locator('[data-testid="contract-requests"]')).toBeVisible();
  });

  test('should display CCRP dashboard correctly', async ({ page }) => {
    // Navigate to CCRP dashboard
    await page.goto('http://localhost:3000/dashboard/ccrp');
    
    // Check if CCRP dashboard loads
    await expect(page.locator('h1')).toContainText('CCRP Dashboard');
    
    // Check for environment management
    await expect(page.locator('[data-testid="environment-management"]')).toBeVisible();
    
    // Check for contract execution
    await expect(page.locator('[data-testid="contract-execution"]')).toBeVisible();
  });

  test('should display Admin dashboard correctly', async ({ page }) => {
    // Navigate to Admin dashboard
    await page.goto('http://localhost:3000/dashboard/admin');
    
    // Check if Admin dashboard loads
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    
    // Check for user management
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
    
    // Check for system monitoring
    await expect(page.locator('[data-testid="system-monitoring"]')).toBeVisible();
  });

  test('should display SCITT CCF dashboard correctly', async ({ page }) => {
    // Navigate to SCITT CCF dashboard
    await page.goto('http://localhost:3000/dashboard/admin/scitt-ccf');
    
    // Check if SCITT CCF dashboard loads
    await expect(page.locator('h1')).toContainText('SCITT CCF Dashboard');
    
    // Check for SCITT CCF health status
    await expect(page.locator('[data-testid="scitt-ccf-health"]')).toBeVisible();
    
    // Check for contract claims
    await expect(page.locator('[data-testid="contract-claims"]')).toBeVisible();
    
    // Check for provenance tracking
    await expect(page.locator('[data-testid="provenance-tracking"]')).toBeVisible();
    
    // Check for TEE attestation
    await expect(page.locator('[data-testid="tee-attestation"]')).toBeVisible();
  });

  test('should display SCITT CCF metrics correctly', async ({ page }) => {
    // Navigate to SCITT CCF dashboard
    await page.goto('http://localhost:3000/dashboard/admin/scitt-ccf');
    
    // Check for performance metrics
    await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
    
    // Check for claim statistics
    await expect(page.locator('[data-testid="claim-statistics"]')).toBeVisible();
    
    // Check for system health
    await expect(page.locator('[data-testid="system-health"]')).toBeVisible();
  });

  test('should handle SCITT CCF configuration changes', async ({ page }) => {
    // Navigate to SCITT CCF dashboard
    await page.goto('http://localhost:3000/dashboard/admin/scitt-ccf');
    
    // Check for configuration section
    await expect(page.locator('[data-testid="configuration-section"]')).toBeVisible();
    
    // Check for migration mode selector
    await expect(page.locator('[data-testid="migration-mode-selector"]')).toBeVisible();
    
    // Check for TEE provider configuration
    await expect(page.locator('[data-testid="tee-provider-config"]')).toBeVisible();
  });
}); 