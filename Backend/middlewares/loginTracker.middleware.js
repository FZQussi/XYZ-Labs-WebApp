// ===================================================================
// loginTracker.middleware.js
// In-memory account lockout after N consecutive failed login attempts.
// Blocks both by IP and by account (email/username).
// ===================================================================

const MAX_ATTEMPTS = 5;           // lock after 5 consecutive failures
const LOCK_WINDOW_MS = 15 * 60 * 1000; // 15-minute window
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15-minute lockout

// Maps: key → { count, firstAttempt, lockedUntil }
const attempts = new Map();

// ─── Cleanup stale entries every 30 minutes ─────────────────────────
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of attempts.entries()) {
        if (data.lockedUntil && now > data.lockedUntil) {
            attempts.delete(key);
        } else if (!data.lockedUntil && now - data.firstAttempt > LOCK_WINDOW_MS) {
            attempts.delete(key);
        }
    }
}, 30 * 60 * 1000);

// ─── Record a failed attempt ─────────────────────────────────────────
function recordFailure(key) {
    const now = Date.now();
    const current = attempts.get(key) || { count: 0, firstAttempt: now, lockedUntil: null };

    // If window has expired, reset
    if (!current.lockedUntil && now - current.firstAttempt > LOCK_WINDOW_MS) {
        current.count = 0;
        current.firstAttempt = now;
    }

    current.count += 1;

    if (current.count >= MAX_ATTEMPTS) {
        current.lockedUntil = now + LOCK_DURATION_MS;
    }

    attempts.set(key, current);
    return current;
}

// ─── Clear attempts after a successful login ─────────────────────────
function clearAttempts(key) {
    attempts.delete(key);
}

// ─── Check if a key is currently locked ─────────────────────────────
function isLocked(key) {
    const data = attempts.get(key);
    if (!data || !data.lockedUntil) return false;
    if (Date.now() > data.lockedUntil) {
        attempts.delete(key);
        return false;
    }
    return true;
}

// ─── Get remaining lockout time in seconds ───────────────────────────
function getRemainingSeconds(key) {
    const data = attempts.get(key);
    if (!data || !data.lockedUntil) return 0;
    return Math.ceil((data.lockedUntil - Date.now()) / 1000);
}

module.exports = { recordFailure, clearAttempts, isLocked, getRemainingSeconds };
