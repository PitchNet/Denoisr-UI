import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class LoginPage extends BasePage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submit: Locator
  readonly error: Locator
  readonly signupLink: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.getByLabel('Email', { exact: true })
    this.passwordInput = page.getByLabel('Password', { exact: true })
    this.submit = page.getByRole('button', { name: 'Sign in' })
    this.error = page.getByRole('alert')
    this.signupLink = page.getByRole('link', { name: /request invite/i })
  }

  async goto() {
    await this.navigate('/login')
  }

  async submitForm(email: string, password: string) {
    if (email) await this.emailInput.fill(email)
    if (password) await this.passwordInput.fill(password)
    await this.submit.click()
  }
}

export class SignupPage extends BasePage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submit: Locator
  readonly error: Locator
  readonly loginLink: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.getByLabel('Work email')
    this.passwordInput = page.getByLabel('Password', { exact: true })
    this.submit = page.getByRole('button', { name: 'Request invite' })
    this.error = page.getByRole('alert')
    this.loginLink = page.getByRole('link', { name: /sign in/i })
  }

  async goto() {
    await this.navigate('/signup')
  }

  async submitForm(email: string, password: string) {
    if (email) await this.emailInput.fill(email)
    if (password) await this.passwordInput.fill(password)
    await this.submit.click()
  }
}
