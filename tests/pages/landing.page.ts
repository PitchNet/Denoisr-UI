import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

export class LandingPage extends BasePage {
  readonly heroHeadline: Locator
  readonly modeJobs: Locator
  readonly modePeople: Locator
  readonly inviteEmailInput: Locator
  readonly inviteSubmit: Locator
  readonly deck: Locator
  readonly deckSkip: Locator
  readonly deckBoost: Locator
  readonly deckLike: Locator
  readonly faqItems: Locator
  readonly researchLinks: Locator

  constructor(page: Page) {
    super(page)
    this.heroHeadline = page.getByRole('heading', { level: 1 })
    this.modeJobs = page.getByRole('tab', { name: 'Jobs' })
    this.modePeople = page.getByRole('tab', { name: 'People' })
    this.inviteEmailInput = page.getByLabel('Work email').or(page.getByPlaceholder('you@work.com'))
    this.inviteSubmit = page.getByRole('button', { name: 'Request invite' }).first()
    this.deck = page.getByLabel(/sample deck/i)
    this.deckSkip = page.getByRole('button', { name: 'Skip' })
    this.deckBoost = page.getByRole('button', { name: 'Boost' })
    this.deckLike = page.getByRole('button', { name: 'Like' })
    this.faqItems = page.locator('.el-faq__item')
    this.researchLinks = page.locator('.el-paper__link')
  }

  async goto() {
    await this.navigate('/')
  }

  async swipe(action: 'skip' | 'boost' | 'like') {
    const btn = action === 'skip' ? this.deckSkip : action === 'boost' ? this.deckBoost : this.deckLike
    await btn.click()
    // exit animation is 260ms, wait it out
    await this.page.waitForTimeout(320)
  }

  async submitInvite(email: string) {
    await this.inviteEmailInput.fill(email)
    await this.inviteSubmit.click()
  }

  async getActiveModeLabel(): Promise<string> {
    const activeBtn = this.page.locator('.el-mode__btn--active')
    return (await activeBtn.textContent()) ?? ''
  }
}
