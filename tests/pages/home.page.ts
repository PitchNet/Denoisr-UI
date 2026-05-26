import { Page, Locator, Route } from '@playwright/test'
import { BasePage } from './base.page'

export type MockCard = {
  id: string
  kind: 'jobs' | 'people'
  headline: string
  subheadline: string
  organization: string
  location: string
  experience: number
  salary: number
  intro: string
  highlights: string[]
  tags: string[]
  sections: Array<{ title: string; items: string[] }>
}

export const buildMockCards = (mode: 'jobs' | 'people', n = 3): MockCard[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${mode}-${i + 1}`,
    kind: mode,
    headline: mode === 'jobs' ? `Role ${i + 1}` : `Person ${i + 1}`,
    subheadline: mode === 'jobs' ? 'Senior backend' : 'Backend engineer',
    organization: 'Acme',
    location: 'Berlin, Germany',
    experience: 5 + i,
    salary: 100 + i * 10,
    intro: `Intro paragraph for ${mode} card ${i + 1}.`,
    highlights: ['Go', 'Postgres'],
    tags: ['Remote', 'Async'],
    sections: [{ title: 'Proof of work', items: [`Did thing ${i + 1}`] }],
  }))

export class HomePage extends BasePage {
  readonly filtersPanel: Locator
  readonly deckPanel: Locator
  readonly previewPanel: Locator
  readonly cardTitle: Locator
  readonly skipBtn: Locator
  readonly applyBtn: Locator
  readonly applyFilterBtn: Locator
  readonly roleInput: Locator
  readonly errorBanner: Locator
  readonly emptyState: Locator
  readonly resetFiltersBtn: Locator

  constructor(page: Page) {
    super(page)
    this.filtersPanel = page.locator('.hp-filters')
    this.deckPanel = page.locator('.hp-deck')
    this.previewPanel = page.locator('.hp-preview')
    this.cardTitle = page.locator('.hp-card--top .hp-card__title')
    this.skipBtn = page.getByRole('button', { name: 'Skip' })
    this.applyBtn = page.getByRole('button', { name: /^(Apply|Send opener)$/ })
    this.applyFilterBtn = page.getByRole('button', { name: 'Apply filter' })
    this.roleInput = page.getByPlaceholder('Search role')
    this.errorBanner = page.getByRole('alert')
    this.emptyState = page.locator('.hp-empty')
    this.resetFiltersBtn = page.getByRole('button', { name: 'Reset filters' })
  }

  async gotoWithMocks(opts: {
    jobs?: MockCard[]
    people?: MockCard[]
    failJobs?: boolean
    failPeople?: boolean
    mode?: 'jobs' | 'people'
  } = {}) {
    const { jobs = buildMockCards('jobs'), people = buildMockCards('people'), failJobs, failPeople, mode } = opts

    // Inject a fake auth cookie so the route guard doesn't redirect us to /login
    await this.page.context().addCookies([
      {
        name: 'denoisr_auth_token',
        // a real-shaped JWT with a sub claim so getAuthenticatedUserId works
        value: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXIifQ.x',
        domain: 'localhost',
        path: '/',
      },
    ])

    await this.page.route('**/FeedController/fetchJobs', async (route: Route) => {
      if (failJobs) {
        await route.fulfill({ status: 500, body: 'boom' })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(jobs),
      })
    })
    await this.page.route('**/FeedController/fetchPeople', async (route: Route) => {
      if (failPeople) {
        await route.fulfill({ status: 500, body: 'boom' })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(people),
      })
    })

    const query = mode === 'people' ? '?mode=people' : ''
    await this.navigate(`/home${query}`)
  }
}
