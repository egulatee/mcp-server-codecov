import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LRUCache } from '../cache.js';

describe('LRUCache', () => {
  describe('get / set basics', () => {
    it('returns undefined for a missing key', () => {
      const cache = new LRUCache<string>(10, 60_000);
      expect(cache.get('missing')).toBeUndefined();
    });

    it('stores and retrieves a value', () => {
      const cache = new LRUCache<string>(10, 60_000);
      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');
    });

    it('returns undefined for an expired entry', () => {
      const cache = new LRUCache<string>(10, 1); // 1ms TTL
      cache.set('key', 'value');
      // Advance time past TTL
      vi.setSystemTime(Date.now() + 100);
      expect(cache.get('key')).toBeUndefined();
    });

    it('updating a key moves it to MRU position', () => {
      const cache = new LRUCache<number>(2, 60_000);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('a', 10); // re-insert 'a' → should be MRU
      cache.set('c', 3);  // evicts LRU which is now 'b'
      expect(cache.get('a')).toBe(10);
      expect(cache.get('b')).toBeUndefined(); // evicted
      expect(cache.get('c')).toBe(3);
    });
  });

  describe('LRU eviction', () => {
    it('evicts the oldest entry when at capacity', () => {
      const cache = new LRUCache<number>(2, 60_000);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3); // 'a' should be evicted (oldest)
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
    });

    it('accessing a key makes it MRU so it survives eviction', () => {
      const cache = new LRUCache<number>(2, 60_000);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.get('a'); // 'a' becomes MRU, 'b' becomes LRU
      cache.set('c', 3); // 'b' should be evicted
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBeUndefined(); // evicted
      expect(cache.get('c')).toBe(3);
    });
  });

  describe('has()', () => {
    it('returns true for an existing non-expired key', () => {
      const cache = new LRUCache<string>(10, 60_000);
      cache.set('x', 'hello');
      expect(cache.has('x')).toBe(true);
    });

    it('returns false for a missing key', () => {
      const cache = new LRUCache<string>(10, 60_000);
      expect(cache.has('missing')).toBe(false);
    });

    it('returns false for an expired key', () => {
      const cache = new LRUCache<string>(10, 1);
      cache.set('x', 'hello');
      vi.setSystemTime(Date.now() + 100);
      expect(cache.has('x')).toBe(false);
    });
  });

  describe('clear()', () => {
    it('removes all cached entries', () => {
      const cache = new LRUCache<string>(10, 60_000);
      cache.set('a', '1');
      cache.set('b', '2');
      cache.clear();
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBeUndefined();
    });

    it('clears pending requests so they do not block future fetches', async () => {
      const cache = new LRUCache<string>(10, 60_000);

      let resolve!: (v: string) => void;
      const promise = new Promise<string>((res) => { resolve = res; });
      const fetchFn = vi.fn(() => promise);

      // Start an in-flight request
      const inflight = cache.getOrFetch('key', fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Clear should wipe the pendingRequests map
      cache.clear();

      // A new getOrFetch should make a fresh fetch call (not reuse the old pending)
      const newFetchFn = vi.fn().mockResolvedValue('fresh');
      const fresh = await cache.getOrFetch('key', newFetchFn);
      expect(fresh).toBe('fresh');
      expect(newFetchFn).toHaveBeenCalledTimes(1);

      // Resolve the original in-flight to avoid unhandled rejections
      resolve('old');
      await inflight;
    });
  });

  describe('getStats()', () => {
    it('returns zero stats for an empty cache', () => {
      const cache = new LRUCache<string>(5, 60_000);
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBe(5);
      expect(stats.pendingRequests).toBe(0);
    });

    it('reflects current cache size', () => {
      const cache = new LRUCache<string>(10, 60_000);
      cache.set('a', '1');
      cache.set('b', '2');
      expect(cache.getStats().size).toBe(2);
    });

    it('reflects in-flight pending requests', async () => {
      const cache = new LRUCache<string>(10, 60_000);

      let resolve!: (v: string) => void;
      const promise = new Promise<string>((res) => { resolve = res; });
      const inflight = cache.getOrFetch('key', () => promise);

      expect(cache.getStats().pendingRequests).toBe(1);

      resolve('done');
      await inflight;
      expect(cache.getStats().pendingRequests).toBe(0);
    });
  });

  describe('getOrFetch()', () => {
    it('calls fetchFn and caches the result', async () => {
      const cache = new LRUCache<string>(10, 60_000);
      const fetchFn = vi.fn().mockResolvedValue('fetched');

      const result = await cache.getOrFetch('key', fetchFn);
      expect(result).toBe('fetched');
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('returns the cached value without calling fetchFn again', async () => {
      const cache = new LRUCache<string>(10, 60_000);
      const fetchFn = vi.fn().mockResolvedValue('fetched');

      await cache.getOrFetch('key', fetchFn);
      const result = await cache.getOrFetch('key', fetchFn); // should hit cache
      expect(result).toBe('fetched');
      expect(fetchFn).toHaveBeenCalledTimes(1); // only one actual fetch
    });

    it('deduplicates concurrent requests for the same key', async () => {
      const cache = new LRUCache<string>(10, 60_000);
      let callCount = 0;

      const fetchFn = vi.fn(() => {
        callCount++;
        return new Promise<string>((resolve) => setTimeout(() => resolve('result'), 10));
      });

      // Fire two concurrent requests for the same key
      const [r1, r2] = await Promise.all([
        cache.getOrFetch('key', fetchFn),
        cache.getOrFetch('key', fetchFn),
      ]);

      expect(r1).toBe('result');
      expect(r2).toBe('result');
      expect(callCount).toBe(1); // only one real fetch
    });

    it('propagates fetch errors and removes the pending request', async () => {
      const cache = new LRUCache<string>(10, 60_000);
      const fetchFn = vi.fn().mockRejectedValue(new Error('fetch failed'));

      await expect(cache.getOrFetch('key', fetchFn)).rejects.toThrow('fetch failed');
      // After failure the pending entry is cleaned up — a retry should fetch again
      const retryFn = vi.fn().mockResolvedValue('retry ok');
      const result = await cache.getOrFetch('key', retryFn);
      expect(result).toBe('retry ok');
      expect(retryFn).toHaveBeenCalledTimes(1);
    });
  });
});
