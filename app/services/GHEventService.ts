import { DateTime } from "luxon";
import { Connection } from "mysql2";
import { RedisClientType, RedisDefaultModules, RedisModules, RedisScripts } from "redis";
import { CachedData } from "../core/Cache";
import {MysqlQueryExecutor} from "../core/MysqlQueryExecutor";
import Query from "../core/Query";

export interface Repo {
  repo_id: string;
  repo_name: string;
}

export class WrongRepoNameKeywordError extends Error {
  readonly msg: string
  constructor(message: string) {
    super(message);
    this.msg = message
  }
}

const orgLoginRegexp = /[a-zA-Z0-9][a-zA-Z0-9-]{0,38}/;
const repoNameRegexp = /[a-zA-Z0-9-_]{1,100}/;

export default class GHEventService {

  constructor(
    readonly executor: MysqlQueryExecutor<unknown>,
    readonly redisClient: RedisClientType<RedisDefaultModules & RedisModules, RedisScripts>,
  ) {
  }

  async getMaxEventTime():Promise<string> {
    const values = await this.executor.execute(`
      SELECT DATE_FORMAT(MAX(created_at), '%Y-%m-%d %H:%i:%S') AS last
      FROM github_events
      USE INDEX(index_github_events_on_created_at)
      WHERE created_at > DATE_SUB(now(), INTERVAL 1 DAY);
    `) as { last: string }[];
    return values[0]?.last;
  }

  async searchReposByKeyword(keyword: string):Promise<CachedData<any>> {
    keyword = keyword.replaceAll('%', '').replaceAll(' ', '');
    if (keyword.length === 0) {
      return {
        data: [],
        expiresAt: DateTime.now().plus({ years: 1 }),
      }
    }

    const parts = keyword.split('/');
    if (parts.length === 0) {
      return this.searchReposByKeywordWithoutOrgLogin(keyword);
    } else if (parts.length === 1 || parts.length === 2) {
      const orgLogin = parts[0];
      const repoName = parts.length === 2 ? parts[1] : '';

      if (!orgLoginRegexp.test(orgLogin)) {
        throw new WrongRepoNameKeywordError('The keyword of org login is wrong.')
      }

      if (repoName.length !== 0 && !repoNameRegexp.test(repoName)) {
        throw new WrongRepoNameKeywordError('The keyword of repo name is wrong.')
      }

      return this.searchReposByKeywordWithoutOrgLogin(keyword);
    } else {
      throw new WrongRepoNameKeywordError('The keyword of repo full name is wrong.')
    }
  }

  private async searchReposByKeywordWithoutOrgLogin(fullName: string):Promise<CachedData<any>> {
    const query = new Query('search-repos-by-keyword-without-org-login', this.redisClient, this.executor, this);
    return query.run({
      fullName: fullName
    });
  }

  private async searchReposByKeywordWithOrgLogin(orgLogin: string, repoName: string):Promise<CachedData<any>> {
    const query = new Query('search-repos-by-keyword-with-org-login', this.redisClient, this.executor, this);
    return query.run({
      orgLogin: orgLogin,
      repoName: repoName
    });
  }
}
