import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { hasSignupInProgress, isAuthenticated } from '../auth'

export function ProtectedRoute() {
  const location = useLocation()

  if (location.pathname === '/dashboard' && hasSignupInProgress()) {
    return <Outlet />
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}
