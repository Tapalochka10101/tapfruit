import { Bot, InlineKeyboard, webhookCallback, InputFile } from 'grammy';
import { ENV } from './env.js';
// // import { prisma } from './lib/prisma.js'; // TEMP // TEMP

export const bot = new Bot(ENV.BOT_TOKEN || '0:placeholder');

/** Множество user-id, которые сейчас вводят свою сумму. */
const pendingCustomAmount = new Set<number>();

/** Главное меню. */
function mainMenu() {
  return new InlineKeyboard()
    .text('💰 БАЛАНС', 'balance')
    .row()
    .text('📅 ПОДПИСКА', 'subscription')
    .webApp('🍎 ИГРАТЬ', `https://t.me/TapFruit_bot/play`);
}

/** Меню "Тарифы" (первый экран БАЛАНСА). */
function tariffMenu() {
  return new InlineKeyboard()
    .text('💳 ПОПОЛНИТЬ', 'topup')
    .row()
    .text('⬅️ НАЗАД', 'menu');
}

/** Меню "Выберите сумму". */
function amountMenu() {
  return new InlineKeyboard()
    .text('100₽', 'amount_100')
    .text('Своя сумма', 'amount_custom')
    .row()
    .text('⬅️ НАЗАД К БАЛАНСУ', 'balance');
}

/** Меню "Оплата СБП". */
function payMenu(amountRub: number) {
  return new InlineKeyboard()
    .text('📱 СБП +8,5%', `pay_sbp_${amountRub}`)
    .row()
    .text('⬅️ НАЗАД', 'topup');
}

const TXT = {
  tariff:
    '💳 <b>Тарифы</b>\n\n' +
    '100₽ = 3 дня доступа\n' +
    '500₽ = 15 дней доступа\n' +
    '1000₽ = 30 дней доступа\n\n' +
    'Баланс единый. Средства списываются раз в 3 дня за активную подписку.',
  amount: '💰 <b>Выберите сумму пополнения</b>',
  customAsk:
    '✏️ <b>Введите сумму платежа в рублях от 50₽</b>\n\n' +
    'Напиши число сообщением (например: 200)',
  customTooLow: '❌ Минимальная сумма пополнения — 50₽. Попробуйте ещё раз.',
};

/** /start */
bot.command('start', async ctx => {
  try {
    await ctx.reply(
      '🍎 <b>Tap Fruit</b>\n\nВыбери действие:',
      { reply_markup: mainMenu(), parse_mode: 'HTML' },
    );
  } catch (e) {
    console.error('[start] error:', e);
  }
});

/** Кнопка БАЛАНС → тарифы. */
bot.callbackQuery('balance', async ctx => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(TXT.tariff, {
    reply_markup: tariffMenu(),
    parse_mode: 'HTML',
  });
});

/** Кнопка НАЗАД → главное меню. */
bot.callbackQuery('menu', async ctx => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText('🍎 <b>Tap Fruit</b>\n\nВыбери действие:', {
    reply_markup: mainMenu(),
    parse_mode: 'HTML',
  });
});

/** Кнопка ПОПОЛНИТЬ → выбор суммы. */
bot.callbackQuery('topup', async ctx => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(TXT.amount, {
    reply_markup: amountMenu(),
    parse_mode: 'HTML',
  });
});

/** Кнопка 100₽ → сразу к оплате. */
bot.callbackQuery('amount_100', async ctx => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `📱 <b>К оплате: 100₽</b>\n\nВыберите способ оплаты:`,
    { reply_markup: payMenu(100), parse_mode: 'HTML' },
  );
});

/** Кнопка Своя сумма → ждём текст. */
bot.callbackQuery('amount_custom', async ctx => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(TXT.customAsk, {
    reply_markup: new InlineKeyboard().text('⬅️ НАЗАД', 'topup'),
    parse_mode: 'HTML',
  });
  // Запоминаем, что ждём ввод от этого юзера
  pendingCustomAmount.add(ctx.from.id);
});

/** Кнопка СБП → заглушка. */
bot.callbackQuery(/^pay_sbp_(\d+)$/, async ctx => {
  await ctx.answerCallbackQuery();
  const amount = ctx.match[1];
  await ctx.editMessageText(
    `✅ <b>Платёж на ${amount}₽ создан</b>\n\n` +
    'Оплата по СБП будет подключена в ближайшее время.\n' +
    'Пока — заглушка.',
    { reply_markup: payMenu(Number(amount)), parse_mode: 'HTML' },
  );
});

/** Кнопка ПОДПИСКА → инфо. */
bot.callbackQuery('subscription', async ctx => {
  const tgId = BigInt(ctx.from.id);
  const user = null; // TEMP
  await ctx.answerCallbackQuery();

  if (!user) {
    await ctx.editMessageText('Нажми /start чтобы создать аккаунт');
    return;
  }

  const balanceRub = Number(user.balanceRub) / 100;
  const daysLeft = user.subscriptionUntil
    ? Math.max(0, Math.ceil((user.subscriptionUntil.getTime() - Date.now()) / 86400000))
    : 0;

  const text = daysLeft > 0
    ? `✅ <b>У вас активна подписка</b>\n\n` +
      `🍎 Можете играть спокойно!\n\n` +
      `💰 Баланс: ${balanceRub.toFixed(2)}₽\n` +
      `📅 Осталось дней: ${daysLeft}\n\n` +
      `Средства списываются раз в 3 дня за активную подписку.`
    : `⚠️ <b>Подписка неактивна</b>\n\n` +
      `💰 Баланс: ${balanceRub.toFixed(2)}₽\n\n` +
      `Пополните баланс, чтобы играть.`;

  await ctx.editMessageText(text, {
    reply_markup: new InlineKeyboard().text('⬅️ НАЗАД', 'menu'),
    parse_mode: 'HTML',
  });
});


/** Обработка текстовых сообщений — только для тех, кто в pendingCustomAmount. */
bot.on('message:text', async ctx => {
  if (!ctx.from) return;
  if (!pendingCustomAmount.has(ctx.from.id)) return;

  const text = ctx.message.text.trim();
  const rub = Number(text);

  if (!Number.isFinite(rub) || rub < 50) {
    await ctx.reply(TXT.customTooLow, {
      reply_markup: new InlineKeyboard().text('⬅️ НАЗАД', 'topup'),
      parse_mode: 'HTML',
    });
    return;
  }

  pendingCustomAmount.delete(ctx.from.id);
  await ctx.reply(
    `📱 <b>К оплате: ${rub}₽</b>\n\nВыберите способ оплаты:`,
    { reply_markup: payMenu(rub), parse_mode: 'HTML' },
  );
});

export function buildReferralLink(tgId: bigint): string {
  const username = (bot as any)?.botInfo?.username ?? 'YourBot';
  return `https://t.me/${username}?start=${tgId.toString()}`;
}

bot.catch(err => {
  console.error('[bot] error:', err.error);
});

import type { Request, Response, NextFunction } from 'express';

const grammyWebhook = webhookCallback(bot, 'express', {
  timeoutMilliseconds: 10000,
  onTimeout: 'return',
});

export async function botWebhook(req: Request, res: Response, _next: NextFunction) {
  try {
    await grammyWebhook(req, res);
    if (!res.headersSent) {
      res.sendStatus(200);
    }
  } catch (err) {
    console.error('[webhook] error:', err);
    if (!res.headersSent) {
      res.sendStatus(200);
    }
  }
}
