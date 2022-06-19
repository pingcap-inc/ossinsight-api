SELECT 
    /*+ read_from_storage(tiflash[ge]), MAX_EXECUTION_TIME(120000) */
    actor_id, ANY_VALUE(actor_login) AS actor_login, COUNT(*) AS contributions
FROM github_events ge
WHERE
    type IN ('PullRequestEvent', 'IssuesEvent', 'PullRequestReviewEvent', 'PushEvent')
    AND actor_login IS NOT NULL
    AND (
        (type = 'PullRequestEvent' AND action = 'opened') OR
        (type = 'IssuesEvent' AND action = 'opened') OR  
        (type = 'PullRequestReviewEvent' AND action = 'created') OR
        (type = 'PushEvent')
    )
GROUP BY actor_id
ORDER BY contributions DESC
LIMIT 20