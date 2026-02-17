import { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState('');
  const navigate = useNavigate();
  // Access token stored in a ref (in-memory, non-persistent)
  const accessTokenRef = useRef(null);
  const navigateRef = useRef(navigate);
  const hasAttemptedRefresh = useRef(false); // Prevent duplicate refresh on mount

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const handleAuthFailure = useCallback((message = 'Your session has expired. Please sign in again.', { silentNavigate = false } = {}) => {
    setAccessToken(null);
    setUser(null);
    setLoading(false);
    setSessionMessage(message);

    if (!silentNavigate) {
      const redirectTo = window.location.pathname + window.location.search + window.location.hash;
      navigateRef.current('/login', { replace: true, state: { message, redirectTo } });
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const hadUser = !!user;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      // Handle rate limiting (429) specifically
      if (response.status === 429) {
        console.warn('[AuthContext] Rate limit hit on refresh. Please wait before retrying.');
        setLoading(false);
        return null;
      }

      if (!response.ok) {
        // If user was logged in, treat as expiration; otherwise just finish loading quietly
        if (hadUser) {
          handleAuthFailure();
        } else {
          setLoading(false);
        }
        return null;
      }

      // Check if response has content
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0' || !response.body) {
        console.warn('[AuthContext] Refresh response is empty');
        if (hadUser) {
          handleAuthFailure();
        } else {
          setLoading(false);
        }
        return null;
      }
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[AuthContext] Failed to parse refresh response:', parseError);
        if (hadUser) {
          handleAuthFailure();
        } else {
          setLoading(false);
        }
        return null;
      }
      
      // DEFENSIVE: Ensure user object has required role
      if (!data.user || !data.user.role) {
        console.error('[AuthContext] Invalid refresh response: missing user or role', data);
        setLoading(false);
        return null;
      }

      // CRITICAL: Normalize role to uppercase
      const validRoles = ['STUDENT', 'SRC', 'ADMIN', 'DELIVERY'];
      const userRole = String(data.user.role).toUpperCase().trim();
      if (!validRoles.includes(userRole)) {
        console.error('[AuthContext] Invalid role in refresh:', data.user.role);
        setLoading(false);
        return null;
      }

      const normalizedUser = {
        ...data.user,
        role: userRole
      };

      setSessionMessage('');
      setAccessToken(data.accessToken);
      setUser(normalizedUser);
      setLoading(false);
      
      if (import.meta.env.DEV) {
        console.log('[AuthContext] Token refreshed for user:', normalizedUser.email, 'Role:', normalizedUser.role);
      }
      
      return { ...data, user: normalizedUser };
    } catch (error) {
      if (hadUser) {
        handleAuthFailure();
      } else {
        setLoading(false);
      }
      return null;
    }
  }, [user, handleAuthFailure]);

  useEffect(() => {
    // Try to refresh token on mount (only once)
    if (!hasAttemptedRefresh.current) {
      hasAttemptedRefresh.current = true;
      refreshToken().catch(() => {
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAccessToken = (token) => {
    console.log('[AuthContext] Setting access token:', token ? 'present' : 'null');
    accessTokenRef.current = token;
  };

  const getAccessToken = () => accessTokenRef.current;

  const authFetch = async (input, init = {}) => {
    const headers = new Headers(init.headers || {});
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const requestConfig = { 
      ...init, 
      headers, 
      credentials: init.credentials !== undefined ? init.credentials : 'include' 
    };
    
    console.log('[AuthContext] authFetch request:', {
      url: input,
      method: requestConfig.method || 'GET',
      hasToken: !!token,
      credentials: requestConfig.credentials,
      headers: Object.fromEntries(headers.entries())
    });

    try {
      const response = await fetch(input, requestConfig);
      
      console.log('[AuthContext] authFetch response:', {
        url: input,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.status === 401) {
        handleAuthFailure();
        throw new Error('Session expired');
      }

      if (response.status === 403) {
        console.warn('[AuthContext] 403 Forbidden - Insufficient permissions');
        navigateRef.current('/unauthorized', { replace: true });
        throw new Error('You do not have permission to access this resource');
      }

      return response;
    } catch (err) {
      console.error(`[AuthContext] authFetch error on ${input}:`, {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      throw err;
    }
  };

  const clearSessionMessage = () => setSessionMessage('');

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Include cookies for refresh token
    });

    // Handle rate limiting (429) specifically
    if (response.status === 429) {
      const text = await response.text();
      throw new Error(text || 'Too many login attempts. Please try again later.');
    }

    // Check if response has content before parsing JSON
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0' || !response.body) {
      console.error('[AuthContext] Login response is empty');
      throw new Error('Server returned empty response. Please try again.');
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('[AuthContext] Failed to parse login response:', parseError);
      throw new Error('Invalid server response. Please try again.');
    }
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // DEFENSIVE: Ensure user object has required role
    if (!data.user || !data.user.role) {
      console.error('[AuthContext] Invalid login response: missing user or role', data);
      throw new Error('Authentication failed: No role returned from server');
    }

    // DEFENSIVE: Validate role is one of the expected values
    const validRoles = ['STUDENT', 'SRC', 'ADMIN', 'DELIVERY'];
    const userRole = String(data.user.role).toUpperCase().trim();
    if (!validRoles.includes(userRole)) {
      console.error('[AuthContext] Invalid role returned:', data.user.role);
      throw new Error(`Authentication failed: Invalid role "${data.user.role}"`);
    }

    // CRITICAL: Normalize role to uppercase
    const normalizedUser = {
      ...data.user,
      role: userRole
    };

    setSessionMessage('');
    setAccessToken(data.accessToken);
    setUser(normalizedUser);
    
    // Dev logging
    if (import.meta.env.DEV) {
      console.log('[AuthContext] Login successful:', normalizedUser.email, 'Role:', normalizedUser.role);
    }
    
    return { ...data, user: normalizedUser };
  };

  const register = async (userData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return data;
  };

  const logout = async (reason = '') => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    const message = reason || '';
    setAccessToken(null);
    setUser(null);
    if (message) {
      setSessionMessage(message);
      navigateRef.current('/login', { replace: true, state: { message } });
    } else {
      navigateRef.current('/login');
    }
  };

  const requestPasswordReset = async (email) => {
    const response = await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Password reset request failed');
    }

    return data;
  };

  const resetPassword = async (token, newPassword) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Password reset failed');
    }

    return data;
  };

  const verifyEmail = async (token) => {
    const response = await fetch(`/api/auth/verify-email/${token}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Email verification failed');
    }

    return data;
  };

  // Auto-refresh access token before expiry (every 14 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshToken().catch((error) => {
        console.error('Auto-refresh failed:', error);
        handleAuthFailure();
      });
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(interval);
  }, [user, refreshToken, handleAuthFailure]);

  // Auto-logout after inactivity to protect sessions
  useEffect(() => {
    if (!user) return;

    let timeoutId;
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleAuthFailure('You were signed out after 30 minutes of inactivity. Please sign in again.');
      }, SESSION_TIMEOUT_MS);
    };

    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimeout));
    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimeout));
    };
  }, [user, handleAuthFailure]);

  const value = {
    user,
    loading,
    sessionMessage,
    clearSessionMessage,
    login,
    register,
    logout,
    refreshToken,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    getAccessToken,
    authFetch,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
