import {RedisClientType, RedisDefaultModules, RedisModules, RedisScripts} from "redis";
import { MysqlQueryExecutor } from "../MysqlQueryExecutor";
import Cache from './Cache'
import CachedTableCacheProvider from "./CachedTableCacheProvider";
import { CacheProvider } from "./CacheProvider";
import NormalTableCacheProvider from "./NormalTableCacheProvider";
import RedisCacheProvider from "./RedisCacheProvider";

export enum CacheProviderTypes {
    NORMAL_TABLE = 'NORMAL_TABLE',
    CACHED_TABLE = 'CACHED_TABLE',
    REDIS = 'REDIS',
}

export default class CacheBuilder {


    private normalCacheProvider: CacheProvider;

    private cachedTableCacheProvider: CacheProvider;

    private redisCacheProvider: CacheProvider;

    constructor(
        private readonly redisClient: RedisClientType<RedisDefaultModules & RedisModules, RedisScripts>,
        private readonly queryExecutor: MysqlQueryExecutor
    ) {
        this.normalCacheProvider = new NormalTableCacheProvider(queryExecutor);
        this.cachedTableCacheProvider = new CachedTableCacheProvider(queryExecutor);
        this.redisCacheProvider = new RedisCacheProvider(this.redisClient);
    }

    build(
        cacheProvider: string, key: string, cacheHours: number, refreshHours: number, onlyFromCache: boolean, refreshCache?: boolean
    ): Cache<any> {
        switch(cacheProvider) {
            case CacheProviderTypes.CACHED_TABLE:
                return new Cache<any>(this.cachedTableCacheProvider, key, cacheHours, refreshHours, onlyFromCache, refreshCache);
            case CacheProviderTypes.REDIS:
                return new Cache<any>(this.redisCacheProvider, key, cacheHours, refreshHours, onlyFromCache, refreshCache);
            default:
                return new Cache<any>(this.normalCacheProvider, key, cacheHours, refreshHours, onlyFromCache, refreshCache);
        }

        
    }
}