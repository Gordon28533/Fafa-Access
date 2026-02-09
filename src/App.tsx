import { Routes, Route, Navigate } from 'react-router-dom'
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
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <Layout><StudentDashboard /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <Layout><StudentProfile /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/security" 
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <Layout><StudentSecuritySettings /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <Layout><NotificationPreferences /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/support" 
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <Layout><SupportTickets /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/application/:applicationId" 
          element={
            <ProtectedRoute allowedRoles={["STUDENT", "SRC", "ADMIN"]}>
              <ApplicationDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <Navigate to="/profile" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />
        
        {/* Protected Routes - SRC */}
        <Route 
          path="/src/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["SRC"]}>
              <Layout><SRCDashboard /></Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Routes - ADMIN */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/inventory" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout><LaptopInventoryPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/audit-logs" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout><AdminAuditLogViewer /></Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/analytics" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout><AdminAnalyticsDashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/universities" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout><AdminUniversityManagement /></Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/src-invitations" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout><AdminSRCInvitations /></Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/payments" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout><AdminPaymentDashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/payments/:paymentId" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout><AdminPaymentDetail /></Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/product-management" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout><AdminProductManagement /></Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Protected Routes - DELIVERY */}
        <Route 
          path="/delivery/queue" 
          element={
            <ProtectedRoute allowedRoles={["DELIVERY"]}>
              <Layout><DeliveryQueue /></Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Catch-all: 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
