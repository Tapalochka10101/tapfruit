import { Bot, InlineKeyboard, webhookCallback, InputFile } from 'grammy';
import { ENV } from './env.js';
import { prisma } from './lib/prisma.js';

export const bot = new Bot(ENV.BOT_TOKEN || '0:placeholder');

/** Множество user-id, которые сейчас вводят свою сумму. */
const pendingCustomAmount = new Set<number>();

/** Главное меню. */
function mainMenu() {
  return new InlineKeyboard()
    .text('💰 БАЛАНС', 'balance')
    .row()
    .text('📅 ПОДПИСКА', 'subscription')
    .text('🍎 ИГРАТЬ', 'play')
    .row()
    .text('ℹ️ ИНФОРМАЦИЯ', 'info');
}

/** Меню с разблокированной кнопкой ИГРАТЬ (webApp). */
function mainMenuUnlocked() {
  return new InlineKeyboard()
    .text('💰 БАЛАНС', 'balance')
    .row()
    .text('📅 ПОДПИСКА', 'subscription')
    .webApp('🍎 ИГРАТЬ', 'https://frontend-sandy-eight-12.vercel.app')
    .row()
    .text('ℹ️ ИНФОРМАЦИЯ', 'info');
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
    const from = ctx.from;
    if (from) {
      await prisma.user.upsert({
        where: { tgId: BigInt(from.id) },
        update: {
          username: from.username ?? null,
          firstName: from.first_name ?? null,
        },
        create: {
          tgId: BigInt(from.id),
          username: from.username ?? null,
          firstName: from.first_name ?? null,
        },
      });
      console.log('[start] user upserted:', from.id);
    }
    await ctx.reply(
      '🍎 <b>Tap Fruit</b>\n\nВыбери действие:',
      { reply_markup: mainMenu(), parse_mode: 'HTML' },
    );
  } catch (e) {
    console.error('[start] error:', e);
  }
});

const INFO_TEXT =
  'ℹ️ <b>Информация</b>\n\n' +
  '📄 <b>Политика конфиденциальности:</b>\n' +
  'https://telegra.ph/Politika-konfidencialnosti-09-19-56\n\n' +
  '📜 <b>Пользовательское соглашение:</b>\n' +
  'https://telegra.ph/Polzovatelskoe-soglashenie-09-19-67\n\n' +
  '💬 <b>Контакты поддержки:</b>\n' +
  '@yolotag52\n\n' +
  '💵 <b>Актуальный тариф:</b>\n' +
  '100₽ = 3 дня подписки на игру';

bot.callbackQuery('info', async ctx => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(INFO_TEXT, {
    parse_mode: 'HTML',
    reply_markup: new InlineKeyboard().text('⬅️ НАЗАД', 'menu'),
    link_preview_options: { is_disabled: true },
  });
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
  await ctx.answerCallbackQuery();
  if (!ctx.from) return;
  const user = await prisma.user.findUnique({
    where: { tgId: BigInt(ctx.from.id) },
  });
  if (!user) {
    await ctx.editMessageText('Нажми /start чтобы создать аккаунт');
    return;
  }
  const until = user.subscriptionUntil
    ? user.subscriptionUntil.toLocaleDateString('ru-RU')
    : 'не активна';
  const balanceRub = Number(user.balanceRub) / 100;
  await ctx.editMessageText(
    `📅 <b>Подписка</b>\n\n` +
    `Статус: ${user.subscriptionUntil && user.subscriptionUntil > new Date() ? '✅ активна' : '❌ не активна'}\n` +
    `Действует до: ${until}\n` +
    `Баланс: ${balanceRub.toFixed(2)} ₽`,
    { parse_mode: 'HTML', reply_markup: tariffMenu() },
  );
});


/** Обработка текстовых сообщений — только для тех, кто в pendingCustomAmount. */
bot.on('message:text', async (ctx, next) => {
  if (!ctx.from) return;
  if (!pendingCustomAmount.has(ctx.from.id)) {
    // не наше — пропускаем к следующему обработчику (grant)
    return await next();
  }

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


/** Кнопка ИГРАТЬ → проверяем подписку, разблокируем кнопку. */
bot.callbackQuery('play', async ctx => {
  await ctx.answerCallbackQuery();
  if (!ctx.from) return;
  const user = await prisma.user.findUnique({
    where: { tgId: BigInt(ctx.from.id) },
  });
  if (!user) {
    await ctx.editMessageText('Нажми /start чтобы создать аккаунт');
    return;
  }
  const hasActive =
    user.subscriptionUntil && user.subscriptionUntil > new Date();
  if (!hasActive) {
    await ctx.editMessageText(
      '❌ <b>У вас нет активной подписки</b>\n\n' +
      'Пожалуйста, оплатите подписку в разделе 💰 БАЛАНС.',
      { parse_mode: 'HTML', reply_markup: mainMenu() },
    );
    return;
  }
  await ctx.editMessageReplyMarkup({ reply_markup: mainMenuUnlocked() });
});


/** 👑 Админ-команда: /grant @username — выдаёт +5 дней подписки. */
bot.command('grant', async ctx => {
  const ADMIN_USERNAME = 'yolotag52';
  if (ctx.from?.username?.toLowerCase() !== ADMIN_USERNAME) {
    // Для всех остальных молчим
    return;
  }

  const text = ctx.message?.text ?? '';
  const parts = text.trim().split(/\s+/);
  const rawArg = parts[1];

  if (!rawArg) {
    await ctx.reply('Использование: /grant @username');
    return;
  }

  const username = rawArg.replace(/^@/, '').toLowerCase();

  const target = await prisma.user.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
  });

  if (!target) {
    await ctx.reply(
      `❌ @${username} не найден.\nЮзер должен хотя бы раз написать /start боту.`
    );
    return;
  }

  const now = new Date();
  const base =
    target.subscriptionUntil && target.subscriptionUntil > now
      ? target.subscriptionUntil
      : now;
  const newUntil = new Date(base.getTime() + 5 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: target.id },
    data: { subscriptionUntil: newUntil },
  });

  const humanDate = newUntil.toLocaleString('ru-RU');

  await ctx.reply(
    `✅ @${username} получил +5 дней подписки.\nДействует до: ${humanDate}`
  );

  try {
    await bot.api.sendMessage(
      Number(target.tgId),
      `🎉 Вам выдана подписка на 5 дней!\nДействует до: ${humanDate}`
    );
  } catch (e) {
    console.warn('[grant] не смог уведомить юзера:', (e as Error).message);
  }
});


