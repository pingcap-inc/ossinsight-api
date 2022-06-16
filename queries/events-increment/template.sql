SELECT
    COUNT(*) AS cnt,
    MAX(created_at) AS latest_created_at,
    UNIX_TIMESTAMP(MAX(created_at)) AS latest_timestamp
FROM github_events
WHERE
    created_at BETWEEN FROM_UNIXTIME(1655366243) AND (UTC_TIMESTAMP - INTERVAL 5 MINUTE)
    AND FROM_UNIXTIME(1655366243) > (UTC_TIMESTAMP - INTERVAL 4 HOUR);