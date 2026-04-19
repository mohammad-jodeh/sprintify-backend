/**
 * Decorator for method-level caching
 * Automatically caches method results
 */

import { CacheService } from "./cache.service";

export function Cacheable(options?: { ttl?: number; keyPrefix?: string }) {
  const cache = CacheService.getInstance();
  const defaultTtl = options?.ttl || 5 * 60 * 1000; // 5 minutes default
  const keyPrefix = options?.keyPrefix || "";

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Generate cache key from method name and arguments
      const cacheKey = `${keyPrefix}:${propertyKey}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cachedValue = cache.get(cacheKey);
      if (cachedValue !== undefined) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return cachedValue;
      }

      // Not in cache, call original method
      console.log(`❌ Cache MISS: ${cacheKey}`);
      const result = await originalMethod.apply(this, args);

      // Store in cache
      cache.set(cacheKey, result, defaultTtl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Clear cache by pattern
 */
export function CacheInvalidate(pattern: RegExp | string) {
  const cache = CacheService.getInstance();

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Invalidate matching cache entries
      const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
      cache.deletePattern(regex);
      console.log(`🗑️  Cache invalidated for pattern: ${pattern}`);

      return result;
    };

    return descriptor;
  };
}
