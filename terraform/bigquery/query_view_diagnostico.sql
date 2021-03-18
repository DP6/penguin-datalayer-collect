SELECT
    PARSE_DATE('%Y%m%d', FORMAT_DATETIME('%Y%m%d', data)) as data,
    COUNT(data) as total_validacoes,
    SUM(disparos_erros) as disparos_erros,
    SUM(disparos_ok) as disparos_ok
FROM
    (
        SELECT
            data,
            COUNT(distinct keyName) as disparos_erros,
            COUNTIF(status = "OK") as disparos_ok
        FROM
            ${table_name}
        WHERE
            DATE(data) = DATE_SUB(CURRENT_DATE("America/Sao_Paulo"), INTERVAL 1 DAY)
        GROUP BY
            1
    )
GROUP BY
    1