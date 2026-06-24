import { test, expect } from '@playwright/test'
import { LandingPage } from '../pages/landing.page'

test.describe('Landing page (/)', () => {
  let landing: LandingPage

  test.beforeEach(async ({ page }) => {
    landing = new LandingPage(page)
    await landing.goto()
  })

  test('renders the hero headline', async ({ page }) => {
    await expect(page).toHaveURL('/')
    await expect(landing.heroHeadline).toContainText('Remove the')
    await expect(landing.heroHeadline).toContainText('noise')
    await expect(landing.heroHeadline).toContainText('hiring')
  })

  test('mode toggle swaps the deck content', async ({ page }) => {
    // chrome (with the Jobs/People toggle) is hidden during the noise intro
    await landing.revealChrome()
    // jobs deck default
    await expect(landing.modeJobs).toHaveAttribute('aria-selected', 'true')
    const firstJobsTitle = await page.locator('.el-deck__top .el-herocard__title').textContent()

    await landing.modePeople.click()
    await expect(landing.modePeople).toHaveAttribute('aria-selected', 'true')

    const firstPeopleTitle = await page.locator('.el-deck__top .el-herocard__title').textContent()
    expect(firstPeopleTitle).not.toBe(firstJobsTitle)
  })

  test('deck advances when an action button is clicked', async ({ page }) => {
    const initial = await page.locator('.el-deck__top .el-herocard__title').textContent()
    await landing.swipe('like')
    const next = await page.locator('.el-deck__top .el-herocard__title').textContent()
    expect(next).not.toBe(initial)
  })

  test('deck progress counter increments on swipe', async ({ page }) => {
    const counter = page.locator('.el-deck__progress span').first()
    const before = await counter.textContent()
    await landing.swipe('skip')
    const after = await counter.textContent()
    expect(after).not.toBe(before)
  })

  test('first FAQ item is open by default', async () => {
    await expect(landing.faqItems.first()).toHaveAttribute('open', '')
  })

  test('FAQ items expand on click', async () => {
    const second = landing.faqItems.nth(1)
    await expect(second).not.toHaveAttribute('open', '')
    await second.locator('summary').click()
    await expect(second).toHaveAttribute('open', '')
  })

  test('research links point to real external papers (open in new tab)', async () => {
    const count = await landing.researchLinks.count()
    expect(count).toBe(3)
    for (let i = 0; i < count; i++) {
      const link = landing.researchLinks.nth(i)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', /noreferrer|noopener/)
      const href = await link.getAttribute('href')
      expect(href).toMatch(/^https?:\/\//)
    }
  })

  test('keyboard arrow keys swipe the deck', async ({ page }) => {
    await landing.deck.focus()
    const before = await page.locator('.el-deck__top .el-herocard__title').textContent()
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(320)
    const after = await page.locator('.el-deck__top .el-herocard__title').textContent()
    expect(after).not.toBe(before)
  })

  test('chrome nav anchors smooth-scroll to sections', async ({ page }) => {
    // chrome is hidden during the noise intro — reveal it first
    await landing.revealChrome()
    // Scope to the sticky chrome to avoid colliding with the footer link
    await page.locator('.el2-chrome').getByRole('link', { name: 'The signal' }).click()
    await page.waitForTimeout(800)
    const signal = page.locator('#signal')
    const inView = await signal.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return rect.top >= -50 && rect.top < window.innerHeight
    })
    expect(inView).toBe(true)
  })
})
