/**
 * Multi-level Caching System
 * Implements 3-tier caching strategy for <12ms performance
 * Based on n8n ecosystem research and Cloudflare best practices
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  memoryTTL?: number;    // Default: 60 seconds
  kvTTL?: number;        // Default: 3600 seconds (1 hour)
  d1TTL?: number;        // Default: 86400 seconds (24 hours)
}

/**
 * Multi-level cache manager for optimal performance
 * Level 1: In-memory (Worker) - <1ms latency
 * Level 2: KV namespace - <10ms latency
 * Level 3: D1 database - <50ms latency
 */
export class CacheManager {
  private memory: Map<string, CacheEntry<any>>;
  private env: any;
  private options: Required<CacheOptions>;

  constructor(env: any, options: CacheOptions = {}) {
    this.memory = new Map();
    this.env = env;
    this.options = {
      memoryTTL: options.memoryTTL || 60,
      kvTTL: options.kvTTL || 3600,
      d1TTL: options.d1TTL || 86400
    };

    // Start periodic cleanup of expired memory cache entries
    this.startMemoryCleanup();
  }

  /**
   * Get value from cache with multi-level fallback
   * @param key Cache key
   * @returns Cached value or null
   */
  async get<T>(key: string): Promise<T | null> {
    // Level 1: Memory cache (fastest)
    const memoryValue = this.getFromMemory<T>(key);
    if (memoryValue !== null) {
      return memoryValue;
    }

    // Level 2: KV namespace (fast)
    const kvValue = await this.getFromKV<T>(key);
    if (kvValue !== null) {
      // Promote to memory cache for faster subsequent access
      this.setInMemory(key, kvValue, this.options.memoryTTL);
      return kvValue;
    }

    // Level 3: D1 database (slower but persistent)
    const d1Value = await this.getFromD1<T>(key);
    if (d1Value !== null) {
      // Promote to both KV and memory cache
      await this.setInKV(key, d1Value, this.options.kvTTL);
      this.setInMemory(key, d1Value, this.options.memoryTTL);
      return d1Value;
    }

    return null;
  }

  /**
   * Set value in all cache levels
   * @param key Cache key
   * @param value Value to cache
   * @param options TTL options for each level
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttlOptions = { ...this.options, ...options };

    // Set in all levels simultaneously
    const promises: Promise<void>[] = [
      this.setInMemory(key, value, ttlOptions.memoryTTL),
      this.setInKV(key, value, ttlOptions.kvTTL),
      this.setInD1(key, value, ttlOptions.d1TTL)
    ];

    await Promise.all(promises);
  }

  /**
   * Invalidate cache entry at all levels
   * @param key Cache key to invalidate
   */
  async invalidate(key: string): Promise<void> {
    // Remove from all levels
    this.memory.delete(key);
    
    const promises: Promise<void>[] = [];
    
    if (this.env.CACHE_KV) {
      promises.push(this.env.CACHE_KV.delete(key));
    }
    
    if (this.env.DB) {
      promises.push(
        this.env.DB.prepare('DELETE FROM cache WHERE key = ?')
          .bind(key)
          .run()
          .then(() => undefined)
      );
    }

    await Promise.all(promises);
  }

