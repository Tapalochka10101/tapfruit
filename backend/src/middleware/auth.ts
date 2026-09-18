import type { Request, Response, NextFunction } from 'express';
import { validateInitData } from '../lib/telegramAuth.js';
import { prisma } from '../lib/prisma.js';
import { ENV } from '../env.js';
import { chargeIfNeeded } from '../services/subscription.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      tgId?: bigint;
    }
  }
}

const DEV_MODE = ENV.NODE_ENV === 'development';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const initData = req.header('x-init-data');

  let tgId: bigint;
  let username: string | null = null;
  let firstName: string | null = null;
  let startParam: string | null = null;

  if (initData) {
    const parsed = validateInitData(initData, ENV.BOT_TOKEN);
    if (!parsed) return res.status(401).json({ error: 'invalid_init_data' });
    tgId = BigInt(parsed.user.id);
    username = parsed.user.username ?? null;
    firstName = parsed.user.first_name ?? null;
    const params = new URLSearchParams(initData);
    startParam = params.get('start_param');
  } else if (DEV_MODE) {
    tgId = 999999999n;
    username = 'devuser';
    firstName = 'Dev';
  } else {
    return res.status(401).json({ error: 'no_init_data' });
  }

  let referrerId: string | null = null;
  if (startParam && startParam.startsWith('ref_')) {
    const referrerTgId = startParam.slice(4);
    if (/^\d+$/.test(referrerTgId) && referrerTgId !== tgId.toString()) {
      const referrer = await prisma.user.findUnique({
        where: { tgId: BigInt(referrerTgId) },
        select: { id: true },
      });
      if (referrer) referrerId = referrer.id;
    }
  }

  const existing = await prisma.user.findUnique({ where: { tgId }, select: { id: true } });

  let user = await prisma.user.upsert({
    where: { tgId },
    update: { username, firstName },
    create: {
      tgId,
      username,
      firstName,
      referrerId: existing ? null : referrerId,
    },
  });

  // Автопродление/списание подписки — раз в 3 дня
  try {
    user = await chargeIfNeeded(user);
  } catch (e) {
    console.warn('[auth] chargeIfNeeded failed:', (e as Error).message);
  }

  req.userId = user.id;
  req.tgId = tgId;
  next();
}
