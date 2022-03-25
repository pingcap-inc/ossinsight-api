import {collectDefaultMetrics, Counter, Histogram} from 'prom-client'

export const metricsPrefix = 'ossinsight_api_';

collectDefaultMetrics({
  prefix: metricsPrefix,
  labels: process.env.NODE_APP_INSTANCE ? {
    NODE_APP_INSTANCE: process.env.NODE_APP_INSTANCE
  } : undefined,
})

export const requestCounter = new Counter({
  name: metricsPrefix + 'request_count',
  help: 'Request count',
  labelNames: ['phase', 'status'] as const,
})

export const tidbQueryCounter = new Counter({
  name: metricsPrefix + 'tidb_query_count',
  help: 'TiDB query count'
})

export const tidbQueryFailedCounter = new Counter({
  name: metricsPrefix + 'tidb_query_failed_count',
  help: 'TiDB query failed count',
})

export const cacheHitCounter = new Counter({
  name: metricsPrefix + 'cache_hit_count',
  help: 'Cache hit count'
})

export const ghQueryCounter = new Counter({
  name: metricsPrefix + 'gh_api_query_count',
  help: 'GitHub api query count'
})

export const ghQueryFailedCounter = new Counter({
  name: metricsPrefix + 'gh_api_query_failed_count',
  help: 'GitHub api query failed count'
})

export const requestProcessTimer = new Histogram({
  name: metricsPrefix + 'request_process_time',
  help: 'Request process time',
})

export const waitTidbConnectionTimer = new Histogram({
  name: metricsPrefix + 'wait_tidb_connection_time',
  help: 'Wait tidb connection time',
})

export const tidbQueryTimer = new Histogram({
  name: metricsPrefix + 'tidb_query_time',
  help: 'TiDB query time',
})

export const ghQueryTimer = new Histogram({
  name: metricsPrefix + 'gh_api_query_time',
  help: 'GitHub api query timer'
})

export const redisQueryTimer = new Histogram({
  name: metricsPrefix + 'redis_query_time',
  help: 'Redis query time'
})
