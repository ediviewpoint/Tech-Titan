import Redis from "ioredis";
import logger from "./logger";

// Railway Redis: REDIS_URL. RedisCloud: REDISCLOUD_URL. Dev: localhost
const REDIS_URL =
  process.env.REDIS_URL      ??
  process.env.REDISCLOUD_URL ??
  "redis://localhost:6379";

export const CACHE_TTL = 5 * 60; // 5 minutos

let _client: Redis | null = null;

function client(): Redis {
  if (!_client) {
    _client = new Redis(REDIS_URL, {
      lazyConnect:          true,
      enableOfflineQueue:   false,
      maxRetriesPerRequest: 1,
      connectTimeout:       2_000,
      // Railway Redis usa TLS (rediss://)
      tls: REDIS_URL.startsWith("rediss://") ? {} : undefined,
    });
    _client.on("error", (err: Error) =>
      logger.warn(`[redis] ${err.message} — cache omitido`)
    );
  }
  return _client;
}

export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await client().get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string): Promise<void> {
  try {
    await client().setex(key, CACHE_TTL, value);
  } catch {
    // degradación sin cortes
  }
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  try {
    const keys = await client().keys(pattern);
    if (keys.length > 0) await client().del(...keys);
    logger.info(`[redis] invalidadas ${keys.length} claves: ${pattern}`);
  } catch {
    // ignore
  }
}
