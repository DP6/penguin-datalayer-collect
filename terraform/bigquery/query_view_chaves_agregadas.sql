SELECT
    PARSE_DATE('%Y%m%d', FORMAT_DATETIME('%Y%m%d', data)) as data,
    CONCAT(objectName, ".", keyName) AS nomeChave,
    status,
    count(distinct data) as ocorrencias
FROM
    ${table_name}
WHERE
    keyName IS NOT NULL
    AND DATE(data) = DATE_SUB(CURRENT_DATE("America/Sao_Paulo"), INTERVAL 1 DAY)
GROUP BY
    1,
    2,
    3
