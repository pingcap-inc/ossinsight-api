WITH stars AS (
    SELECT
        event_month,
        actor_login,
        FIRST_VALUE(repo_name) OVER (PARTITION BY repo_id ORDER BY created_at DESC) AS repo_name,
        ROW_NUMBER() OVER(PARTITION BY actor_login) AS row_num
    FROM github_events
    USE INDEX(index_github_events_on_repo_id)
    WHERE
        type = 'WatchEvent'
        AND repo_id IN (41986369, 16563587, 105944401)
), prs AS (
    SELECT
        event_month,
        actor_login,
        FIRST_VALUE(repo_name) OVER (PARTITION BY repo_id ORDER BY created_at DESC) AS repo_name,
        ROW_NUMBER() OVER(PARTITION BY actor_login) AS row_num
    FROM github_events
    USE INDEX(index_github_events_on_repo_id)
    WHERE
        type = 'PullRequestEvent'
        AND action = 'opened'
        AND repo_id IN (41986369, 16563587, 105944401)
), issues AS (
    SELECT
        event_month,
        actor_login,
        FIRST_VALUE(repo_name) OVER (PARTITION BY repo_id ORDER BY created_at DESC) AS repo_name,
        ROW_NUMBER() OVER(PARTITION BY actor_login) AS row_num
    FROM github_events
    USE INDEX(index_github_events_on_repo_id)
    WHERE
        type = 'IssuesEvent'
        AND action = 'opened'
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
), prs_group_by_month AS (
    SELECT
        event_month,
        repo_name,
        count(*) AS total
    FROM prs
    WHERE row_num = 1
    GROUP BY event_month, repo_name
    ORDER BY repo_name, event_month
), prs_current_month AS (
    SELECT
        event_month,
        repo_name,
        total,
        RANK() OVER(PARTITION BY event_month ORDER BY total DESC) AS `rank`
    FROM prs_group_by_month sgn
    WHERE event_month = DATE_FORMAT(date_sub(now(), interval DAYOFMONTH(now()) day), '%Y-%m-01')
), prs_last_month AS (
    SELECT
        event_month,
        repo_name,
        total,
        RANK() OVER(PARTITION BY event_month ORDER BY total DESC) AS `rank`
    FROM prs_group_by_month sgn
    WHERE event_month = DATE_FORMAT(date_sub(date_sub(now(), interval DAYOFMONTH(now()) day), interval 1 month), '%Y-%m-01')
), issues_group_by_month AS (
    SELECT
        event_month,
        repo_name,
        count(*) AS total
    FROM issues
    WHERE row_num = 1
    GROUP BY event_month, repo_name
    ORDER BY repo_name, event_month
), issues_current_month AS (
    SELECT
        event_month,
        repo_name,
        total,
        RANK() OVER(PARTITION BY event_month ORDER BY total DESC) AS `rank`
    FROM issues_group_by_month sgn
    WHERE event_month = DATE_FORMAT(date_sub(now(), interval DAYOFMONTH(now()) day), '%Y-%m-01')
), issues_last_month AS (
    SELECT
        event_month,
        repo_name,
        total,
        RANK() OVER(PARTITION BY event_month ORDER BY total DESC) AS `rank`
    FROM issues_group_by_month sgn
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
    -- Issues
    icm.total AS issues_current_month,
    icm.`rank` AS issues_rank_current_month,
    ilm.total AS issues_last_month,
    ilm.`rank` AS issues_rank_last_month,
    ((icm.total - ilm.total) / ilm.total) * 100 AS issues_mom,
    (icm.`rank` - ilm.`rank`) AS issues_rank_mom,
    -- PRs
    pcm.total AS prs_current_month,
    pcm.`rank` AS prs_rank_current_month,
    plm.total AS prs_last_month,
    plm.`rank` AS prs_rank_last_month,
    ((pcm.total - plm.total) / plm.total) * 100 AS prs_mom,
    (pcm.`rank` - plm.`rank`) AS prs_rank_mom    
FROM stars_current_month scm
JOIN stars_last_month slm ON scm.repo_name = slm.repo_name
JOIN prs_current_month pcm ON scm.repo_name = pcm.repo_name
JOIN prs_last_month plm ON pcm.repo_name = plm.repo_name
JOIN issues_current_month icm ON scm.repo_name = icm.repo_name
JOIN issues_last_month ilm ON icm.repo_name = ilm.repo_name
