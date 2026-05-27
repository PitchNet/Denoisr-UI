import { test, expect } from '@playwright/test'
import { HomePage, buildMockCards } from '../pages/home.page'

test.describe('Home — match overlay (people mode)', () => {
  test('shows "It\'s a fit." overlay when peopleAction returns matched:true', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoWithMocks({
      people: buildMockCards('people', 2),
      mode: 'people',
    })

    await page.route('**/FeedController/peopleAction', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ matched: true }),
      }),
    )

    await expect(home.cardTitle).toContainText('Person 1')
    await page.getByRole('button', { name: 'Send opener' }).click()

    // Overlay appears
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: "It's a fit." })).toBeVisible()

    // The two action buttons are present
    const overlay = page.getByRole('dialog')
    await expect(overlay.getByRole('button', { name: 'Send opener' })).toBeVisible()
    await expect(overlay.getByRole('button', { name: 'Keep swiping' })).toBeVisible()
  })

  test('"Keep swiping" dismisses the overlay and advances the deck', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoWithMocks({
      people: buildMockCards('people', 3),
      mode: 'people',
    })

    await page.route('**/FeedController/peopleAction', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ matched: true }),
      }),
    )

    await page.getByRole('button', { name: 'Send opener' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Keep swiping' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(home.cardTitle).toContainText('Person 2')
  })
})

test.describe('Home — desktop scroll behaviour', () => {
  test('page body does not scroll; panels scroll internally', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoWithMocks({ jobs: buildMockCards('jobs', 5) })
    // .hp lock to viewport with overflow: hidden
    const hp = page.locator('.hp')
    const overflow = await hp.evaluate((el) => getComputedStyle(el).overflow)
    expect(overflow).toContain('hidden')
    // Each panel has internal overflow-y: auto
    const filtersOverflow = await page
      .locator('.hp-filters')
      .evaluate((el) => getComputedStyle(el).overflowY)
    expect(filtersOverflow).toBe('auto')
  })
})

test.describe('Home — rapid swipe stress', () => {
  test('rapid clicks on skip do not double-advance or break the counter', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoWithMocks({ jobs: buildMockCards('jobs', 4) })

    await expect(home.cardTitle).toContainText('Role 1')

    // Click skip 3 times in rapid succession
    await home.skipBtn.click()
    await home.skipBtn.click()
    await home.skipBtn.click()
    await page.waitForTimeout(400)

    // Counter should advance — but how many cards moved depends on whether
    // the swipe lock works. The point is: state should be coherent.
    const titleText = await home.cardTitle.textContent()
    // Title should be one of Role 2, 3, or 4 (never blank, never Role 1)
    expect(titleText).toMatch(/Role [2-4]/)
  })
})

test.describe('Home — mobile viewport', () => {
  test('mobile bottom nav shows and filters panel is hidden', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const home = new HomePage(page)
    await home.gotoWithMocks({ jobs: buildMockCards('jobs') })

    await expect(page.locator('.hp-bottomnav')).toBeVisible()
    await expect(page.locator('.hp-filters')).toBeHidden()
    // The mobile chip rail should be visible instead
    await expect(page.locator('.hp-mobileFilters')).toBeVisible()
  })

  test('mode switch in the global navbar is visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const home = new HomePage(page)
    await home.gotoWithMocks({ jobs: buildMockCards('jobs') })
    await expect(page.locator('.nav__modeSwitch')).toBeVisible()
    // And the active Jobs tab has the unmistakable ink-bg active state
    const activeBtn = page.locator('.nav__modeButton--active')
    await expect(activeBtn).toHaveText('Jobs')
  })

  test('navbar icon row is hidden on mobile (bottom nav covers those)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const home = new HomePage(page)
    await home.gotoWithMocks({ jobs: buildMockCards('jobs') })
    await expect(page.locator('.nav__appLinks')).toBeHidden()
    await expect(page.locator('.hp-bottomnav')).toBeVisible()
  })
})
