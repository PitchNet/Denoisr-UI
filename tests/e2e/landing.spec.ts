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
    await expect(landing.heroHeadline).toContainText('Hire by signal')
    await expect(landing.heroHeadline).toContainText('proof')
  })

  test('mode toggle swaps the deck content', async ({ page }) => {
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

  test('invite form rejects empty submit and marks input invalid', async ({ page }) => {
    // Form uses noValidate, so the JS handler validates and sets aria-invalid
    await landing.inviteSubmit.click()
    await expect(landing.inviteEmailInput).toHaveAttribute('aria-invalid', 'true')
  })

  test('invite form shows error on malformed email', async ({ page }) => {
    await landing.inviteEmailInput.fill('not-an-email')
    await landing.inviteSubmit.click()
    // We don't navigate; the form shows an inline message
    await expect(page.locator('.el-invite__sub')).toContainText(/work address/i)
  })

  test('invite form shows success on valid email', async ({ page }) => {
    await landing.submitInvite('jane@work.com')
    await expect(page.locator('.el-invite__done-title')).toContainText(/on the list/i)
  })

  test('first FAQ item is open by default', async () => {
    await expect(landing.faqItems.first()).toHaveAttribute('open', '')
  })

  test('FAQ items expand on click', async ({ page }) => {
    const second = landing.faqItems.nth(1)
    await expect(second).not.toHaveAttribute('open', '')
    await second.locator('summary').click()
    await expect(second).toHaveAttribute('open', '')
  })

  test('research links point to real external papers (open in new tab)', async ({ page }) => {
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
    // Scope to the sticky chrome to avoid colliding with the footer link
    await page.locator('.el-chrome').getByRole('link', { name: 'How it works' }).click()
    await page.waitForTimeout(800)
    const how = page.locator('#how')
    const inView = await how.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return rect.top >= -50 && rect.top < window.innerHeight
    })
    expect(inView).toBe(true)
  })
})
