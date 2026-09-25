const Redis = require('ioredis');

let redisClient = null;

// Only attempt Redis connection if explicitly configured or available
if (process.env.USE_REDIS === 'true' || process.env.REDIS_HOST) {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      retryStrategy: () => null,
      enableOfflineQueue: false,
    });

    redisClient.on('error', () => {
      // Suppress connection failure logs when Redis service is not installed
    });

    redisClient.connect().then(() => {
      console.log('✅ Redis Cache Connected Successfully');
    }).catch(() => {
      console.log('⚡ Redis offline — Using High-Speed In-Memory Cache');
    });
  } catch (error) {
    console.log('⚡ Using High-Speed In-Memory Cache');
  }
}

// In-memory fallback map for environments without active Redis instance
const inMemoryCache = new Map();

const cacheService = {
  async get(key) {
    try {
      if (redisClient && redisClient.status === 'ready') {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      }
    } catch (e) {}
    const entry = inMemoryCache.get(key);
    if (!entry) return null;
    if (entry.expireAt && Date.now() > entry.expireAt) {
      inMemoryCache.delete(key);
      return null;
    }
    return entry.value;
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      if (redisClient && redisClient.status === 'ready') {
        return await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      }
    } catch (e) {}
    inMemoryCache.set(key, {
      value,
      expireAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  },

  async del(key) {
    try {
      if (redisClient && redisClient.status === 'ready') {
        return await redisClient.del(key);
      }
    } catch (e) {}
    inMemoryCache.delete(key);
  }
};

module.exports = { redisClient, cacheService };
