SELECT
    /*+ read_from_storage(tiflash[github_events]) */
    COUNT(*) AS cnt,
    max(created_at) AS latest_created_at
FROM github_events;
