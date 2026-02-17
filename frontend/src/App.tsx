import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Layout from './layouts/Layout'
import LaptopCatalog from './pages/LaptopCatalog'
import LaptopDetails from './pages/LaptopDetails'
import StudentDashboard from './pages/StudentDashboard'
import StudentProfile from './pages/StudentProfile'
import StudentSecuritySettings from './pages/StudentSecuritySettings'
import NotificationPreferences from './pages/NotificationPreferences'
import SupportTickets from './pages/SupportTickets'
import SRCDashboard from './pages/SRCDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminAuditLogViewer from './pages/AdminAuditLogViewer'
import AdminAnalyticsDashboard from './pages/AdminAnalyticsDashboard'
import ApplicationDetailPage from './pages/ApplicationDetailPage'
import LaptopInventoryPage from './pages/LaptopInventoryPage'
import DeliveryQueue from './pages/DeliveryQueue'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import NotFoundPage from './pages/NotFoundPage'
import AdminSRCInvitations from './components/AdminSRCInvitations'
import AdminUniversityManagement from './components/AdminUniversityManagement'
import SRCAgreementAcceptance from './components/SRCAgreementAcceptance'
import AdminPaymentDashboard from './components/AdminPaymentDashboard'
import AdminPaymentDetail from './components/AdminPaymentDetail'
import AdminProductManagement from './pages/AdminProductManagement'
import { ProtectedRoute, GuestRoute } from './components/auth/ProtectedRoute'
import { useAuth } from './hooks/useAuth'

const FullPageLoader = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  </div>
)

const RoleRouteLayout = ({ allowedRoles }) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    <Layout>
      <Outlet />
    </Layout>
  </ProtectedRoute>
)

function App() {
  const { loading } = useAuth()

  // Guard rendering while auth state is resolving to avoid flicker/flash
  if (loading) {
    return <FullPageLoader message="Checking your session..." />
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout><LaptopCatalog /></Layout>} />
        <Route path="/catalog" element={<Layout><LaptopCatalog /></Layout>} />
        <Route path="/laptop/:id" element={<Layout><LaptopDetails /></Layout>} />
        
        {/* Guest Routes (only accessible when NOT logged in) */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        
        {/* Email Verification (accessible to all) */}
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        
        {/* SRC Agreement Acceptance (PUBLIC - token-based) */}
        <Route path="/src/accept/:token" element={<SRCAgreementAcceptance />} />
        
        {/* Error Pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Protected Routes - STUDENT */}
        <Route element={<RoleRouteLayout allowedRoles={["STUDENT"]} />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/profile" element={<StudentProfile />} />
          <Route path="/security" element={<StudentSecuritySettings />} />
          <Route path="/notifications" element={<NotificationPreferences />} />
          <Route path="/support" element={<SupportTickets />} />
          <Route path="/settings" element={<Navigate to="/profile" replace />} />
          <Route path="/applications" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route
          path="/application/:applicationId"
          element={
            <ProtectedRoute allowedRoles={["STUDENT", "SRC", "ADMIN"]}>
              <ApplicationDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - SRC */}
        <Route element={<RoleRouteLayout allowedRoles={["SRC"]} />}>
          <Route path="/src/dashboard" element={<SRCDashboard />} />
        </Route>

        {/* Protected Routes - ADMIN */}
        <Route element={<RoleRouteLayout allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/inventory" element={<LaptopInventoryPage />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogViewer />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsDashboard />} />
          <Route path="/admin/universities" element={<AdminUniversityManagement />} />
          <Route path="/admin/src-invitations" element={<AdminSRCInvitations />} />
          <Route path="/admin/payments" element={<AdminPaymentDashboard />} />
          <Route path="/admin/payments/:paymentId" element={<AdminPaymentDetail />} />
          <Route path="/admin/product-management" element={<AdminProductManagement />} />
        </Route>

        {/* Protected Routes - DELIVERY */}
        <Route element={<RoleRouteLayout allowedRoles={["DELIVERY"]} />}>
          <Route path="/delivery/queue" element={<DeliveryQueue />} />
        </Route>
        
        {/* Catch-all: 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
