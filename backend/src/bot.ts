import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import { ENV } from './env.js';

export const bot = new Bot(ENV.BOT_TOKEN || '0:placeholder');

bot.command('start', async ctx => {
  const refPayload = ctx.match?.trim();
  const url = new URL(ENV.WEBAPP_URL);
  if (refPayload) url.searchParams.set('ref', refPayload);

  const kb = new InlineKeyboard().webApp('🍎 Играть', url.toString());
  await ctx.reply('Добро пожаловать в Tap Fruit! 🍎\nТапай яблоко, покупай скины, качайся.', {
    reply_markup: kb,
  });
});

export function buildReferralLink(tgId: bigint): string {
  const username = (bot as any)?.botInfo?.username ?? 'YourBot';
  return `https://t.me/${username}?start=${tgId.toString()}`;
}

// Express-хендлер для вебхука. Работает даже без bot.init() —
// grammY сам инициализируется при первом апдейте.
export const botWebhook = webhookCallback(bot, 'express');