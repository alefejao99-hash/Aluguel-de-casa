import { Redis } from '@upstash/redis';

let redis: Redis | null | undefined;
const localHits = new Map<string, { count: number; expiresAt: number }>();

function getRedis() {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const redisClient = getRedis();
  const fullKey = `ratelimit:${key}`;

  if (redisClient) {
    const count = await redisClient.incr(fullKey);
    if (count === 1) await redisClient.expire(fullKey, windowSeconds);
    if (count > limit) {
      throw Object.assign(new Error('Muitas tentativas. Tente novamente mais tarde.'), { status: 429 });
    }
    return;
  }

  const now = Date.now();
  const current = localHits.get(fullKey);
  if (!current || current.expiresAt <= now) {
    localHits.set(fullKey, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return;
  }
  current.count += 1;
  if (current.count > limit) {
    throw Object.assign(new Error('Muitas tentativas. Tente novamente mais tarde.'), { status: 429 });
  }
}
