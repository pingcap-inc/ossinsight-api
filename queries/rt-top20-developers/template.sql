SELECT
    /*+ read_from_storage(tiflash[github_events]), MAX_EXECUTION_TIME(120000) */
    actor_login, count(*) as pr_count
FROM
    github_events
    JOIN db_repos db ON db.id = github_events.repo_id
WHERE
    type = 'PullRequestEvent'
    AND action = 'opened'
    AND actor_login NOT LIKE '%bot%'
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20
