import { test, expect } from '@playwright/test'

test('customer can log in and see restaurants', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#login-field', 'john@test.com')
  await page.fill('#login-pw', 'password')
  await page.click('button[aria-label="Login"]')
  await expect(page).toHaveURL('/')
  await expect(page.locator('text=Restaurants')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('text=Pizza Palace')).toBeVisible()
  await expect(page.locator('text=Logout')).toBeVisible()
})

test('login with wrong password shows error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#login-field', 'john@test.com')
  await page.fill('#login-pw', 'wrongpassword')
  await page.click('button[aria-label="Login"]')
  await expect(page.locator('text=Invalid email/username or password')).toBeVisible({ timeout: 10000 })
})

test('login shows server-unreachable message when backend is down', async ({ page }) => {
  await page.route('**/api/auth/login', route => route.abort())
  await page.goto('/login')
  await page.fill('#login-field', 'john@test.com')
  await page.fill('#login-pw', 'password')
  await page.click('button[aria-label="Login"]')
  await expect(page.locator('text=Cannot reach server. Check your connection and try again.')).toBeVisible({ timeout: 10000 })
})

test('forgot-password page is reachable without redirecting to login', async ({ page }) => {
  await page.goto('/forgot-password')
  await expect(page).toHaveURL('/forgot-password')
  await expect(page.locator('text=Forgot Password')).toBeVisible()
})

test('reset-password page shows invalid-link message without a token', async ({ page }) => {
  await page.goto('/reset-password')
  await expect(page).toHaveURL('/reset-password')
  await expect(page.locator('text=invalid or missing')).toBeVisible()
})
