const { test, expect } = require('@playwright/test');

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/');
  });

  test('should display login form on initial load', async ({ page }) => {
    // Check if login form is visible
    await expect(page.getByRole('heading', { name: /contract management/i })).toBeVisible();
    await expect(page.getByText(/sign in to your account/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    // Try to login with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Login with valid credentials (using E2E test user)
    await page.getByLabel(/email/i).fill('tdc-test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test('should show registration form when clicking register', async ({ page }) => {
    // Click on register link
    await page.getByRole('link', { name: /register/i }).click();

    // Should show registration form
    await expect(page.getByRole('heading', { name: /register/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByLabel(/party type/i)).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }) => {
    // Navigate to registration
    await page.getByRole('link', { name: /register/i }).click();

    // Fill registration form
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('newuser@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByLabel(/party type/i).selectOption('TDC');

    // Submit registration
    await page.getByRole('button', { name: /register/i }).click();

    // Should show success message or redirect
    await expect(page.getByText(/success/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.getByLabel(/email/i).fill('tdc-test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);

    // Click logout
    await page.getByRole('button', { name: /logout/i }).click();

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /contract management/i })).toBeVisible();
  });

  test('should handle forgot password flow', async ({ page }) => {
    // Click forgot password link
    await page.getByRole('link', { name: /forgot password/i }).click();

    // Should show forgot password form
    await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();

    // Fill email and submit
    await page.getByLabel(/email/i).fill('tdc-test@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();

    // Should show success message
    await expect(page.getByText(/reset link sent/i)).toBeVisible();
  });

  test('should login as TDC and load correct dashboard (regression)', async ({ page }) => {
    // Clear browser storage to ensure fresh login
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      console.log('🧹 Browser storage cleared for fresh login');
    });
    
    // Login as TDC user (using E2E test user)
    await page.getByLabel(/email/i).fill('tdc-test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Wait for dashboard to load and check for errors
    await page.waitForTimeout(3000);
    
    // Debug: Log the page content to see what's happening
    const pageContent = await page.locator('body').textContent();
    console.log('🔍 Page content after login:', pageContent);
    
    // Check if there's an error loading the dashboard
    if (pageContent.includes('Error loading TDC dashboard')) {
      throw new Error('Dashboard failed to load: ' + pageContent);
    }

    // Should show correct user info
    await expect(page.getByText(/tdc-test@example.com/i)).toBeVisible();
    await expect(page.getByText(/TDC/i)).toBeVisible();
    // Should not show old user data
    await expect(page.locator('body')).not.toContainText('uitdc@example.com');
    await expect(page.locator('body')).not.toContainText('tdc1-416d70a2@example.com');
  });
}); 