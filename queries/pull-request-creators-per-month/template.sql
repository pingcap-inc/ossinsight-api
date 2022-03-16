WITH tmp AS (
    SELECT
        event_month,
        repo_name,
        COUNT(distinct actor_id) as month_pr_count
    FROM github_events
    use index(index_github_events_on_repo_id)
    WHERE
        type = 'PullRequestEvent' and repo_name in (41986369, 41986370) and action = 'opened'
    GROUP BY repo_name, event_month
    ORDER BY 1 ASC, 2
), tmp1 AS (
    SELECT
        event_month,
        repo_name,
        month_pr_count as total
    FROM tmp
    ORDER BY event_month ASC, repo_name
)
SELECT * FROM tmp1;
