import {MysqlQueryExecutor} from "../core/MysqlQueryExecutor";

interface Repo {
  id: number;
  name: string;
  group_name: string;
}

export default class RepoGroupService {

  constructor(readonly executor: MysqlQueryExecutor<unknown>) {
  }

  async getRepoGroups() {
    const repos = await this.executor.execute('select * from osdb_repos;') as Repo[];

    const repoGroupMap = new Map();
    if (Array.isArray(repos)) {
      for (const repo of repos) {
        if (repoGroupMap.has(repo.group_name)) {
          const repoGroup = repoGroupMap.get(repo.group_name);
          repoGroup.repos.push(repo);
        } else {
          repoGroupMap.set(repo.group_name, {
            group_name: repo.group_name,
            repos: [repo]
          });
        }
      }
      return repoGroupMap.values();
    } else {
      return [];
    }
  }

}
