import 'dotenv/config';

export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  BOT_TOKEN: process.env.BOT_TOKEN ?? '',
  WEBAPP_URL: process.env.WEBAPP_URL ?? 'http://localhost:5173',
  PUBLIC_BACKEND_URL: process.env.PUBLIC_BACKEND_URL ?? 'http://localhost:4000',
  PORT: Number(process.env.PORT || 4000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
};