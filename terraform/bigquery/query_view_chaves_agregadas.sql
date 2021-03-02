SELECT
    FORMAT_DATETIME('%Y%m%d', DATA) as data,
    CONCAT(objectName, ".", keyName) AS nomeChave,
    status
FROM
    ${table_name}
WHERE
    keyName IS NOT NULL
GROUP BY
    1,
    2,
    3
ORDER BY
    DATA DESC