SELECT 
    /*+ read_from_storage(tiflash[ge]), MAX_EXECUTION_TIME(120000) */
    actor_id, ANY_VALUE(actor_login) AS actor_login, COUNT(*) AS contributions
FROM github_events ge
WHERE
    type = 'PushEvent'
    AND event_year = 2022
    AND actor_login NOT LIKE '%[bot]'
    AND actor_login NOT LIKE '%bot'
    AND actor_login NOT IN ('gzwqvg3179', 'znyt')
GROUP BY actor_id
ORDER BY contributions DESC
LIMIT 20