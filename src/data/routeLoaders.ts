// Single source of truth for per-route loading copy.
//
// Used in two places that must stay in lockstep so the loader never flashes
// generic text or swaps copy mid-load:
//   1. the route-level <Suspense> fallback in App.tsx, shown while a page's
//      code chunk downloads (the route path is known before the chunk loads), and
//   2. each page's own data-loading state, shown while it fetches.
// Because both read the same copy for a given route, the chunk-load loader and
// the data-load loader are visually identical — one continuous loader.

export type LoaderCopy = { label: string; detail: string }

// Fallback for routes without their own page loader (auth/info/dashboard).
export const DEFAULT_LOADER: LoaderCopy = {
  label: 'Loading',
  detail: 'One moment.',
}

// /home — copy depends on the jobs/people mode, which lives in the URL (?mode=).
export function homeLoader(mode: 'jobs' | 'people'): LoaderCopy {
  return mode === 'jobs'
    ? { label: 'Curating roles', detail: 'A short, deliberate set is on its way.' }
    : { label: 'Curating people', detail: 'Pulling people whose intent overlaps with yours.' }
}

// /admin/companies — copy depends on the active tab (defaults to companies on load).
export function adminLoader(tab: 'companies' | 'reports'): LoaderCopy {
  return tab === 'companies'
    ? { label: 'Loading review queue', detail: 'Pulling pending companies.' }
    : { label: 'Loading reports', detail: 'Pulling open reports.' }
}

// Static, route-exact copy.
export const LOADERS = {
  messages: { label: 'Loading threads', detail: 'Pulling in the connections you have an open line with.' },
  profile: { label: 'Loading profile', detail: 'Pulling together your Denoisr card.' },
  profileEdit: { label: 'Loading profile', detail: 'Preparing your profile editor.' },
  applications: { label: 'Loading applications', detail: 'Pulling your submitted applications.' },
  company: { label: 'Loading company', detail: 'Fetching your company profile.' },
  companyDetail: { label: 'Loading company', detail: 'Fetching company details.' },
  jobDetail: { label: 'Loading job', detail: 'Fetching job details.' },
  settings: { label: 'Loading settings', detail: 'Fetching your account preferences.' },
} satisfies Record<string, LoaderCopy>

// Resolve the loader copy for a route + query string. Mirrors each page's own
// loader, so the <Suspense> fallback shows the right copy before the chunk loads.
export function getRouteLoader(pathname: string, search = ''): LoaderCopy {
  if (pathname === '/home') {
    const mode = new URLSearchParams(search).get('mode') === 'people' ? 'people' : 'jobs'
    return homeLoader(mode)
  }
  if (pathname === '/admin/companies') return adminLoader('companies')
  if (pathname.startsWith('/company/')) return LOADERS.companyDetail
  if (pathname.startsWith('/job/')) return LOADERS.jobDetail
  switch (pathname) {
    case '/messages': return LOADERS.messages
    case '/profile': return LOADERS.profile
    case '/profile/edit': return LOADERS.profileEdit
    case '/applications': return LOADERS.applications
    case '/company': return LOADERS.company
    case '/settings': return LOADERS.settings
    default: return DEFAULT_LOADER
  }
}
