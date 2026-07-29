const { test, expect } = require('@playwright/test')

test('customer can log in and see restaurants', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'john@test.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button[aria-label="Login"]')
  await expect(page.locator('text=Restaurants')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('text=Pizza Palace')).toBeVisible()
})

test('login with wrong password shows error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'john@test.com')
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[aria-label="Login"]')
  await expect(page.locator('text=Invalid email or password')).toBeVisible()
})