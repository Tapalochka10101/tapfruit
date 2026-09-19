import { ENV } from './env.js';
import './lib/serialize.js';
import { prisma } from './lib/prisma.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const hasBot = ENV.BOT_TOKEN && ENV.BOT_TOKEN.includes(':') && !ENV.BOT_TOKEN.startsWith('PASTE');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
import cors from 'cors';
import { authMiddleware } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { tapRouter } from './routes/tap.js';
import { shopRouter } from './routes/shop.js';
import { skinsRouter } from './routes/skins.js';
import { settingsRouter } from './routes/settings.js';
import { walletRouter } from './routes/wallet.js';
import { minigamesRouter } from './routes/minigames.js';
import { generatorsRouter } from './routes/generators.js';
import { promosRouter } from './routes/promos.js';
import { referralsRouter } from './routes/referrals.js';
import { dailyRouter } from './routes/daily.js';
import { adminRouter } from './routes/admin.js';
import { bot, buildReferralLink, botWebhook } from './bot.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/admin-panel', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin.html')));
app.post('/telegram/webhook', botWebhook);
app.post('/api/wallet/webhook', async (_req, res) => { res.json({ ok: true }); });

const api = express.Router();
api.use('/admin', adminRouter);
api.use(authMiddleware);
api.use(authRouter);
api.use(tapRouter);
api.use(shopRouter);
api.use(skinsRouter);
api.use(settingsRouter);
api.use(walletRouter);
api.use(minigamesRouter);
api.use(generatorsRouter);
api.use(promosRouter);
api.use(referralsRouter);
api.use(dailyRouter);
api.get('/referral', (req, res) => { res.json({ url: buildReferralLink(req.tgId!) }); });
app.use('/api', api);

(async () => {
  if (hasBot) {
    try {
      const webhookUrl = `${ENV.PUBLIC_BACKEND_URL}/telegram/webhook`;
      await bot.api.setWebhook(webhookUrl);
      console.log('[bot] webhook set:', webhookUrl);
      await bot.init();
      console.log('[bot] ready:', bot.botInfo.username);
    } catch (e) {
      console.warn('[bot] init failed:', (e as Error).message);
    }
  } else {
    console.log('[bot] skipped (no BOT_TOKEN)');
  }

  app.listen(ENV.PORT, '0.0.0.0', () =>
    console.log(`[http] listening on port ${ENV.PORT}`)
  );
})();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaught]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandled]', reason);
});
