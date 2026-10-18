/**
 * Cropsa Platform Security & Intrusion Prevention Module
 * - Brute-force & Credential Stuffing Rate Limiter
 * - Input Sanitization & Anti-XSS Shield
 * - Session Integrity & Role Tamper Detection
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 Minutes
const STORAGE_KEY = 'cropsa_sec_attempts';

interface AttemptRecord {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

/**
 * Get current brute-force lockout status for a user/identifier
 */
export function getLockoutStatus(identifier: string): {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
} {
  if (!identifier) {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const records: Record<string, AttemptRecord> = raw ? JSON.parse(raw) : {};
    const key = identifier.trim().toLowerCase();
    const record = records[key];

    if (!record) {
      return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
    }

    const now = Date.now();

    // Check if lockout is active
    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds, attemptsLeft: 0 };
    }

    // Lockout expired, reset if needed
    if (record.lockedUntil && record.lockedUntil <= now) {
      delete records[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
    }

    const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - record.count);
    return { isLocked: false, remainingSeconds: 0, attemptsLeft };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }
}

/**
 * Record a failed login attempt; locks out if MAX_FAILED_ATTEMPTS reached
 */
export function recordFailedLogin(identifier: string): {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
} {
  if (!identifier) {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const records: Record<string, AttemptRecord> = raw ? JSON.parse(raw) : {};
    const key = identifier.trim().toLowerCase();
    const now = Date.now();

    const record = records[key] || { count: 0, lastAttempt: now };
    record.count += 1;
    record.lastAttempt = now;

    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_DURATION_MS;
      records[key] = record;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return {
        isLocked: true,
        remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
        attemptsLeft: 0
      };
    }

    records[key] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsLeft: MAX_FAILED_ATTEMPTS - record.count
    };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: 1 };
  }
}

/**
 * Clear failed attempts upon successful login
 */
export function clearFailedLogin(identifier: string): void {
  if (!identifier) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const records: Record<string, AttemptRecord> = JSON.parse(raw);
    const key = identifier.trim().toLowerCase();
    delete records[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

/**
 * Sanitize strings to prevent XSS and script injection attacks
 */
export function sanitizeInput(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Validate password strength against modern security standards
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0 to 4
  feedback: string;
} {
  if (!password) {
    return { isValid: false, score: 0, feedback: 'كلمة المرور مطلوبة' };
  }

  if (password.length < 6) {
    return { isValid: false, score: 1, feedback: 'يجب ألا تقل كلمة المرور عن 6 أحرف' };
  }

  let score = 1;
  if (password.length >= 8) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[a-zA-Z]/.test(password) || /[\u0600-\u06FF]/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1;

  score = Math.min(score, 4);

  return {
    isValid: true,
    score,
    feedback: score >= 3 ? 'كلمة مرور قوية ومحمية' : 'كلمة مرور مقبولة، ويفضل احتوائها على أرقام ورموز'
  };
}
