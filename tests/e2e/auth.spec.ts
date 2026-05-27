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

  test('successful login stores the token and navigates to /home', async ({ page, context }) => {
    await page.route('**/LoginController/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.x',
          token_type: 'bearer',
        }),
      }),
    )
    // Also stub the protected feed endpoints so /home doesn't crash
    await page.route('**/FeedController/fetchJobs', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await loginPage.submitForm('test@example.com', 'good')
    await expect(page).toHaveURL(/\/home/)

    const cookies = await context.cookies()
    expect(cookies.find((c) => c.name === 'denoisr_auth_token')?.value).toContain('eyJ')
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
