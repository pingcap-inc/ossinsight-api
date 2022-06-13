import * as dotenv from "dotenv";
import {TiDBQueryExecutor} from "./app/core/TiDBQueryExecutor";
import {createClient} from "redis";
import consola, {FancyReporter} from "consola";
import {DateTime, Duration} from "luxon";
import { validateProcessEnv } from './app/env';
import GHEventService from "./app/services/GHEventService";
import CollectionService from './app/services/CollectionService';
import CacheBuilder from './app/core/cache/CacheBuilder';

// Load environments.
dotenv.config({ path: __dirname+'/.env.template', override: true });
dotenv.config({ path: __dirname+'/.env', override: true });

validateProcessEnv()

const logger = consola.withTag('prefetch');

async function main () {
  // Init logger.
  logger.addReporter(new FancyReporter({
    dateFormat: 'YYYY:MM:DD HH:mm:ss'
  }),);

  // Init redis client.
  const redisClient = createClient({
    url: process.env.REDIS_URL
  });
  await redisClient.on('error', (err) => console.log('Redis Client Error', err));
  await redisClient.connect();

  // Init mysql client.
  const queryExecutor = new TiDBQueryExecutor({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    queueLimit: 10,
    decimalNumbers: true
  });

  // Init Cache Builder.
  const cacheBuilder = new CacheBuilder(redisClient, queryExecutor);

  // Init Services.
  const ghEventService = new GHEventService(queryExecutor);
  const collectionService = new CollectionService(queryExecutor, cacheBuilder);

  logger.info("Ready Go...")
  for (let i = 0; i < Number.MAX_VALUE; i++) {
    logger.info(`Compute round ${i + 1}.`);

    // Clear expired cache.
    queryExecutor.execute(`DELETE FROM cache ctc
    WHERE expires > 0 AND DATE_ADD(updated_at, INTERVAL expires SECOND) < CURRENT_TIME;`);

    queryExecutor.execute(`DELETE FROM cached_table_cache ctc
    WHERE expires > 0 AND DATE_ADD(updated_at, INTERVAL expires SECOND) < CURRENT_TIME;`);

    logger.info('Next round prefetch will come at: %s', DateTime.now().plus(Duration.fromObject({ minutes: 1 })));
    await sleep(1000 * 60 * 1);    // sleep 30 minutes.
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main().then()
