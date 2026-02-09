import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  fetchSecuritySettings,
  changePassword as changePasswordAPI,
  fetchLoginSessions,
  logoutAllDevices as logoutAllAPI,
  toggle2FA as toggle2FAAPI
} from '../services/securityService';
import { Lock, Shield, Monitor, LogOut, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * StudentSecuritySettings Component
 * 
 * Provides security management features:
 * - Change password with current password verification
 * - View recent login sessions (device, date, location)
 * - Logout from all devices
 * - Toggle email-based 2FA (future-ready)
 * 
 * All sensitive actions require password confirmation.
 */
const StudentSecuritySettings = () => {
  const { authFetch } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [securitySettings, setSecuritySettings] = useState(null);
  const [loginSessions, setLoginSessions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Change Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Logout All state
  const [logoutAllPassword, setLogoutAllPassword] = useState('');
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 2FA state
  const [twoFAPassword, setTwoFAPassword] = useState('');
  const [toggling2FA, setToggling2FA] = useState(false);
  const [show2FAConfirm, setShow2FAConfirm] = useState(false);

  // Load security settings and sessions
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [settings, sessions] = await Promise.all([
        fetchSecuritySettings(authFetch),
        fetchLoginSessions(authFetch)
      ]);
      
      setSecuritySettings(settings);
      setLoginSessions(sessions.sessions || []);
    } catch (err) {
      setError(err.message || 'Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    try {
      setChangingPassword(true);
      setError('');
      setSuccess('');

      await changePasswordAPI(
        authFetch,
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );

      setSuccess('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle logout from all devices
  const handleLogoutAll = async () => {
    try {
      setLoggingOutAll(true);
      setError('');
      setSuccess('');

      const result = await logoutAllAPI(authFetch, logoutAllPassword);
      
      setSuccess(result.message);
      setLogoutAllPassword('');
      setShowLogoutConfirm(false);
      
      // Refresh sessions list
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to logout from all devices');
    } finally {
      setLoggingOutAll(false);
    }
  };

  // Handle 2FA toggle
  const handleToggle2FA = async () => {
    try {
      setToggling2FA(true);
      setError('');
      setSuccess('');

      const enable = !securitySettings.mfaEnabled;
      const result = await toggle2FAAPI(authFetch, enable, twoFAPassword);
      
      setSuccess(result.message);
      setTwoFAPassword('');
      setShow2FAConfirm(false);
      
      // Refresh settings
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to toggle 2FA');
    } finally {
      setToggling2FA(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get device icon
  const getDeviceIcon = () => {
    return <Monitor className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-600">Loading security settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <p className="text-sm uppercase tracking-wide text-gray-500">Security Settings</p>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Protect Your Account</h1>
        <p className="text-gray-600 mt-2">Manage your password, login sessions, and security preferences.</p>
      </div>

      {/* Success/Error Messages */}
      {(error || success) && (
        <div className={`p-4 rounded-lg border ${error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2">
            {error ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            <p className={`text-sm font-medium ${error ? 'text-red-800' : 'text-green-800'}`}>
              {error || success}
            </p>
          </div>
        </div>
      )}

      {/* Change Password Section */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-gray-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
            <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {changingPassword ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Recent Login Sessions */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Login Sessions</h2>
              <p className="text-sm text-gray-600">Monitor your account activity across devices</p>
            </div>
          </div>
          <span className="text-sm text-gray-500">{loginSessions.length} sessions</span>
        </div>

        <div className="space-y-3">
          {loginSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No recent login sessions found</p>
            </div>
          ) : (
            loginSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="mt-1">
                  {getDeviceIcon()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {session.browserName || 'Unknown Browser'} on {session.osName || 'Unknown OS'}
                    </p>
                    {session.isActive === 'true' && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <p>{session.location || 'Location unknown'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Last activity: {formatDate(session.lastActivityAt)} • IP: {session.ipAddress}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Logout from All Devices */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <LogOut className="w-5 h-5 text-gray-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Logout from All Devices</h2>
            <p className="text-sm text-gray-600">Sign out from all active sessions on other devices</p>
          </div>
        </div>

        {!showLogoutConfirm ? (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="px-6 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50"
          >
            Logout from All Devices
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Confirm Logout</p>
                <p className="text-sm text-red-800 mt-1">
                  This will sign you out from all devices except this one. You'll need to login again on other devices.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-red-900 mb-2">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={logoutAllPassword}
                onChange={(e) => setLogoutAllPassword(e.target.value)}
                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Your password"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleLogoutAll}
                disabled={loggingOutAll || !logoutAllPassword}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loggingOutAll ? 'Logging out...' : 'Confirm Logout'}
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setLogoutAllPassword('');
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Email-based 2FA (Future-ready) */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-600">Add an extra layer of security with email verification</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {securitySettings?.mfaEnabled ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                Enabled
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                Disabled
              </span>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-900">
              When enabled, you'll receive a verification code via email each time you log in from a new device.
            </p>
          </div>
        </div>

        {!show2FAConfirm ? (
          <button
            onClick={() => setShow2FAConfirm(true)}
            className={`px-6 py-2 rounded-lg ${
              securitySettings?.mfaEnabled
                ? 'border border-red-200 text-red-700 hover:bg-red-50'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {securitySettings?.mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={twoFAPassword}
                onChange={(e) => setTwoFAPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your password"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleToggle2FA}
                disabled={toggling2FA || !twoFAPassword}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {toggling2FA ? 'Updating...' : 'Confirm'}
              </button>
              <button
                onClick={() => {
                  setShow2FAConfirm(false);
                  setTwoFAPassword('');
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Best Practices
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Use a strong, unique password that you don't use anywhere else</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Change your password regularly and whenever you suspect unauthorized access</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Review your login sessions periodically and logout from unfamiliar devices</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Enable 2FA for an additional layer of security on your account</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StudentSecuritySettings;