/** 👑 Админ-панель. Только для @yolotag52. */
const ADMIN_USERNAME = 'yolotag52';
const pendingGrantFor = new Set<number>(); // tgId админов, ожидающих ввод @username

function isAdmin(tgUsername?: string | null): boolean {
  return (tgUsername ?? '').toLowerCase() === ADMIN_USERNAME;
}

function adminMenu() {
  return new InlineKeyboard()
    .text('➕ Выдать 5 дней', 'admin_grant')
    .row()
    .text('📋 Список юзеров', 'admin_users')
    .row()
    .text('⬅️ Закрыть', 'admin_close');
}

bot.command('admin', async ctx => {
  if (!ctx.from || !isAdmin(ctx.from.username)) return;
  await ctx.reply('👑 <b>Админ-панель</b>\n\nВыбери действие:', {
    parse_mode: 'HTML',
    reply_markup: adminMenu(),
  });
});

bot.callbackQuery('admin_grant', async ctx => {
  await ctx.answerCallbackQuery();
  if (!ctx.from || !isAdmin(ctx.from.username)) return;
  pendingGrantFor.add(ctx.from.id);
  await ctx.editMessageText(
    '✏️ Отправь <b>@username</b> игрока, которому выдать +5 дней подписки.',
    { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text('⬅️ Отмена', 'admin_close') },
  );
});

bot.callbackQuery('admin_users', async ctx => {
  await ctx.answerCallbackQuery();
  if (!ctx.from || !isAdmin(ctx.from.username)) return;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      username: true,
      firstName: true,
      tgId: true,
      subscriptionUntil: true,
    },
  });

  if (users.length === 0) {
    await ctx.editMessageText('Пока никого нет.', {
      reply_markup: new InlineKeyboard().text('⬅️ Назад', 'admin_menu'),
    });
    return;
  }

  const now = Date.now();
  const lines = users.map((u, i) => {
    const nick = u.username ? '@' + u.username : `id${u.tgId}`;
    const active =
      u.subscriptionUntil && u.subscriptionUntil.getTime() > now
        ? `✅ до ${u.subscriptionUntil.toLocaleDateString('ru-RU')}`
        : '❌ нет';
    return `${i + 1}. ${nick} — ${active}`;
  });

  await ctx.editMessageText(
    '📋 <b>Последние 10 юзеров:</b>\n\n' + lines.join('\n'),
    {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard()
        .text('⬅️ Назад', 'admin_menu'),
    },
  );
});

bot.callbackQuery('admin_menu', async ctx => {
  await ctx.answerCallbackQuery();
  if (!ctx.from || !isAdmin(ctx.from.username)) return;
  await ctx.editMessageText('👑 <b>Админ-панель</b>\n\nВыбери действие:', {
    parse_mode: 'HTML',
    reply_markup: adminMenu(),
  });
});

bot.callbackQuery('admin_close', async ctx => {
  await ctx.answerCallbackQuery();
  if (!ctx.from || !isAdmin(ctx.from.username)) return;
  pendingGrantFor.delete(ctx.from.id);
  await ctx.editMessageText('👑 Админ-панель закрыта.');
});

/** Ввод @username после нажатия «Выдать 5 дней». */
bot.on('message:text', async ctx => {
  if (!ctx.from || !pendingGrantFor.has(ctx.from.id)) return;
  if (!isAdmin(ctx.from.username)) {
    pendingGrantFor.delete(ctx.from.id);
    return;
  }

  const text = ctx.message.text.trim();
  if (!text.startsWith('@')) {
    await ctx.reply('Нужен ник в формате @username. Попробуй снова или нажми /admin.');
    return;
  }

  const username = text.slice(1).toLowerCase();
  const target = await prisma.user.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
  });

  if (!target) {
    await ctx.reply(`❌ @${username} не найден. Юзер должен хоть раз написать /start боту.`);
    return;
  }

  const now = new Date();
  const base =
    target.subscriptionUntil && target.subscriptionUntil > now
      ? target.subscriptionUntil
      : now;
  const newUntil = new Date(base.getTime() + 5 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: target.id },
    data: { subscriptionUntil: newUntil },
  });

  pendingGrantFor.delete(ctx.from.id);

  await ctx.reply(
    `✅ @${username} получил +5 дней. Действует до: ${newUntil.toLocaleString('ru-RU')}`,
  );
  try {
    await bot.api.sendMessage(
      Number(target.tgId),
      `🎉 Вам выдана подписка на 5 дней! Действует до: ${newUntil.toLocaleString('ru-RU')}`,
    );
  } catch (e) {
    console.warn('[admin grant] notify failed:', (e as Error).message);
  }
});
