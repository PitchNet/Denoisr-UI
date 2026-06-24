import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class LandingPage extends BasePage {
  readonly heroHeadline: Locator
  readonly modeJobs: Locator
  readonly modePeople: Locator
  readonly deck: Locator
  readonly deckSkip: Locator
  readonly deckBookmark: Locator
  readonly deckLike: Locator
  readonly faqItems: Locator
  readonly researchLinks: Locator

  constructor(page: Page) {
    super(page)
    this.heroHeadline = page.getByRole('heading', { level: 1 })
    this.modeJobs = page.getByRole('tab', { name: 'Jobs' })
    this.modePeople = page.getByRole('tab', { name: 'People' })
    this.deck = page.getByLabel(/sample deck/i)
    this.deckSkip = page.getByRole('button', { name: 'Skip' })
    this.deckBookmark = page.getByRole('button', { name: 'Bookmark' })
    this.deckLike = page.getByRole('button', { name: 'Like' })
    this.faqItems = page.locator('.el2-faq__item')
    this.researchLinks = page.locator('.el2-paper__link')
  }

  async goto() {
    await this.navigate('/')
  }

  // The chrome/navbar is hidden during the scroll-driven noise intro and only becomes
  // interactive once the noise clears. Scroll past the intro and wait for it to reveal
  // before interacting with header controls (mode toggle, nav links).
  async revealChrome() {
    await this.page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.6))
    await this.page.waitForFunction(() => {
      const h = document.querySelector('.el2-chrome')
      return !!h && getComputedStyle(h).pointerEvents === 'auto'
    })
  }

  async swipe(action: 'skip' | 'bookmark' | 'like') {
    const btn = action === 'skip' ? this.deckSkip : action === 'bookmark' ? this.deckBookmark : this.deckLike
    await btn.click()
    // exit animation is 260ms, wait it out
    await this.page.waitForTimeout(320)
  }

  async getActiveModeLabel(): Promise<string> {
    const activeBtn = this.page.locator('.el2-mode__btn--active')
    return (await activeBtn.textContent()) ?? ''
  }
}
