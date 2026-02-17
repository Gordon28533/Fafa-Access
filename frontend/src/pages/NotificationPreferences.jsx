import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences,
  toggleAllEmailNotifications,
  toggleAllInAppNotifications
} from '../services/notificationPreferencesService';
import { Bell, Mail, MessageSquare, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

/**
 * NotificationPreferences Component
 * 
 * Allows students to manage their notification preferences across:
 * - Application status updates
 * - Approval notifications
 * - Delivery updates
 * - Payment reminders
 * 
 * Supports two channels:
 * - Email notifications
 * - In-app notifications
 */
const NotificationPreferences = () => {
  const { authFetch } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [preferences, setPreferences] = useState(null);

  // Load preferences
  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchNotificationPreferences(authFetch);
      setPreferences(data);
    } catch (err) {
      setError(err.message || 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle individual preference change
  const handleToggle = async (field) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updates = {
        [field]: !preferences[field]
      };

      const updated = await updateNotificationPreferences(authFetch, updates);
      setPreferences(updated);
      setSuccess('Preference updated');
    } catch (err) {
      setError(err.message || 'Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle all email
  const handleToggleAllEmail = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const allEmailEnabled = [
        preferences.applicationStatusEmailEnabled,
        preferences.approvalEmailEnabled,
        preferences.deliveryEmailEnabled,
        preferences.paymentEmailEnabled
      ].every(v => v);

      const updated = await toggleAllEmailNotifications(authFetch, !allEmailEnabled);
      setPreferences(updated);
      setSuccess(`All email notifications ${!allEmailEnabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setError(err.message || 'Failed to toggle email notifications');
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle all in-app
  const handleToggleAllInApp = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const allInAppEnabled = [
        preferences.applicationStatusInAppEnabled,
        preferences.approvalInAppEnabled,
        preferences.deliveryInAppEnabled,
        preferences.paymentInAppEnabled
      ].every(v => v);

      const updated = await toggleAllInAppNotifications(authFetch, !allInAppEnabled);
      setPreferences(updated);
      setSuccess(`All in-app notifications ${!allInAppEnabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setError(err.message || 'Failed to toggle in-app notifications');
    } finally {
      setSaving(false);
    }
  };

  // Handle reset to defaults
  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all notification preferences to defaults? All toggles will be turned on except marketing emails.')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updated = await resetNotificationPreferences(authFetch);
      setPreferences(updated);
      setSuccess('Notification preferences reset to defaults');
    } catch (err) {
      setError(err.message || 'Failed to reset preferences');
    } finally {
      setSaving(false);
    }
  };

  // Calculate email and in-app summaries
  const emailEnabled = preferences ? [
    preferences.applicationStatusEmailEnabled,
    preferences.approvalEmailEnabled,
    preferences.deliveryEmailEnabled,
    preferences.paymentEmailEnabled
  ].filter(v => v).length : 0;

  const inAppEnabled = preferences ? [
    preferences.applicationStatusInAppEnabled,
    preferences.approvalInAppEnabled,
    preferences.deliveryInAppEnabled,
    preferences.paymentInAppEnabled
  ].filter(v => v).length : 0;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-600">Loading notification preferences...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800 font-semibold">{error || 'Failed to load preferences'}</p>
          <button
            onClick={loadPreferences}
            className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const allEmailEnabled = [
    preferences.applicationStatusEmailEnabled,
    preferences.approvalEmailEnabled,
    preferences.deliveryEmailEnabled,
    preferences.paymentEmailEnabled
  ].every(v => v);

  const allInAppEnabled = [
    preferences.applicationStatusInAppEnabled,
    preferences.approvalInAppEnabled,
    preferences.deliveryInAppEnabled,
    preferences.paymentInAppEnabled
  ].every(v => v);

  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange, disabled }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-green-600' : 'bg-gray-300'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-6 h-6 text-blue-600" />
          <p className="text-sm uppercase tracking-wide text-gray-500">Notifications</p>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="text-gray-600 mt-2">Control how and when you receive updates about your application, approvals, deliveries, and payments.</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-gray-600" />
                Email Notifications
              </h3>
              <p className="text-sm text-gray-600 mt-1">{emailEnabled} of 4 enabled</p>
            </div>
            <ToggleSwitch enabled={allEmailEnabled} onChange={handleToggleAllEmail} disabled={saving} />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                In-App Notifications
              </h3>
              <p className="text-sm text-gray-600 mt-1">{inAppEnabled} of 4 enabled</p>
            </div>
            <ToggleSwitch enabled={allInAppEnabled} onChange={handleToggleAllInApp} disabled={saving} />
          </div>
        </div>
      </div>

      {/* Notification Preferences Grid */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h2>

        <div className="space-y-6">
          {/* Application Status Updates */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Application Status Updates</h3>
            <p className="text-sm text-gray-600 mb-4">Receive notifications when your application status changes</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-xs text-gray-500">Sent to your email address</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={preferences.applicationStatusEmailEnabled}
                  onChange={() => handleToggle('applicationStatusEmailEnabled')}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">In-App Notifications</p>
                    <p className="text-xs text-gray-500">Shown in your dashboard</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={preferences.applicationStatusInAppEnabled}
                  onChange={() => handleToggle('applicationStatusInAppEnabled')}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Approval Notifications */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Notifications</h3>
            <p className="text-sm text-gray-600 mb-4">Get notified when your application is approved or rejected</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-xs text-gray-500">Sent to your email address</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={preferences.approvalEmailEnabled}
                  onChange={() => handleToggle('approvalEmailEnabled')}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">In-App Notifications</p>
                    <p className="text-xs text-gray-500">Shown in your dashboard</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={preferences.approvalInAppEnabled}
                  onChange={() => handleToggle('approvalInAppEnabled')}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Delivery Updates */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Updates</h3>
            <p className="text-sm text-gray-600 mb-4">Stay informed about your laptop delivery status and tracking</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-xs text-gray-500">Sent to your email address</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={preferences.deliveryEmailEnabled}
                  onChange={() => handleToggle('deliveryEmailEnabled')}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">In-App Notifications</p>
                    <p className="text-xs text-gray-500">Shown in your dashboard</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={preferences.deliveryInAppEnabled}
                  onChange={() => handleToggle('deliveryInAppEnabled')}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Payment Reminders */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Reminders</h3>
            <p className="text-sm text-gray-600 mb-4">Receive reminders about upcoming and outstanding payments</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-xs text-gray-500">Sent to your email address</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={preferences.paymentEmailEnabled}
                  onChange={() => handleToggle('paymentEmailEnabled')}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">In-App Notifications</p>
                    <p className="text-xs text-gray-500">Shown in your dashboard</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={preferences.paymentInAppEnabled}
                  onChange={() => handleToggle('paymentInAppEnabled')}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Reset to Defaults</h3>
            <p className="text-sm text-blue-800 mt-1">
              Reset all notification preferences to their default settings (all enabled except marketing emails)
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-6 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">About Notifications</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="text-blue-600 font-semibold">•</span>
            <span><strong>Email Notifications</strong> are sent directly to your registered email address</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 font-semibold">•</span>
            <span><strong>In-App Notifications</strong> appear in your dashboard and notification center</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 font-semibold">•</span>
            <span>Changes to your preferences are saved automatically</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 font-semibold">•</span>
            <span>Important security and account notifications are always sent regardless of preferences</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationPreferences;
