import { test, expect } from '@playwright/test'
import { HomePage, buildMockCards } from '../pages/home.page'

test.describe('Home (/home) — with mocked API', () => {
  test('renders the deck when the API returns cards', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoWithMocks()
    await expect(home.cardTitle).toBeVisible()
    await expect(home.cardTitle).toContainText('Role 1')
  })

  test('mode switching swaps the deck and persists in the URL', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoWithMocks({
      jobs: buildMockCards('jobs'),
      people: buildMockCards('people'),
    })
    await expect(home.cardTitle).toContainText('Role 1')

    // The mobile mode switch lives inside the deck topbar; on desktop the chrome nav has its own.
    // Either way, navigating with ?mode=people should swap the deck.
    await page.goto('/home?mode=people')
    await expect(home.cardTitle).toContainText('Person 1')
    expect(page.url()).toContain('mode=people')
  })

  test('error banner appears when the fetch fails AND clears after a successful retry', async ({ page }) => {
    const home = new HomePage(page)
    // First load fails
    await home.gotoWithMocks({ failJobs: true })
    await expect(home.errorBanner).toBeVisible()
    await expect(home.errorBanner).toContainText(/failed to load/i)

    // Now make the next call succeed by re-registering the route
    await page.unroute('**/FeedController/fetchJobs')
    await page.route('**/FeedController/fetchJobs', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildMockCards('jobs')),
      }),
    )

    // Trigger a refetch by applying a filter that matches the mock data
    await home.roleInput.fill('backend')
    await home.applyFilterBtn.click()

    await expect(home.errorBanner).toBeHidden()
    await expect(home.cardTitle).toContainText('Role')
  })

  test('error banner is dismissible via × button', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoWithMocks({ failJobs: true })
    await expect(home.errorBanner).toBeVisible()

    await page.getByRole('button', { name: 'Dismiss' }).click()
    await expect(home.errorBanner).toBeHidden()
  })

  test('reset filters button surfaces when the deck is empty', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoWithMocks({ jobs: [] })
    await expect(home.emptyState).toBeVisible()
    await expect(home.resetFiltersBtn).toBeVisible()
  })

  test('clicking Apply on the top card advances to the next card', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoWithMocks({ jobs: buildMockCards('jobs', 3) })

    // Stub the jobAction endpoint
    await page.route('**/FeedController/jobAction', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    )

    await expect(home.cardTitle).toContainText('Role 1')
    await home.applyBtn.click()
    // Card exit animation = 260ms
    await page.waitForTimeout(320)
    await expect(home.cardTitle).toContainText('Role 2')
  })
})
