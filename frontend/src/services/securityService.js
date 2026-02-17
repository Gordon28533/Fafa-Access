/**
 * Security Service
 * Frontend service for security-related API calls
 */

const API_BASE = '/api/security';

/**
 * Get current security settings
 */
export const fetchSecuritySettings = async (authFetch) => {
  const response = await authFetch(`${API_BASE}/settings`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch security settings');
  }
  const result = await response.json();
  return result.data;
};

/**
 * Change password
 */
export const changePassword = async (authFetch, currentPassword, newPassword, confirmPassword) => {
  const response = await authFetch(`${API_BASE}/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to change password');
  }
  
  return result;
};

/**
 * Get login sessions
 */
export const fetchLoginSessions = async (authFetch) => {
  const response = await authFetch(`${API_BASE}/sessions`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch login sessions');
  }
  const result = await response.json();
  return result.data;
};

/**
 * Logout from all devices
 */
export const logoutAllDevices = async (authFetch, password) => {
  const response = await authFetch(`${API_BASE}/logout-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to logout from all devices');
  }
  
  return result;
};

/**
 * Toggle 2FA
 */
export const toggle2FA = async (authFetch, enable, password) => {
  const response = await authFetch(`${API_BASE}/toggle-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enable, password })
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to toggle 2FA');
  }
  
  return result;
};
