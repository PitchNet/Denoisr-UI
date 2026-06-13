import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { ProtectedRoute, PublicOnlyRoute } from './components/AuthGuard'
import { fetchAndCacheProfile, isAuthenticated } from './auth'
import { registerServiceWorker, subscribeToPush } from './notifications'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MessagesPage from './pages/MessagesPage'
import JobApplicationsPage from './pages/JobApplicationsPage'
import CompanyPage from './pages/CompanyPage'
import ProfileEditPage from './pages/ProfileEditPage'
import ProfilePage from './pages/ProfilePage'
import ProductPage from './pages/ProductPage'
import SignupPage from './pages/SignupPage'
import MobileBottomNav from './components/MobileBottomNav'
import AboutPage from './pages/AboutPage'
import CareersPage from './pages/CareersPage'
import CookiePolicyPage from './pages/CookiePolicyPage'
import ContactPage from './pages/ContactPage'
import FeaturesPage from './pages/FeaturesPage'
import ForRecruitersPage from './pages/ForRecruitersPage'
import HelpCenterPage from './pages/HelpCenterPage'
import HowItWorksPage from './pages/HowItWorksPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import SecurityPage from './pages/SecurityPage'
import StatusPage from './pages/StatusPage'
import TermsOfServicePage from './pages/TermsOfServicePage'

function AppShell() {
  const { pathname } = useLocation()
  const isEditorialLanding = pathname === '/'
  const isAppPage = pathname === '/home' || pathname === '/messages' || pathname === '/profile' || pathname === '/profile/edit' || pathname === '/dashboard' || pathname === '/applications' || pathname === '/company'

  const activePage = pathname.startsWith('/profile') ? 'profile'
    : pathname === '/home' ? 'home'
    : pathname === '/messages' ? 'messages'
    : pathname === '/applications' ? 'applications'
    : pathname === '/company' ? 'company'
    : 'home' as const

  useEffect(() => {
    if (isEditorialLanding) {
      document.documentElement.classList.remove('liquid-glass')
    }
    if (isAuthenticated()) {
      fetchAndCacheProfile()
      registerServiceWorker().then(() => subscribeToPush()).catch(() => {})
    }
  }, [pathname])

  return (
    <div className="denoisrApp">
      {isEditorialLanding ? null : <Navbar />}
      <main className="denoisrMain">
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/" element={<ProductPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/applications" element={<JobApplicationsPage />} />
            <Route path="/company" element={<CompanyPage />} />
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
        {isAuthenticated() ? <MobileBottomNav activePage={activePage} /> : null}
      </main>
      {isEditorialLanding || isAppPage ? null : <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
      <SpeedInsights />
    </BrowserRouter>
  )
}
