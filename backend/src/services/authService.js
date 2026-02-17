import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import process from 'process';
import { db } from '../db/connection.js';
import { users, refreshTokens, loginAuditLog } from '../db/schema/index.js';
import { eq, and, lt } from 'drizzle-orm';
import { logAuthFailure } from '../observability.js';

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const MAX_SESSIONS_PER_USER = 3;

// Password strength validation
export function validatePasswordStrength(password) {
  const errors = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return errors;
}

// Hash password
export async function hashPassword(password) {
  const errors = validatePasswordStrength(password);
  if (errors.length > 0) {
    throw new Error(errors.join('. '));
  }
  
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Verify password with constant-time comparison
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Generate JWT access token
export function generateAccessToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'laptop-platform',
    audience: 'laptop-platform-api',
  });
}

// Generate refresh token
export async function generateRefreshToken(userId, ipAddress, userAgent) {
  const token = crypto.randomBytes(64).toString('hex');
  const familyId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  
  // Limit active sessions per user
  const existingTokens = await db.select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.revokedAt, null),
        lt(refreshTokens.expiresAt, new Date())
      )
    );
  
  // Revoke oldest tokens if limit exceeded
  if (existingTokens.length >= MAX_SESSIONS_PER_USER) {
    const oldestTokens = existingTokens
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, existingTokens.length - MAX_SESSIONS_PER_USER + 1);
    
    for (const oldToken of oldestTokens) {
      await db.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, oldToken.id));
    }
  }
  
  await db.insert(refreshTokens).values({
    userId,
    token,
    familyId,
    expiresAt,
    ipAddress,
    userAgent,
  });
  
  return token;
}

// Verify JWT access token
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'laptop-platform',
      audience: 'laptop-platform-api',
    });
  } catch (error) {
    return null;
  }
}

// Verify and rotate refresh token
export async function verifyAndRotateRefreshToken(token, ipAddress, userAgent) {
  const tokenRecord = await db.select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token))
    .limit(1);
  
  if (!tokenRecord.length) {
    throw new Error('Invalid refresh token');
  }
  
  const refreshToken = tokenRecord[0];
  
  // Check if token is revoked
  if (refreshToken.revokedAt) {
    // Token reuse detected - revoke entire family
    await db.update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.familyId, refreshToken.familyId));
    
    throw new Error('Token reuse detected - all sessions revoked');
  }
  
  // Check if token is expired
  if (new Date() > new Date(refreshToken.expiresAt)) {
    throw new Error('Refresh token expired');
  }
  
  // Get user
  const userRecord = await db.select()
    .from(users)
    .where(eq(users.id, refreshToken.userId))
    .limit(1);
  
  if (!userRecord.length) {
    throw new Error('User not found');
  }
  
  const user = userRecord[0];
  
  // Check account status
  if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
    throw new Error('Account is not active');
  }
  
  // Generate new tokens
  const newRefreshToken = crypto.randomBytes(64).toString('hex');
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  // Create new token in same family and capture its id (uuid)
  const [newTokenRow] = await db.insert(refreshTokens).values({
    userId: user.id,
    token: newRefreshToken,
    familyId: refreshToken.familyId, // Same family for rotation tracking
    expiresAt: newExpiresAt,
    ipAddress,
    userAgent,
  }).returning({ id: refreshTokens.id });

  // Revoke old token and link to the new token by id (uuid)
  await db.update(refreshTokens)
    .set({ 
      revokedAt: new Date(),
      replacedBy: newTokenRow.id,
    })
    .where(eq(refreshTokens.id, refreshToken.id));
  
  return {
    user,
    accessToken: generateAccessToken(user),
    refreshToken: newRefreshToken,
  };
}

// Log login attempt
export async function logLoginAttempt(email, userId, success, failureReason, ipAddress, userAgent) {
  await db.insert(loginAuditLog).values({
    userId,
    email,
    success,
    failureReason,
    ipAddress,
    userAgent,
  });
}

// Handle failed login attempt
export async function handleFailedLogin(user, reason, ipAddress) {
  const attempts = user.failedLoginAttempts + 1;
  const updateData = {
    failedLoginAttempts: attempts,
    updatedAt: new Date(),
  };
  
  // Lock account if max attempts exceeded
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
  }
  
  await db.update(users)
    .set(updateData)
    .where(eq(users.id, user.id));
  
  logAuthFailure({
    userId: user.id,
    email: user.email,
    reason,
    attempts,
    ip: ipAddress,
    locked: attempts >= MAX_LOGIN_ATTEMPTS,
  });
}

// Handle successful login
export async function handleSuccessfulLogin(user, ipAddress) {
  await db.update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
}

// Generate email verification token
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Timing attack mitigation
export function simulateDelay() {
  return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
}

// Validate Ghana phone number
export function validateGhanaPhone(phone) {
  // Ghana format: +233 XXX XXX XXXX or 0XX XXX XXXX
  const ghanaPhoneRegex = /^(\+233|0)[2-5][0-9]{8}$/;
  const cleaned = phone.replace(/\s/g, '');
  return ghanaPhoneRegex.test(cleaned);
}

// Normalize Ghana phone to international format
export function normalizeGhanaPhone(phone) {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('0')) {
    return '+233' + cleaned.substring(1);
  }
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
}
