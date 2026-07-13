import { Redis } from '@upstash/redis';

// Aceita os dois padrões de nomes de variáveis (Upstash direto ou integração Vercel/KV)
const url =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const redis = new Redis({ url, token });

const KEY = 'coupons';

// O SDK do Upstash às vezes já devolve objeto, às vezes string. Tratamos os dois casos.
export function parseCoupon(v) {
  if (v == null) return null;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  return v;
}

// Regra central de validade: ativo + dentro da janela de datas (horário de Brasília, -03:00)
export function isCurrentlyValid(c) {
  if (!c || c.active === false) return false;
  const now = Date.now();
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return false;
  if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return false;
  return true;
}

export async function getAll() {
  const raw = (await redis.hgetall(KEY)) || {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) out[k] = parseCoupon(v);
  return out;
}

export async function getOne(code) {
  const v = await redis.hget(KEY, code);
  return parseCoupon(v);
}

export async function saveOne(coupon) {
  await redis.hset(KEY, { [coupon.code]: JSON.stringify(coupon) });
}

export async function deleteOne(code) {
  await redis.hdel(KEY, code);
}

export function setCors(res, origin = '*') {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
