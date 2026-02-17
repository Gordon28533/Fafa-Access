import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getRoleHome, normalizeRole } from '../../utils/roleRouting';

const isDevelopment = import.meta.env.DEV;

export function ProtectedRoute({ children, allowedRoles, redirectTo = null }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.warn('[ProtectedRoute] No user authenticated. Redirecting to login.');
    const redirectToState = location.pathname + location.search + location.hash;
    return <Navigate to="/login" replace state={{ redirectTo: redirectToState, message: 'Please sign in to continue.' }} />;
  }

  const userRole = normalizeRole(user.role);
  const allowed = Array.isArray(allowedRoles)
    ? allowedRoles.map((r) => normalizeRole(r))
    : allowedRoles
    ? [normalizeRole(allowedRoles)]
    : null;

  if (isDevelopment) {
    console.log('[ProtectedRoute] User:', user.email, 'Role:', userRole, 'Allowed:', allowed);
  }

  // Enforce allowedRoles strictly; no admin bypass

  // Check if user's role is in the allowed list
  if (allowed && !allowed.includes(userRole)) {
    console.warn(`[ProtectedRoute] Access denied. User role: ${userRole}, Required: ${allowed.join(', ')}.`);
    return (
      <Navigate
        to={redirectTo || '/unauthorized'}
        replace
        state={{
          from: location.pathname + location.search + location.hash,
          requiredRoles: allowed,
          userRole,
        }}
      />
    );
  }

  return children;
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  // Role-based redirect for logged-in users
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // If user is logged in, redirect to their role-specific dashboard
  if (user) {
    const userRole = normalizeRole(user.role);
    const rolePath = getRoleHome(userRole) || '/';
    
    if (isDevelopment) {
      console.log('[GuestRoute] User logged in. Role:', userRole, 'Redirecting to:', rolePath);
    }
    
    return <Navigate to={rolePath} replace />;
  }

  return children;
}
