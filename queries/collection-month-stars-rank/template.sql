WITH stars AS (
    SELECT
        event_month,
        actor_login,
        FIRST_VALUE(repo_name) OVER (PARTITION BY actor_login ORDER BY created_at DESC) AS repo_name,
        ROW_NUMBER() OVER(PARTITION BY actor_id) AS row_num
    FROM github_events
    USE INDEX(index_github_events_on_repo_id)
    WHERE
        type = 'WatchEvent'
        AND repo_id IN (41986369, 16563587, 105944401)
), stars_group_by_month AS (
    SELECT
        event_month,
        repo_name,
        count(*) AS total
    FROM stars
    WHERE row_num = 1
    GROUP BY event_month, repo_name
    ORDER BY repo_name, event_month
), stars_group_by_repo AS (
    SELECT
        repo_name,
        count(*) AS total
    FROM stars
    GROUP BY repo_name
    ORDER BY repo_name
), stars_current_month AS (
    SELECT
        event_month,
        repo_name,
        total,
        RANK() OVER(PARTITION BY event_month ORDER BY total DESC) AS `rank`
    FROM stars_group_by_month sgn
    WHERE event_month = DATE_FORMAT(date_sub(now(), interval DAYOFMONTH(now()) day), '%Y-%m-01')
), stars_last_month AS (
    SELECT
        event_month,
        repo_name,
        total,
        RANK() OVER(PARTITION BY event_month ORDER BY total DESC) AS `rank`
    FROM stars_group_by_month sgn
    WHERE event_month = DATE_FORMAT(date_sub(date_sub(now(), interval DAYOFMONTH(now()) day), interval 1 month), '%Y-%m-01')
)
SELECT
    scm.repo_name,
    DATE_FORMAT(date_sub(now(), interval DAYOFMONTH(now()) day), '%Y-%m') AS current_month,
    DATE_FORMAT(date_sub(date_sub(now(), interval DAYOFMONTH(now()) day), interval 1 month), '%Y-%m') AS last_month,
    -- Stars
    scm.total AS stars_current_month,
    scm.`rank` AS stars_rank_current_month,
    slm.total AS stars_last_month,
    slm.`rank` AS stars_rank_last_month,
    ((scm.total - slm.total) / slm.total) * 100 AS stars_mom,
    (scm.`rank` - slm.`rank`) AS stars_rank_mom,
    sgr.total AS stars_total
FROM stars_group_by_repo sgr 
JOIN stars_current_month scm ON sgr.repo_name = scm.repo_name
JOIN stars_last_month slm ON scm.repo_name = slm.repo_name
;