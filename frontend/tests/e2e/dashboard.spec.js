const { test, expect } = require('@playwright/test');

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display dashboard with user information', async ({ page }) => {
    // Should show user information
    await expect(page.getByText(/welcome/i)).toBeVisible();
    await expect(page.getByText(/test@example.com/i)).toBeVisible();
    
    // Should show navigation menu
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('link', { name: /contracts/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /datasets/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
  });

  test('should display contract statistics', async ({ page }) => {
    // Should show contract statistics
    await expect(page.getByText(/total contracts/i)).toBeVisible();
    await expect(page.getByText(/active contracts/i)).toBeVisible();
    await expect(page.getByText(/pending contracts/i)).toBeVisible();
  });

  test('should display recent contracts', async ({ page }) => {
    // Should show recent contracts section
    await expect(page.getByText(/recent contracts/i)).toBeVisible();
    
    // Should show contract cards
    await expect(page.getByRole('link', { name: /test contract/i })).toBeVisible();
  });

  test('should navigate to different sections', async ({ page }) => {
    // Navigate to contracts
    await page.getByRole('link', { name: /contracts/i }).click();
    await expect(page).toHaveURL(/.*contracts/);
    
    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Navigate to datasets
    await page.getByRole('link', { name: /datasets/i }).click();
    await expect(page).toHaveURL(/.*datasets/);
  });

  test('should display notifications', async ({ page }) => {
    // Should show notifications section
    await expect(page.getByText(/notifications/i)).toBeVisible();
    
    // Should show notification items
    await expect(page.getByText(/new contract created/i)).toBeVisible();
  });

  test('should handle user profile', async ({ page }) => {
    // Click on user profile
    await page.getByRole('button', { name: /profile/i }).click();
    
    // Should show profile menu
    await expect(page.getByText(/profile/i)).toBeVisible();
    await expect(page.getByText(/settings/i)).toBeVisible();
    await expect(page.getByText(/logout/i)).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should show mobile menu
    await page.getByRole('button', { name: /menu/i }).click();
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should display charts and analytics', async ({ page }) => {
    // Should show analytics charts
    await expect(page.getByText(/contract analytics/i)).toBeVisible();
    await expect(page.getByText(/revenue chart/i)).toBeVisible();
  });

  test('should handle quick actions', async ({ page }) => {
    // Should show quick action buttons
    await expect(page.getByRole('button', { name: /create contract/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /upload dataset/i })).toBeVisible();
    
    // Click create contract quick action
    await page.getByRole('button', { name: /create contract/i }).click();
    await expect(page).toHaveURL(/.*create.*contract/);
  });

  test('should handle search functionality', async ({ page }) => {
    // Should show search bar
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    
    // Search for contracts
    await page.getByPlaceholder(/search/i).fill('test');
    await page.keyboard.press('Enter');
    
    // Should show search results
    await expect(page.getByText(/search results/i)).toBeVisible();
  });

  test('should handle theme switching', async ({ page }) => {
    // Click theme toggle
    await page.getByRole('button', { name: /theme/i }).click();
    
    // Should switch theme (check for dark mode class or similar)
    await expect(page.locator('body')).toHaveClass(/dark/i);
  });
}); 