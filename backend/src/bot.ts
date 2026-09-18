import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import { ENV } from './env.js';
import { prisma } from './lib/prisma.js';

export const bot = new Bot(ENV.BOT_TOKEN || '0:placeholder');

bot.command('start', async ctx => {
  const refPayload = ctx.match?.trim();
  const url = new URL(ENV.WEBAPP_URL);
  if (refPayload) url.searchParams.set('startapp', `ref_${refPayload}`);

  await ctx.reply(
    'Добро пожаловать в Tap Fruit! 🍎\n\nНажми 📋 МЕНЮ, чтобы открыть меню.',
    { reply_markup: menuKeyboard() },
  );
});

/** Inline-клавиатура с 3 кнопками. */
function menuKeyboard() {
  const url = new URL(ENV.WEBAPP_URL);
  return new InlineKeyboard()
    .webApp('💰 БАЛАНС', `${url.toString()}?startapp=topup`)
    .row()
    .text('📅 ПОДПИСКА', 'subscription')
    .webApp('🍎 ИГРАТЬ', url.toString());
}

/** Кнопка МЕНЮ (reply) — просто показывает меню. */
bot.hears(['📋 МЕНЮ', 'МЕНЮ', 'Меню'], async ctx => {
  await ctx.reply('Выбери действие:', { reply_markup: menuKeyboard() });
});

/** Показать подписку. */
bot.callbackQuery('subscription', async ctx => {
  const tgId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { tgId } });

  if (!user) {
    await ctx.answerCallbackQuery({ text: 'Нажми /start' });
    return;
  }

  const balanceRub = Number(user.balanceRub) / 100;
  const daysLeft = user.subscriptionUntil
    ? Math.max(0, Math.ceil((user.subscriptionUntil.getTime() - Date.now()) / 86400000))
    : 0;

  const text = [
    daysLeft > 0
      ? `✅ У вас активна подписка\n\n🍎 Можете играть спокойно!`
      : `⚠️ Подписка неактивна`,
    '',
    `💰 Баланс: ${balanceRub.toFixed(2)}₽`,
    daysLeft > 0 ? `📅 Осталось дней: ${daysLeft}` : '',
    '',
    'Средства списываются раз в 3 дня за активную подписку.',
  ].filter(Boolean).join('\n');

  await ctx.answerCallbackQuery();
  await ctx.reply(text, { reply_markup: menuKeyboard() });
});

export function buildReferralLink(tgId: bigint): string {
  const username = (bot as any)?.botInfo?.username ?? 'YourBot';
  return `https://t.me/${username}?start=${tgId.toString()}`;
}

export const botWebhook = webhookCallback(bot, 'express');
