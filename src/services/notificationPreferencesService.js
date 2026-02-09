/**
 * Notification Preferences Service
 * Frontend service for notification preferences API calls
 */

const API_BASE = '/api/notifications';

/**
 * Get notification preferences
 */
export const fetchNotificationPreferences = async (authFetch) => {
  const response = await authFetch(`${API_BASE}/preferences`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch notification preferences');
  }
  const result = await response.json();
  return result.data;
};

/**
 * Update specific notification preferences
 */
export const updateNotificationPreferences = async (authFetch, updates) => {
  const response = await authFetch(`${API_BASE}/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update notification preferences');
  }
  
  return result.data;
};

/**
 * Reset notification preferences to defaults
 */
export const resetNotificationPreferences = async (authFetch) => {
  const response = await authFetch(`${API_BASE}/preferences/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to reset notification preferences');
  }
  
  return result.data;
};

/**
 * Toggle all email notifications
 */
export const toggleAllEmailNotifications = async (authFetch, enabled) => {
  const response = await authFetch(`${API_BASE}/preferences/toggle-all-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to toggle email notifications');
  }
  
  return result.data;
};

/**
 * Toggle all in-app notifications
 */
export const toggleAllInAppNotifications = async (authFetch, enabled) => {
  const response = await authFetch(`${API_BASE}/preferences/toggle-all-inapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to toggle in-app notifications');
  }
  
  return result.data;
};
