import consola from "consola";
import { MysqlQueryExecutor, Result } from "../MysqlQueryExecutor";
import { CacheOption, CacheProvider } from "./CacheProvider";

const logger = consola.withTag('cached-table-cache')

export default class CachedTableCacheProvider implements CacheProvider {

    constructor(
        private readonly tidbClient: MysqlQueryExecutor
    ) {

    }
    
    async set(key: string, value: string, options?: CacheOption): Promise<void> {
        const EX = options?.EX || 'null';
        const sql = `INSERT INTO cached_table_cache(cache_key, cache_value, expires) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE cache_value = VALUES(cache_value), expires = VALUES(expires);`;

        await this.tidbClient.prepare(sql, [key, value, EX]);
    }

    async get(key: string): Promise<any> {
        const sql = `SELECT *, DATE_ADD(updated_at, INTERVAL expires SECOND) AS expired_at
        FROM cached_table_cache
        WHERE cache_key = ? AND ((expires = -1) OR (DATE_ADD(updated_at, INTERVAL expires SECOND) >= CURRENT_TIME))
        LIMIT 1;`;
        const result = await this.tidbClient.prepare(sql, [key]);
        const rows = result.rows as any[];
        if (!Array.isArray(rows) || rows.length === 0) {
            return null;
        } else {
            return rows[0]?.cache_value;
        }
    }
}