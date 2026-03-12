const logger = require("../utils/logger");

// ─────────────────────────────────
// In-Memory Cache for AI Responses
// ─────────────────────────────────
const responseCache = new Map();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour cleanup

// ─────────────────────────────────
// Per-User Rate Limiting
// ─────────────────────────────────
const userAIUsage = new Map();
const AI_CALL_LIMIT = 20; // Max AI calls per day
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Clean up expired cache entries
 */
function cleanupExpiredCache() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      responseCache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug(`Cleaned up ${cleaned} expired AI cache entries`);
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredCache, CACHE_CHECK_INTERVAL);

/**
 * Get cached AI response
 * @param {string} vulnerabilityTitle
 * @returns {string|null}
 */
function getCachedResponse(vulnerabilityTitle) {
  const key = vulnerabilityTitle.toLowerCase().trim();
  const entry = responseCache.get(key);

  if (!entry) return null;

  // Check if cache expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }

  logger.debug(`Cache hit for: ${vulnerabilityTitle}`);
  return entry.response;
}

/**
 * Cache AI response
 * @param {string} vulnerabilityTitle
 * @param {string} response
 */
function cacheResponse(vulnerabilityTitle, response) {
  if (!response) return;

  const key = vulnerabilityTitle.toLowerCase().trim();
  responseCache.set(key, {
    response,
    timestamp: Date.now()
  });

  logger.debug(`Cached AI response for: ${vulnerabilityTitle}`);
}

/**
 * Reset user's daily AI usage
 * @param {string} userId
 */
function resetDailyUsage(userId) {
  if (userAIUsage.has(userId)) {
    const usage = userAIUsage.get(userId);
    const now = Date.now();

    // If window has passed, reset
    if (now - usage.windowStart > RATE_LIMIT_WINDOW) {
      usage.count = 0;
      usage.windowStart = now;
    }
  }
}

/**
 * Check if user can make AI call (rate limit)
 * @param {string} userId
 * @returns {object} { allowed: boolean, remaining?: number, message?: string }
 */
function checkAIRateLimit(userId) {
  if (!userId) {
    return { allowed: false, message: "User ID required" };
  }

  let usage = userAIUsage.get(userId);

  if (!usage) {
    usage = { count: 0, windowStart: Date.now() };
    userAIUsage.set(userId, usage);
  }

  const now = Date.now();

  // Reset if window expired
  if (now - usage.windowStart > RATE_LIMIT_WINDOW) {
    usage.count = 0;
    usage.windowStart = now;
  }

  if (usage.count >= AI_CALL_LIMIT) {
    const resetTime = new Date(usage.windowStart + RATE_LIMIT_WINDOW);
    return {
      allowed: false,
      message: `AI limit reached (${AI_CALL_LIMIT}/day). Resets at ${resetTime.toLocaleTimeString()}`
    };
  }

  return {
    allowed: true,
    remaining: AI_CALL_LIMIT - usage.count
  };
}

/**
 * Increment user's AI call count
 * @param {string} userId
 */
function incrementAIUsage(userId) {
  if (!userId) return;

  let usage = userAIUsage.get(userId);
  if (!usage) {
    usage = { count: 0, windowStart: Date.now() };
    userAIUsage.set(userId, usage);
  }

  usage.count += 1;
  logger.debug(`User ${userId} AI usage: ${usage.count}/${AI_CALL_LIMIT}`);
}

/**
 * Get user's remaining AI calls for today
 * @param {string} userId
 * @returns {number}
 */
function getRemainingAICalls(userId) {
  if (!userId) return 0;

  let usage = userAIUsage.get(userId);
  if (!usage) return AI_CALL_LIMIT;

  const now = Date.now();
  if (now - usage.windowStart > RATE_LIMIT_WINDOW) {
    return AI_CALL_LIMIT;
  }

  return Math.max(0, AI_CALL_LIMIT - usage.count);
}

/**
 * Get stats for debugging
 * @returns {object}
 */
function getStats() {
  return {
    cacheSize: responseCache.size,
    cachedVulnerabilities: Array.from(responseCache.keys()),
    usersTracked: userAIUsage.size,
    userStats: Array.from(userAIUsage.entries())
      .map(([userId, usage]) => ({
        userId,
        callsUsed: usage.count,
        dailyLimit: AI_CALL_LIMIT,
        remaining: Math.max(0, AI_CALL_LIMIT - usage.count)
      }))
  };
}

module.exports = {
  getCachedResponse,
  cacheResponse,
  checkAIRateLimit,
  incrementAIUsage,
  getRemainingAICalls,
  resetDailyUsage,
  getStats,
  AI_CALL_LIMIT
};
