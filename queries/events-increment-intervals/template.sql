SELECT
    COUNT(*) AS cnt,
    MAX(created_at) AS latest_created_at,
    UNIX_TIMESTAMP(MAX(created_at)) AS latest_timestamp
FROM github_events
WHERE
    created_at BETWEEN (UTC_TIMESTAMP - INTERVAL 6 MINUTE) AND (UTC_TIMESTAMP - INTERVAL 5 MINUTE)
GROUP BY (
   (UNIX_TIMESTAMP(created_at) - UNIX_TIMESTAMP(UTC_TIMESTAMP - INTERVAL 6 MINUTE)) - (UNIX_TIMESTAMP(created_at) - UNIX_TIMESTAMP(UTC_TIMESTAMP - INTERVAL 6 MINUTE)) % 5
)
ORDER BY latest_timestamp
;