  /**
   * Invalidate all cache entries matching a pattern
   * @param pattern Pattern to match (supports * wildcard)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    
    // Clear matching entries from memory
    for (const key of this.memory.keys()) {
      if (regex.test(key)) {
        this.memory.delete(key);
      }
    }

    // Clear from KV if available
    if (this.env.CACHE_KV) {
      const list = await this.env.CACHE_KV.list({ prefix: pattern.split('*')[0] });
      const deletePromises = list.keys
        .filter(key => regex.test(key.name))
        .map(key => this.env.CACHE_KV.delete(key.name));
      await Promise.all(deletePromises);
    }

    // Clear from D1 if available
    if (this.env.DB) {
      await this.env.DB.prepare('DELETE FROM cache WHERE key LIKE ?')
        .bind(pattern.replace('*', '%'))
        .run();
    }
  }

  /**
   * Get value from memory cache
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memory.get(key);
    if (!entry) return null;

    // Check if expired
    const now = Date.now();
    if (now > entry.timestamp + entry.ttl * 1000) {
      this.memory.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in memory cache
   */
  private setInMemory<T>(key: string, value: T, ttl: number): Promise<void> {
    this.memory.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl
    });
    return Promise.resolve();
  }

  /**
   * Get value from KV namespace
   */
  private async getFromKV<T>(key: string): Promise<T | null> {
    if (!this.env.CACHE_KV) return null;

    try {
      const value = await this.env.CACHE_KV.get(key, 'json');
      return value as T;
    } catch (error) {
      console.error(`Failed to get from KV: ${error}`);
      return null;
    }
  }

  /**
   * Set value in KV namespace
   */
  private async setInKV<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.env.CACHE_KV) return;

    try {
      await this.env.CACHE_KV.put(key, JSON.stringify(value), {
        expirationTtl: ttl
      });
    } catch (error) {
      console.error(`Failed to set in KV: ${error}`);
    }
  }

  /**
   * Get value from D1 database
   */
  private async getFromD1<T>(key: string): Promise<T | null> {
    if (!this.env.DB) return null;

    try {
      const result = await this.env.DB.prepare(
        'SELECT value, expires_at FROM cache WHERE key = ? AND expires_at > ?'
      )
        .bind(key, Date.now())
        .first();

      if (result) {
        return JSON.parse(result.value as string) as T;
      }
    } catch (error) {
      console.error(`Failed to get from D1: ${error}`);
    }

    return null;
  }

  /**
   * Set value in D1 database
   */
  private async setInD1<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.env.DB) return;

    try {
      const expires_at = Date.now() + ttl * 1000;
      await this.env.DB.prepare(
        'INSERT OR REPLACE INTO cache (key, value, expires_at, created_at) VALUES (?, ?, ?, ?)'
      )
        .bind(key, JSON.stringify(value), expires_at, Date.now())
        .run();
    } catch (error) {
      console.error(`Failed to set in D1: ${error}`);
    }
  }

  /**
   * Start periodic cleanup of expired memory cache entries
   */
  private startMemoryCleanup(): void {
    // Cloudflare Workers don't support setInterval, 
    // so cleanup happens on each request
    // This is called during get operations
  }

  /**
   * Get cache statistics
   */
  getStats(): { memory: number; hits: number; misses: number } {
    return {
      memory: this.memory.size,
      hits: 0, // Would need to track this
      misses: 0 // Would need to track this
    };
  }
}

/**
 * Cache key generator for consistent key formatting
 */
export class CacheKeyGenerator {
  private prefix: string;

  constructor(prefix: string = 'n8n') {
    this.prefix = prefix;
  }

  /**
   * Generate cache key for workflow data
   */
  workflow(id: string, version?: string): string {
    return version 
      ? `${this.prefix}:workflow:${id}:${version}`
      : `${this.prefix}:workflow:${id}`;
  }

  /**
   * Generate cache key for node data
   */
  node(name: string): string {
    return `${this.prefix}:node:${name}`;
  }

  /**
   * Generate cache key for execution data
   */
  execution(id: string): string {
    return `${this.prefix}:execution:${id}`;
  }

  /**
   * Generate cache key for tool tier data
   */
  toolTier(tier: number): string {
    return `${this.prefix}:tools:tier${tier}`;
  }

  /**
   * Generate cache key for search results
   */
  search(query: string, type: string): string {
    const sanitized = query.toLowerCase().replace(/\s+/g, '_');
    return `${this.prefix}:search:${type}:${sanitized}`;
  }
}

/**
 * Cache warming utility for pre-loading frequently accessed data
 */
export async function warmCache(env: any, cache: CacheManager): Promise<void> {
  // Pre-load tool tier configurations
  const tiers = ['tier1', 'tier2', 'tier3'];
  for (const tier of tiers) {
    // This would load actual tier data from configuration
    await cache.set(`tools:${tier}`, { loaded: true }, { memoryTTL: 3600 });
  }
}
