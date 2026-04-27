import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './components/AuthGuard'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MessagesPage from './pages/MessagesPage'
import ProductPage from './pages/ProductPage'
import SignupPage from './pages/SignupPage'
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="denoisrApp">
        <Navbar />
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
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
