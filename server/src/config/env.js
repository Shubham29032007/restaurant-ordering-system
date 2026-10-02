'use strict';
const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'QR_JWT_SECRET'];
function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error('[ENV] Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}
module.exports = validateEnv;