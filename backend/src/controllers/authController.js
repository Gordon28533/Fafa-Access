import process from 'process';
import { db } from '../db/connection.js';
import { users, refreshTokens } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  handleFailedLogin,
  handleSuccessfulLogin,
  logLoginAttempt,
  simulateDelay,
  validateGhanaPhone,
  normalizeGhanaPhone,
  verifyAndRotateRefreshToken,
} from '../services/authService.js';
import { logAuthFailure } from '../observability.js';

// Register new user
export async function register(req, res) {
  try {
    const { email, password, fullName, phone, role } = req.body;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate phone if provided
    if (phone && !validateGhanaPhone(phone)) {
      return res.status(400).json({ 
        error: 'Invalid Ghana phone number. Use format: +233 XXX XXX XXXX or 0XX XXX XXXX' 
      });
    }
    
    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    let passwordHash;
    try {
      passwordHash = await hashPassword(password);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Generate email verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hour expiry
    
    // Determine role (default to STUDENT for Gmail users)
    let userRole = 'STUDENT';
    if (role && ['STUDENT', 'SRC', 'ADMIN', 'DELIVERY'].includes(role)) {
      // Only allow role assignment if explicitly provided (for admin creation)
      userRole = role;
    }
    
    // Create user
    const newUser = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      phone: phone ? normalizeGhanaPhone(phone) : null,
      role: userRole,
      status: 'PENDING_EMAIL', // Require email verification
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    }).returning();
    
    // TODO: Send verification email
    // await sendVerificationEmail(newUser[0].email, verificationToken);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        fullName: newUser[0].fullName,
        role: newUser[0].role,
        status: newUser[0].status,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

// Verify email
export async function verifyEmail(req, res) {
  try {
    const { token } = req.params;
    
    const userRecord = await db.select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);
    
    if (!userRecord.length) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }
    
    const user = userRecord[0];
    
    // Check if token is expired
    if (new Date() > new Date(user.emailVerificationExpiry)) {
      return res.status(400).json({ error: 'Verification token expired' });
    }
    
    // Update user status
    await db.update(users)
      .set({
        status: 'ACTIVE',
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    
    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
}

// Login
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';
    
    // Find user
    const userRecord = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    
    if (!userRecord.length) {
      await simulateDelay(); // Timing attack mitigation
      await logLoginAttempt(email, null, false, 'user_not_found', ipAddress, userAgent);
      logAuthFailure({ email, reason: 'user_not_found', ip: ipAddress });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userRecord[0];
    
    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
      await logLoginAttempt(email, user.id, false, 'account_locked', ipAddress, userAgent);
      return res.status(423).json({ 
        error: `Account temporarily locked. Try again in ${minutesLeft} minutes.` 
      });
    }
    
    // Check account status
    if (user.status === 'SUSPENDED') {
      await logLoginAttempt(email, user.id, false, 'account_suspended', ipAddress, userAgent);
      return res.status(403).json({ error: 'Account is suspended. Contact support.' });
    }
    
    if (user.status === 'BANNED') {
      await logLoginAttempt(email, user.id, false, 'account_banned', ipAddress, userAgent);
      return res.status(403).json({ error: 'Account is banned.' });
    }
    
    // Verify password
    const validPassword = await verifyPassword(password, user.passwordHash);
    
    if (!validPassword) {
      await handleFailedLogin(user, 'invalid_password', ipAddress);
      await logLoginAttempt(email, user.id, false, 'invalid_password', ipAddress, userAgent);
      await simulateDelay();
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check email verification
    if (user.status === 'PENDING_EMAIL') {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in.',
        requiresEmailVerification: true,
      });
    }
    
    // Successful login
    await handleSuccessfulLogin(user, ipAddress);
    await logLoginAttempt(email, user.id, true, null, ipAddress, userAgent);
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id, ipAddress, userAgent);
    
    // Set refresh token as httpOnly cookie
    // Use SameSite=Lax in dev so the cookie is sent from the Vite dev origin (5173 → 3000)
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    res.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

// Refresh access token
export async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';
    
    const result = await verifyAndRotateRefreshToken(refreshToken, ipAddress, userAgent);
    
    // Set new refresh token cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    
    res.json({
      success: true,
      accessToken: result.accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
        status: result.user.status,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.clearCookie('refreshToken');
    res.status(401).json({ error: error.message || 'Token refresh failed' });
  }
}

// Logout
export async function logout(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Revoke refresh token
      await db.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.token, refreshToken));
    }
    
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

// Request password reset
export async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;
    
    const userRecord = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    
    // Always return success to prevent email enumeration
    if (!userRecord.length) {
      await simulateDelay();
      return res.json({ 
        success: true, 
        message: 'If that email exists, a password reset link has been sent.' 
      });
    }
    
    const user = userRecord[0];
    
    // Generate reset token
    const resetToken = generateVerificationToken();
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1); // 1 hour expiry
    
    await db.update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    
    // TODO: Send password reset email
    // await sendPasswordResetEmail(user.email, resetToken);
    
    res.json({ 
      success: true, 
      message: 'If that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Password reset request failed' });
  }
}

// Reset password
export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    
    const userRecord = await db.select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);
    
    if (!userRecord.length) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }
    
    const user = userRecord[0];
    
    // Check if token is expired
    if (new Date() > new Date(user.passwordResetExpiry)) {
      return res.status(400).json({ error: 'Reset token expired' });
    }
    
    // Hash new password
    let newPasswordHash;
    try {
      newPasswordHash = await hashPassword(newPassword);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Update password and clear reset token
    await db.update(users)
      .set({
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    
    // Revoke all refresh tokens (force re-login on all devices)
    await db.update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, user.id));
    
    res.json({ 
      success: true, 
      message: 'Password reset successfully. Please log in with your new password.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
}

// Get current user profile
export async function getProfile(req, res) {
  try {
    const userId = req.user.userId;
    
    const userRecord = await db.select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      mfaEnabled: users.mfaEnabled,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
    
    if (!userRecord.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user: userRecord[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}
