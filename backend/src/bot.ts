import { Bot, InlineKeyboard } from 'grammy';
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