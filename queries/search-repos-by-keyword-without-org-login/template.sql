with datetime_range as (
    select
        date_format(date_sub(now(), interval 1 day), '%Y-%m-%d %H:00:00') as t_from,
        date_format(date_sub(now(), interval 1 hour), '%Y-%m-%d %H:00:00') as t_to
)
select
    any_value(repo_id) as repo_id, repo_name
from 
    github_events ge
    use index(index_github_events_on_created_at)
where
    type in ('PushEvent', 'PullRequestEvent')
    and repo_name like '%fullName%'
    and created_at > (select t_from from datetime_range)
    and created_at < (select t_to from datetime_range)
group by 2
order by 1
limit 10;