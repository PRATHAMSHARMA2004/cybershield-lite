/**
 * Validates all required environment variables before the server starts.
 * Exits with a clear message if anything critical is missing.
 * Warns loudly (but doesn't exit) for production misconfigurations.
 */

const REQUIRED_VARS = [
  {
    key:  'MONGO_URI',
    hint: 'MongoDB connection string. Example: mongodb://localhost:27017/cybershield',
  },
  {
    key:  'JWT_SECRET',
    hint: 'Long random string. Generate: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"',
  },
];

const OPTIONAL_VARS = [
  { key: 'PORT',                default: '5000'                  },
  { key: 'NODE_ENV',            default: 'development'           },
  { key: 'SCANNER_SERVICE_URL', default: 'http://localhost:8000' },
  { key: 'CLIENT_URL',          default: 'http://localhost:3000' },
  { key: 'JWT_EXPIRES_IN',      default: '7d'                    },
];

function validateEnv() {
  // ── 1. Hard failures — server cannot start ──────────────────────────────────
  const missing = REQUIRED_VARS.filter(({ key }) => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n❌  Server cannot start — missing required environment variables:\n');
    missing.forEach(({ key, hint }) => {
      console.error(`  • ${key}`);
      console.error(`    → ${hint}\n`);
    });
    console.error('  Copy backend/.env.example → backend/.env and fill in values.\n');
    process.exit(1);
  }

  // ── 2. Apply defaults for optional vars ────────────────────────────────────
  for (const { key, default: defaultVal } of OPTIONAL_VARS) {
    if (!process.env[key]) {
      process.env[key] = defaultVal;
    }
  }

  // ── 3. Production safety warnings — wrong values won't crash but will break ─
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // NODE_ENV was not set to 'production' — warn if it looks like a real server
    // (i.e. MONGO_URI points to Atlas, not localhost)
    const isAtlas = process.env.MONGO_URI.includes('mongodb+srv');
    if (isAtlas) {
      console.warn('\n⚠️   WARNING: MONGO_URI points to MongoDB Atlas but NODE_ENV is not "production".');
      console.warn('    Set NODE_ENV=production in your hosting dashboard.\n');
      console.warn('    Without this:');
      console.warn('      • Logs will be human-readable instead of JSON');
      console.warn('      • Stack traces may leak in API error responses');
      console.warn('      • File log rotation is disabled\n');
    }
  }

  if (isProd) {
    // CLIENT_URL must not be localhost in production
    if (process.env.CLIENT_URL.includes('localhost')) {
      console.error('\n❌  CORS misconfiguration: CLIENT_URL is set to localhost in production.');
      console.error(`    Current value: ${process.env.CLIENT_URL}`);
      console.error('    Set CLIENT_URL=https://your-frontend-domain.com in your hosting dashboard.\n');
      console.error('    This will cause CORS errors in your deployed frontend.\n');
      process.exit(1);  // Hard exit — this WILL break production silently if not caught
    }

    // SCANNER_SERVICE_URL must not be localhost in production
    if (process.env.SCANNER_SERVICE_URL.includes('localhost')) {
      console.warn('\n⚠️   WARNING: SCANNER_SERVICE_URL points to localhost in production.');
      console.warn(`    Current value: ${process.env.SCANNER_SERVICE_URL}`);
      console.warn('    Scans will fail unless the scanner runs on the same machine.\n');
    }
  }
}

module.exports = validateEnv;
