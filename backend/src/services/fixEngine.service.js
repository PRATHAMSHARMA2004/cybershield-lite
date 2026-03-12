const fixes = require("../rules/securityFixes");
const logger = require("../utils/logger");

// ─────────────────────────────────
// Cache for repeated lookups
// ─────────────────────────────────
const fixCache = new Map();

/**
 * Normalize vulnerability title to cache key
 * @param {string} title
 * @returns {string}
 */
function normalizeKey(title) {
  if (!title) return "";
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
}

/**
 * Find similar fix key by fuzzy matching
 * Fallback when exact match not found
 * @param {string} normalizedKey
 * @returns {string|null}
 */
function findSimilarFix(normalizedKey) {
  const fixKeys = Object.keys(fixes);

  // Simple similarity: substring match or common keywords
  for (const key of fixKeys) {
    // Check if either string contains the other
    if (
      key.includes(normalizedKey) ||
      normalizedKey.includes(key)
    ) {
      return key;
    }

    // Check common prefix (e.g., "missing_x_" prefix)
    if (key.startsWith(normalizedKey.split("_")[0])) {
      return key;
    }
  }

  return null;
}

/**
 * Get local fix for vulnerability
 * Checks: exact match → similar match → null
 * @param {string} vulnerabilityTitle
 * @returns {object|null} { description, fix }
 */
function getLocalFix(vulnerabilityTitle) {
  if (!vulnerabilityTitle) return null;

  const normalizedKey = normalizeKey(vulnerabilityTitle);

  // Check cache first
  if (fixCache.has(normalizedKey)) {
    logger.debug(`Fix cache hit for: ${vulnerabilityTitle}`);
    return fixCache.get(normalizedKey);
  }

  // Try exact match
  if (fixes[normalizedKey]) {
    fixCache.set(normalizedKey, fixes[normalizedKey]);
    logger.debug(`Exact fix match for: ${vulnerabilityTitle}`);
    return fixes[normalizedKey];
  }

  // Try fuzzy match (fallback)
  const similarKey = findSimilarFix(normalizedKey);
  if (similarKey && fixes[similarKey]) {
    fixCache.set(normalizedKey, fixes[similarKey]);
    logger.debug(`Fuzzy fix match for: ${vulnerabilityTitle} → ${similarKey}`);
    return fixes[similarKey];
  }

  // No match found
  logger.debug(`No local fix found for: ${vulnerabilityTitle}`);
  return null;
}

/**
 * Get cache stats for debugging
 * @returns {object}
 */
function getCacheStats() {
  return {
    cachedLookups: fixCache.size,
    totalFixRules: Object.keys(fixes).length,
    cacheHitRate: fixCache.size > 0 ? "enabled" : "empty"
  };
}

module.exports = { getLocalFix, getCacheStats };