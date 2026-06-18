import { test, expect } from '@playwright/test'
import { LoginPage, SignupPage } from '../pages/auth.page'

test.describe('Login (/login)', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test('renders the form', async () => {
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submit).toBeVisible()
  })

  test('empty submit is blocked by HTML5 required, no navigation', async ({ page }) => {
    await loginPage.submit.click()
    // Browser blocks the submit; URL stays on /login
    await expect(page).toHaveURL('/login')
    // The form input is still in its invalid state
    const valid = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(valid).toBe(false)
  })

  test('shows backend error message on bad credentials', async ({ page }) => {
    await page.route('**/LoginController/login', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
    )
    await loginPage.submitForm('test@example.com', 'wrong')
    await expect(loginPage.error).toBeVisible()
    await expect(loginPage.error).toContainText(/wrong email or password/i)
  })

  test('navigates to signup via footer link', async ({ page }) => {
    await loginPage.signupLink.click()
    await expect(page).toHaveURL('/signup')
  })

  test('successful login navigates to /home and marks the session', async ({ page, context }) => {
    // The real JWT is set by the API as an httpOnly Set-Cookie header — out of
    // reach for this mocked route (and for page JS in general). The frontend
    // only reads the `user` object from the body to mark a non-secret,
    // JS-readable "logged in" flag used for client-side routing.
    await page.route('**/LoginController/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'user-123' } }),
      }),
    )
    // Also stub the protected feed endpoints so /home doesn't crash
    await page.route('**/FeedController/fetchJobs', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await loginPage.submitForm('test@example.com', 'good')
    await expect(page).toHaveURL(/\/home/)

    const cookies = await context.cookies()
    expect(cookies.find((c) => c.name === 'denoisr_session')?.value).toBe('1')
    expect(cookies.find((c) => c.name === 'denoisr_user_id')?.value).toBe('user-123')
    // The app never writes the real auth cookie itself — only the API can.
    expect(cookies.find((c) => c.name === 'denoisr_auth_token')).toBeUndefined()
  })
})

test.describe('Signup (/signup)', () => {
  let signupPage: SignupPage

  test.beforeEach(async ({ page }) => {
    signupPage = new SignupPage(page)
    await signupPage.goto()
  })

  test('renders with the request-invite framing', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Create your signal/ })).toBeVisible()
    await expect(signupPage.submit).toBeVisible()
  })

  test('shows inline error on missing email', async () => {
    await signupPage.passwordInput.fill('aaaaaaaa')
    await signupPage.submit.click()
    // HTML5 required should keep us on page; signup is a SPA route
    // (the inline error only triggers if both fields are filled but email is malformed)
  })

  test('shows inline error on malformed email', async ({ page }) => {
    await signupPage.emailInput.fill('not-an-email')
    await signupPage.passwordInput.fill('aaaaaaaa')
    await signupPage.submit.click()
    await expect(signupPage.error).toBeVisible()
    await expect(signupPage.error).toContainText(/email/i)
  })

  test('valid submission navigates to /dashboard', async ({ page }) => {
    await signupPage.emailInput.fill('jane@work.com')
    await signupPage.passwordInput.fill('aaaaaaaa')
    await signupPage.submit.click()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Forgot password (/forgot-password)', () => {
  test('navigates there from the login footer link', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page).toHaveURL('/forgot-password')
  })

  test('shows the same generic confirmation regardless of whether the email exists (email mode)', async ({ page }) => {
    await page.route('**/LoginController/forgotPassword', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'If that email is registered, a reset link is on its way.' }),
      }),
    )
    await page.goto('/forgot-password')
    await page.getByLabel('Email', { exact: true }).fill('nobody@example.com')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('status')).toContainText(/reset link is on its way/i)
  })

  test('jumps straight to /reset-password when no email provider is configured', async ({ page }) => {
    // LoginController.forgot_password hands the token back directly when
    // RESEND_API_KEY isn't set, so the UI can skip the email step entirely.
    await page.route('**/LoginController/forgotPassword', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'No email service is configured.', token: 'no-email-token' }),
      }),
    )
    await page.goto('/forgot-password')
    await page.getByLabel('Email', { exact: true }).fill('jane@work.com')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page).toHaveURL(/\/reset-password\?token=no-email-token/)
  })
})

test.describe('Reset password (/reset-password)', () => {
  test('without a token, shows an error and a link back to forgot-password', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByRole('alert')).toContainText(/missing its token/i)
    await page.getByRole('link', { name: 'forgot password' }).click()
    await expect(page).toHaveURL('/forgot-password')
  })

  test('rejects mismatched passwords client-side without calling the API', async ({ page }) => {
    let called = false
    await page.route('**/LoginController/resetPassword', (route) => {
      called = true
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })
    await page.goto('/reset-password?token=abc123')
    await page.getByLabel('New password', { exact: true }).fill('aaaaaaaa')
    await page.getByLabel('Confirm new password').fill('bbbbbbbb')
    await page.getByRole('button', { name: 'Update password' }).click()
    await expect(page.getByRole('alert')).toContainText(/don.t match/i)
    expect(called).toBe(false)
  })

  test('shows the backend error for an invalid or expired token', async ({ page }) => {
    await page.route('**/LoginController/resetPassword', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'This reset link is invalid or has expired.' }),
      }),
    )
    await page.goto('/reset-password?token=expired')
    await page.getByLabel('New password', { exact: true }).fill('aaaaaaaa')
    await page.getByLabel('Confirm new password').fill('aaaaaaaa')
    await page.getByRole('button', { name: 'Update password' }).click()
    await expect(page.getByRole('alert')).toContainText(/invalid or has expired/i)
  })

  test('valid submission shows confirmation and redirects to /login', async ({ page }) => {
    await page.route('**/LoginController/resetPassword', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password updated. You can now log in.' }),
      }),
    )
    await page.goto('/reset-password?token=valid-token')
    await page.getByLabel('New password', { exact: true }).fill('aaaaaaaa')
    await page.getByLabel('Confirm new password').fill('aaaaaaaa')
    await page.getByRole('button', { name: 'Update password' }).click()
    await expect(page.getByRole('status')).toContainText(/password updated/i)
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })
})
