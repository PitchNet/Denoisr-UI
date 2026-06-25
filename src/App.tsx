import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { ProtectedRoute, PublicOnlyRoute } from './components/AuthGuard'
import { fetchAndCacheIsAdmin, fetchAndCacheProfile, isAuthenticated } from './auth'
import { registerServiceWorker, subscribeToPush } from './notifications'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import MobileBottomNav from './components/MobileBottomNav'
import { ToastProvider } from './components/ui/Toast'
import LoadingState from './components/ui/LoadingState'
// The landing page is the entry route ('/'), so it stays eager — lazy-loading
// it only adds a Suspense fallback flash and races its scroll-animation setup.
import ProductPageV2 from './pages/ProductPageV2'

// Every other route is lazy-loaded so each page ships as its own chunk
// instead of one large eager bundle.
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const MessagesPage = lazy(() => import('./pages/MessagesPage'))
const JobApplicationsPage = lazy(() => import('./pages/JobApplicationsPage'))
const CompanyPage = lazy(() => import('./pages/CompanyPage'))
const CompanyDetailPage = lazy(() => import('./pages/CompanyDetailPage'))
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'))
const AdminCompaniesPage = lazy(() => import('./pages/AdminCompaniesPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const CareersPage = lazy(() => import('./pages/CareersPage'))
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'))
const ForRecruitersPage = lazy(() => import('./pages/ForRecruitersPage'))
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage'))
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const SecurityPage = lazy(() => import('./pages/SecurityPage'))
const StatusPage = lazy(() => import('./pages/StatusPage'))
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'))

function AppShell() {
  const { pathname } = useLocation()
  const isEditorialLanding = pathname === '/'
  const isAppPage = pathname === '/home' || pathname === '/messages' || pathname === '/profile' || pathname === '/profile/edit' || pathname === '/dashboard' || pathname === '/applications' || pathname.startsWith('/company') || pathname.startsWith('/job') || pathname === '/settings' || pathname === '/admin/companies'

  const activePage = pathname.startsWith('/profile') || pathname === '/settings' ? 'profile'
    : pathname === '/home' ? 'home'
    : pathname === '/messages' ? 'messages'
    : pathname === '/applications' ? 'applications'
    : pathname.startsWith('/company') ? 'company'
    : 'home' as const

  useEffect(() => {
    if (isEditorialLanding) {
      document.documentElement.classList.remove('liquid-glass')
    }
    if (isAuthenticated()) {
      fetchAndCacheProfile()
      fetchAndCacheIsAdmin()
      registerServiceWorker().then(() => subscribeToPush()).catch(() => {})
    }
  }, [pathname])

  return (
    <div className="denoisrApp">
      {isEditorialLanding ? null : <Navbar />}
      <main className="denoisrMain">
        <Suspense fallback={<LoadingState className="loader--page" />}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/" element={<ProductPageV2 />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/job/:id" element={<JobDetailPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/applications" element={<JobApplicationsPage />} />
            <Route path="/company" element={<CompanyPage />} />
            <Route path="/company/:id" element={<CompanyDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin/companies" element={<AdminCompaniesPage />} />
          </Route>
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/for-recruiters" element={<ForRecruitersPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/help-center" element={<HelpCenterPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        </Routes>
        </Suspense>
        {isAuthenticated() ? <MobileBottomNav activePage={activePage} /> : null}
      </main>
      {isEditorialLanding || isAppPage ? null : <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
      <SpeedInsights />
      <Analytics />
    </BrowserRouter>
  )
}
