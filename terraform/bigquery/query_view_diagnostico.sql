SELECT
    data,
    COUNT(distinct keyName) as disparos_erros,
    COUNTIF(status = "OK") as disparos_ok
FROM
    ${table_name}
GROUP BY
    1
ORDER BY
    DATA DESC