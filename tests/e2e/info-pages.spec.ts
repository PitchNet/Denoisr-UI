import { test, expect } from '@playwright/test'

const infoRoutes: Array<{ path: string; eyebrow: string; titleMatch: RegExp }> = [
  { path: '/about',             eyebrow: 'ABOUT',             titleMatch: /signal-first/i },
  { path: '/careers',           eyebrow: 'CAREERS',           titleMatch: /signal, not noise/i },
  { path: '/contact',           eyebrow: 'CONTACT',           titleMatch: /Denoisr team/i },
  { path: '/features',          eyebrow: 'FEATURES',          titleMatch: /noise-free/i },
  { path: '/for-recruiters',    eyebrow: 'FOR RECRUITERS',    titleMatch: /intent, not volume/i },
  { path: '/help-center',       eyebrow: 'HELP CENTER',       titleMatch: /signal-first/i },
  { path: '/how-it-works',      eyebrow: 'HOW IT WORKS',      titleMatch: /structured discovery/i },
  { path: '/security',          eyebrow: 'SECURITY',          titleMatch: /protects signal/i },
  { path: '/status',            eyebrow: 'STATUS',            titleMatch: /system status/i },
  { path: '/privacy-policy',    eyebrow: 'PRIVACY POLICY',    titleMatch: /privacy practices/i },
  { path: '/terms-of-service',  eyebrow: 'TERMS OF SERVICE',  titleMatch: /signal-first/i },
  { path: '/cookie-policy',     eyebrow: 'COOKIE POLICY',     titleMatch: /cookies/i },
]

test.describe('InfoPage variants', () => {
  for (const route of infoRoutes) {
    test(`${route.path} renders eyebrow and headline`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page.locator('.info__eyebrow')).toHaveText(route.eyebrow)
      await expect(page.locator('.info__title')).toContainText(route.titleMatch)
      // At least one paragraph must render
      await expect(page.locator('.info__p').first()).toBeVisible()
    })
  }

  test('the global navbar is visible on info pages', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('.nav__brand')).toBeVisible()
    await expect(page.locator('.nav__brand')).toContainText('Denoisr')
  })

  test('the global footer is visible on info pages', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('.footer')).toBeVisible()
  })
})
