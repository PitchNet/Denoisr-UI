import { test, expect } from '@playwright/test'

const SETTINGS_BODY = {
  notify_connections: true,
  notify_messages: true,
  notify_job_updates: true,
  profile_visible: true,
  allow_messages_from: 'all',
}

test.describe('Settings — data tab (/settings)', () => {
  test.beforeEach(async ({ page }) => {
    // Mirrors HomePage's mock setup: seed the two plain, non-secret cookies
    // the app itself sets after login (see auth.ts) so the route guard lets
    // us into a protected page without a real httpOnly session.
    await page.context().addCookies([
      { name: 'denoisr_session', value: '1', domain: 'localhost', path: '/' },
      { name: 'denoisr_user_id', value: 'test-user', domain: 'localhost', path: '/' },
    ])
    await page.route('**/SettingsController/getSettings', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SETTINGS_BODY) }),
    )
    await page.goto('/settings')
    await page.getByRole('button', { name: 'Data' }).click()
  })

  test('downloads a JSON export', async ({ page }) => {
    await page.route('**/SettingsController/exportData', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exportedAt: '2026-01-01T00:00:00Z', profile: { id: 'test-user' } }),
      }),
    )
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download my data' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/denoisr-data-export-.*\.json/)
  })

  test('delete account requires opening the confirm form first', async ({ page }) => {
    await expect(page.locator('.st-dangerZone input[type="password"]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Delete my account' }).click()
    await expect(page.locator('.st-dangerZone input[type="password"]')).toBeVisible()
  })

  test('shows the backend error on wrong password and does not navigate away', async ({ page }) => {
    await page.route('**/SettingsController/deleteAccount', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Password is incorrect' }),
      }),
    )
    await page.getByRole('button', { name: 'Delete my account' }).click()
    await page.locator('.st-dangerZone input[type="password"]').fill('wrong-password')
    await page.getByRole('button', { name: 'Permanently delete my account' }).click()
    await expect(page.getByRole('alert')).toContainText(/password is incorrect/i)
    await expect(page).toHaveURL(/\/settings/)
  })

  test('successful deletion clears the session and redirects to the landing page', async ({ page, context }) => {
    await page.route('**/SettingsController/deleteAccount', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Account deleted' }) }),
    )
    await page.route('**/LoginController/logout', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    )
    await page.getByRole('button', { name: 'Delete my account' }).click()
    await page.locator('.st-dangerZone input[type="password"]').fill('correct-password')
    await page.getByRole('button', { name: 'Permanently delete my account' }).click()
    await expect(page).toHaveURL('/')

    const cookies = await context.cookies()
    expect(cookies.find((c) => c.name === 'denoisr_session')).toBeUndefined()
    expect(cookies.find((c) => c.name === 'denoisr_user_id')).toBeUndefined()
  })
})
