import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Footer from '../components/common/Footer'
import { getRoleHome } from '../utils/roleRouting'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()

  const dashboardPath = getRoleHome(user?.role || '') || '/dashboard'

  const handleLogout = () => {
    logout()
  }

  const isAdminRoute = isAuthenticated && user?.role === 'ADMIN' && location.pathname.startsWith('/admin')

  return (
    <div className="layout">
      <header className="header sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-3 text-gray-900 hover:text-gray-700 transition-colors"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-semibold">
                SL
              </span>
              <span className="text-lg font-semibold">Student Laptop Access Platform</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
              <Link to="/" className="hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link to="/catalog" className="hover:text-gray-900 transition-colors">
                Laptops
              </Link>
              <Link to="/#how-it-works" className="hover:text-gray-900 transition-colors">
                How It Works
              </Link>
              <Link to="/#support" className="hover:text-gray-900 transition-colors">
                Support
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to={dashboardPath}
                    className="inline-flex items-center rounded-full border border-gray-900 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center rounded-full border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center rounded-full border border-green-600 px-4 py-2 text-sm font-semibold text-green-600 hover:bg-green-600 hover:text-white transition-colors"
                  >
                    Register
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center rounded-full border border-gray-900 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="main-content">
        {isAdminRoute ? (
          <div className="flex flex-col gap-6 lg:flex-row">
            <aside className="admin-sidebar">
              <p className="admin-sidebar-title">Admin Panel</p>
              <nav>
                <Link
                  to="/admin"
                  className={`admin-sidebar-link ${
                    location.pathname === '/admin' ? 'active' : ''
                  }`}
                >
                  📊 Dashboard
                </Link>
                <Link
                  to="/admin/analytics"
                  className={`admin-sidebar-link ${
                    location.pathname === '/admin/analytics' ? 'active' : ''
                  }`}
                >
                  📈 Analytics
                </Link>
                <Link
                  to="/admin/audit-logs"
                  className={`admin-sidebar-link ${
                    location.pathname === '/admin/audit-logs' ? 'active' : ''
                  }`}
                >
                  📋 Audit Logs
                </Link>
                <Link
                  to="/admin/inventory"
                  className={`admin-sidebar-link ${
                    location.pathname.startsWith('/admin/inventory') ? 'active' : ''
                  }`}
                >
                  💻 Laptop Inventory
                </Link>
                <Link
                  to="/admin/src-invitations"
                  className={`admin-sidebar-link ${
                    location.pathname.startsWith('/admin/src-invitations') ? 'active' : ''
                  }`}
                >
                  ✉️ SRC Invitations
                </Link>
              </nav>
            </aside>
            <div className="flex-1">
              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </main>
      <Footer />
    </div>
  )
}

export default Layout
