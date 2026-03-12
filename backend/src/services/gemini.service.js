const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");

// ─────────────────────────────────
// Configuration
// ─────────────────────────────────
const GEMINI_TIMEOUT = 30000; // 30 seconds
const GEMINI_MODEL = "gemini-2.0-flash";

let genAI = null;

/**
 * Initialize Gemini API with validation
 * @returns {object} { success: boolean, error?: string }
 */
function initializeGemini() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      return {
        success: false,
        error: "GEMINI_API_KEY not configured"
      };
    }

    genAI = new GoogleGenerativeAI(apiKey);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Gemini initialization failed: ${error.message}`
    };
  }
}

/**
 * Validate vulnerability input
 * @param {string} vulnerability
 * @returns {object} { valid: boolean, error?: string }
 */
function validateInput(vulnerability) {
  if (!vulnerability || typeof vulnerability !== "string") {
    return { valid: false, error: "Vulnerability must be a non-empty string" };
  }

  if (vulnerability.trim().length === 0) {
    return { valid: false, error: "Vulnerability title cannot be empty" };
  }

  if (vulnerability.length > 500) {
    return { valid: false, error: "Vulnerability title too long (max 500 chars)" };
  }

  return { valid: true };
}

/**
 * Generate fix using Gemini AI with timeout and validation
 * @param {string} vulnerability - Vulnerability title
 * @returns {Promise<string|null>} Fix text or null on failure
 */
async function generateGeminiFix(vulnerability) {
  try {
    // Validate input
    const inputCheck = validateInput(vulnerability);
    if (!inputCheck.valid) {
      logger.warn(`Gemini input validation failed: ${inputCheck.error}`);
      return null;
    }

    // Initialize if needed
    if (!genAI) {
      const initCheck = initializeGemini();
      if (!initCheck.success) {
        logger.error(initCheck.error);
        return null;
      }
    }

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL
    });

    const prompt = `You are a cybersecurity expert. Explain how to fix this vulnerability in 200 words max:

${vulnerability}

Provide:
1. Brief explanation
2. Exact fix/solution
3. Example nginx/apache config (if applicable)

Be concise.`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Validate response
      if (!text || text.trim().length === 0) {
        logger.warn("Gemini returned empty response");
        return null;
      }

      clearTimeout(timeoutId);
      logger.debug(`Gemini fix generated for: ${vulnerability.substring(0, 50)}...`);
      return text;

    } catch (timeoutError) {
      if (timeoutError.name === "AbortError") {
        logger.warn(`Gemini API timeout (>${GEMINI_TIMEOUT}ms) for: ${vulnerability.substring(0, 50)}...`);
        return null;
      }
      throw timeoutError;
    }

  } catch (error) {
    logger.error("Gemini generation error", {
      message: error.message,
      code: error.code,
      vulnerability: vulnerability?.substring(0, 50) + "..."
    });
    return null;
  }
}

module.exports = { generateGeminiFix, initializeGemini };