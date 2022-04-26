with pr_with_merged_at as (
    select
        pr_or_issue_id, event_month, created_at as merged_at
    from
        github_events ge
    use index(index_github_events_on_repo_id)
    where
        type = 'PullRequestEvent'
        and action = 'closed'
        and repo_id = 41986369
), pr_with_opened_at as (
    select
        pr_or_issue_id, created_at as opened_at
    from
        github_events ge
    use index(index_github_events_on_repo_id)
    where
        type = 'PullRequestEvent'
        and action = 'opened'
        and actor_login not like '%bot%'
        and repo_id = 41986369
), tdiff as (
    select
        event_month,
        (UNIX_TIMESTAMP(iwm.merged_at) - UNIX_TIMESTAMP(iwo.opened_at)) / 60 / 60 / 24 as diff,
        ROW_NUMBER() over (partition by event_month order by (UNIX_TIMESTAMP(iwm.merged_at) - UNIX_TIMESTAMP(iwo.opened_at))) as r,
        min(UNIX_TIMESTAMP(iwm.merged_at) - UNIX_TIMESTAMP(iwo.opened_at)) over (partition by event_month) as min,
        max(UNIX_TIMESTAMP(iwm.merged_at) - UNIX_TIMESTAMP(iwo.opened_at)) over (partition by event_month) as max,
        count(*) over (partition by event_month) as cnt
    from
        pr_with_opened_at iwo
        join pr_with_merged_at iwm on iwo.pr_or_issue_id = iwm.pr_or_issue_id
)
select
    event_month,
    min / 60 / 60 / 24 as `min`,
    max / 60 / 60 / 24 as `max`,
    diff as `median`
from
    tdiff
where
    r = (cnt DIV 2)
group by 1
order by 1;
