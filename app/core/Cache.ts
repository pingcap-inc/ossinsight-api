import {DateTime, Duration} from 'luxon'
import consola from "consola";
import {RedisClientType, RedisDefaultModules, RedisModules, RedisScripts} from "redis";

export interface CachedData<T> {
  expiresAt: DateTime
  data: T
  [key: string]: any
}

const runningCaches = new Map<string, Cache<unknown>>()

const logger = consola.withTag('cache')

export default class Cache<T> {
  _data!: Promise<CachedData<T>>

  constructor(
    public readonly redisClient: RedisClientType<RedisDefaultModules & RedisModules, RedisScripts>,
    public readonly key: string,
    public readonly expires: number,
    public readonly refreshMinutes?: number,
    ) {
  }

  async load(fallback: () => Promise<CachedData<T>>, onlyFromCache: boolean = false): Promise<CachedData<T>> {
    // Only running one at the same time when multiple same query with same params.
    if (runningCaches.has(this.key)) {
      logger.info('Wait for previous same cache query.')
      return await runningCaches.get(this.key)!._data as never
    }

    let _resolve: (data: CachedData<T>) => void
    let _reject: (err: any) => void
    this._data = new Promise<CachedData<T>>((resolve, reject) => {
      _resolve = resolve
      _reject = reject
    })
    runningCaches.set(this.key, this as never)

    try {
      // Try to get cached value.
      let cachedData: any = null;
      try {
        const json = await this.redisClient.get(this.key);
        if (typeof json === 'string') {
          logger.success('Hit cache of key %s', this.key)
          cachedData = JSON.parse(json) as CachedData<T>;
        } else {
          logger.info('Not hit cache of key %s', this.key)
        }
      } catch (e) {
        logger.warn(`cache <%s> data is broken.`, this.key);
      }

      const hasCachedData = cachedData != null;
      const cacheNeedRefresh =
        cachedData != null &&
        this.refreshMinutes != undefined &&
        this.refreshMinutes > 0 &&
        (DateTime.now().diff(cachedData.requestedAt) < Duration.fromObject({ minute: this.refreshMinutes }))

      // If the onlyFromCache option is enabled, the data will be returned if there is cached data,
      // and the query will fail if there is not, avoiding the query to the database.
      if (hasCachedData && onlyFromCache) {
        _resolve!(cachedData)
        return cachedData;
      } else if (!hasCachedData && onlyFromCache) {
        throw new Error("Failed to get data.")
      }

      // If the query has a cache and no need to update the cache, just return the data.
      if (hasCachedData && !cacheNeedRefresh) {
        _resolve!(cachedData)
        return cachedData;
      }

      // Notice: If the current query has no cache or the time that from last requested to now
      // has exceeded the period specified by refreshMinutes, then try to query data from database.
      const result = await fallback()

      // Write result to cache.
      try {
        if (this.expires === -1 || this.expires === undefined) {
          await this.redisClient.set(this.key, JSON.stringify({
            ...result,
            expiresAt: result.expiresAt.toISO(),
          }));
        } else {
          await this.redisClient.set(this.key, JSON.stringify({
            ...result,
            expiresAt: result.expiresAt.toISO(),
          }), {
            EX: this.expires,
          });
        }
      } catch (e) {
        logger.info('update failed', this.key, e)
      }

      _resolve!(result)
      return result
    } catch (e) {
      this._data.catch(() => {})
      _reject!(e)
      throw e
    } finally {
      runningCaches.delete(this.key)
    }
  }

}
