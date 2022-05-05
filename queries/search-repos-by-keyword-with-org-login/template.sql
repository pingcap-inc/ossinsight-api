select
    any_value(repo_id) as repo_id, repo_name
from 
    github_events ge
    use index(index_github_events_on_org_login)
where
    type = 'PushEvent'
    and org_login = 'orgLogin'
    and repo_name like 'orgLogin/repoName%'
    and repo_name != 'orgLogin/'
group by 2
order by 1
limit 10;