import { test, expect } from '@playwright/test';

// These smoke tests verify the app loads and core UI elements render.
// They require both the backend (localhost:8081) and frontend (localhost:3001)
// to be running. In CI, these are started before the test suite.

test.describe('Weekly Commit Module - Smoke Tests', () => {

  test('app loads and shows weekly commit heading', async ({ page }) => {
    await page.goto('/');
    // The app should render the main page with a heading
    await expect(page.locator('body')).toBeVisible();
    // Wait for React to mount — look for the tab bar or heading
    await expect(page.getByText(/my week/i).or(page.getByText(/weekly commit/i))).toBeVisible({
      timeout: 10_000,
    });
  });

  test('week navigation arrows are visible in DRAFT state', async ({ page }) => {
    await page.goto('/');
    // The week navigation should show prev/next buttons
    const prevButton = page.getByRole('button', { name: /prev|←|‹/i });
    const nextButton = page.getByRole('button', { name: /next|→|›/i });
    await expect(prevButton.or(nextButton)).toBeVisible({ timeout: 10_000 });
  });

  test('new commit button is visible in DRAFT state', async ({ page }) => {
    await page.goto('/');
    const addButton = page.getByRole('button', { name: /new commit|add commit|\+/i });
    await expect(addButton).toBeVisible({ timeout: 10_000 });
  });

  test('clicking new commit opens the form modal', async ({ page }) => {
    await page.goto('/');
    const addButton = page.getByRole('button', { name: /new commit|add commit|\+/i });
    await addButton.click();
    // Modal should appear with title input
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByPlaceholder(/what will you commit/i)).toBeVisible();
  });

  test('theme toggle switches between light and dark mode', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /switch to (dark|light) mode/i });
    await expect(toggle).toBeVisible({ timeout: 10_000 });

    // Click toggle and verify the aria-label changes
    const initialLabel = await toggle.getAttribute('aria-label');
    await toggle.click();
    const newLabel = await toggle.getAttribute('aria-label');
    expect(newLabel).not.toBe(initialLabel);
  });
});

test.describe('Manager Dashboard - Smoke Tests', () => {

  test('team dashboard tab is accessible', async ({ page }) => {
    await page.goto('/');
    const teamTab = page.getByText(/team dashboard/i).or(page.getByText(/team roll-up/i));
    // If the tab exists, click it
    if (await teamTab.isVisible()) {
      await teamTab.click();
      // Should show team-related content
      await expect(page.getByText(/team/i)).toBeVisible();
    }
  });
});
