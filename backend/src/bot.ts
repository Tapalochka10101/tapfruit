import { Bot, InlineKeyboard, Keyboard, webhookCallback } from 'grammy';
import { ENV } from './env.js';
import { prisma } from './lib/prisma.js';

export const bot = new Bot(ENV.BOT_TOKEN || '0:placeholder');

const replyKb = new Keyboard().text('💰 Баланс').resized();

bot.command('start', async ctx => {
  const refPayload = ctx.match?.trim();
  const url = new URL(ENV.WEBAPP_URL);
  if (refPayload) url.searchParams.set('startapp', `ref_${refPayload}`);

  const kb = new InlineKeyboard().webApp('🍎 Играть', url.toString());
  await ctx.reply(
    'Добро пожаловать в Tap Fruit! 🍎\nТапай яблоко, покупай скины, качайся.',
    { reply_markup: kb },
  );
  await ctx.reply('Меню:', { reply_markup: replyKb });
});

bot.hears('💰 Баланс', async ctx => {
  if (!ctx.from) return;
  const tgId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { tgId } });

  if (!user) {
    await ctx.reply('Нажми /start чтобы создать аккаунт');
    return;
  }

  const balanceRub = Number(user.balanceRub) / 100;
  const daysLeft = user.subscriptionUntil
    ? Math.max(0, Math.ceil((user.subscriptionUntil.getTime() - Date.now()) / 86400000))
    : 0;

  const daysFromBalance = Math.floor((balanceRub / 100) * 3);

  const lines = [
    '💳 Кошелёк',
    `💰 Текущий баланс: ${balanceRub.toFixed(2)}₽`,
    `📉 Расход: 100₽ / 3 дня (вашего баланса хватит ровно на ${daysFromBalance} ${pluralDays(daysFromBalance)})`,
    '',
    'Баланс единый. Средства списываются раз в 3 дня за активную подписку на игру.',
    daysLeft > 0 ? `\n✅ Подписка активна ещё ${daysLeft} ${pluralDays(daysLeft)}` : '\n⚠️ Подписка неактивна',
  ];

  const kb = new InlineKeyboard().webApp('💳 ПОПОЛНИТЬ', `${ENV.WEBAPP_URL}?topup=1`);
  await ctx.reply(lines.join('\n'), { reply_markup: kb });
});

function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня';
  return 'дней';
}

export function buildReferralLink(tgId: bigint): string {
  const username = (bot as any)?.botInfo?.username ?? 'YourBot';
  return `https://t.me/${username}?start=${tgId.toString()}`;
}

export const botWebhook = webhookCallback(bot, 'express');
