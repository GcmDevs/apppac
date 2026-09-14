import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getAuthSession, getDefaultRouteForRole, getCurrentUserRole, isAuthenticated } from '@/lib/auth'
import type { UserRole } from '@/types/auth'

type ProtectedRouteProps = {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const currentRole = getCurrentUserRole()
  const session = getAuthSession()

  if (session?.passwordIsReset && location.pathname !== '/actualizar-contrasena') {
    return <Navigate to="/actualizar-contrasena" replace />
  }

  if (!session?.passwordIsReset && location.pathname === '/actualizar-contrasena') {
    return <Navigate to={getDefaultRouteForRole(currentRole)} replace />
  }

  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    return <Navigate to={getDefaultRouteForRole(currentRole)} replace />
  }

  return <Outlet />
}
