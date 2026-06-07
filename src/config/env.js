import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 3001),
  apiToken: process.env.BOT_API_TOKEN,
  adminPin: process.env.ADMIN_PIN || '',
  sessionDir: process.env.SESSION_DIR || './auth/pits-dog',
  botName: process.env.PUBLIC_BOT_NAME || 'Pits Dog',
  countryCode: process.env.WHATSAPP_COUNTRY_CODE || '55',
  messageIntervalMs: Number(process.env.MESSAGE_INTERVAL_MS || 1200),
  storePhone: process.env.STORE_PHONE || '',
  adminOrigin: process.env.ADMIN_ORIGIN || '*',
};
