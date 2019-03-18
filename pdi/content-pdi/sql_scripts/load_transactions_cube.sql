SET search_path = ${TEMP_PENTAHO_REDSHIFT_SCHEMA_NAME}${ENV_SUFFIX};

begin ;

DROP TABLE if exists temp_incremental_transactions_${CHAIN_ID};

CREATE TABLE temp_incremental_transactions_${CHAIN_ID} 
AS
SELECT *
FROM ${PRESTAGING_REDSHIFT_SCHEMA_NAME}${ENV_SUFFIX}.transactions_${CHAIN_ID}
WHERE id >(SELECT MAX(value)
           FROM temp_pentaho_processing_info_${CHAIN_ID}
           WHERE property = 'last_processed_transaction');

DROP TABLE if exists temp_transfer_details_${CHAIN_ID};

CREATE TABLE temp_transfer_details_${CHAIN_ID}
AS
SELECT a.tx_hash,
       a.block_number,
       a.status AS status,
       a.status_internal AS internal_status,
       CASE (a.status = 1 AND a.status_internal = 1)
         WHEN TRUE THEN 'success'
         ELSE 'fail'
       END AS final_status,
       a.rule_id,
       LOWER(a.meta_type) as meta_type,
       LOWER(a.meta_name) as meta_name,
       a.token_id,
       a.gas_used,
       a.block_timestamp,
       (a.block_timestamp / 3600)::INTEGER AS rounded_date_timestamp,
       MOD(a.block_timestamp,3600)::INTEGER AS rounded_time_timestamp,
       COUNT(1) AS total_transfers,
       SUM(amount) AS total_transfer_amount
FROM temp_incremental_transactions_${CHAIN_ID} as a
  JOIN ${PRESTAGING_REDSHIFT_SCHEMA_NAME}${ENV_SUFFIX}.transfers_${CHAIN_ID} as b 
  ON a.tx_hash = b.tx_hash
WHERE a.kind = 1
and (a.token_id is not null) 
AND (a.token_id > 0)
GROUP BY 1,
         2,
         3,
         4,
         5,
         6,
         7,
         8,
         9,
         10,
         11,
         12,
         13;

DROP TABLE IF EXISTS temp_aggregated_transfers_details_${CHAIN_ID};

CREATE TABLE temp_aggregated_transfers_details_${CHAIN_ID} 
AS
SELECT rounded_time_timestamp,
       rounded_date_timestamp,
       token_id,
       meta_type,
       meta_name,
       status,
       COUNT(1) AS total_transactions,
       SUM(total_transfers) AS total_transfers,
       SUM(total_transfer_amount) as total_volume,
       SUM(gas_used) AS total_gas_used
FROM temp_transfer_details_${CHAIN_ID}
GROUP BY 1,
         2,
         3,
         4,
         5,
         6
         order by rounded_date_timestamp, rounded_time_timestamp;;

Update temp_pentaho_processing_info_${CHAIN_ID} 
set value = (select COALESCE(max(id), -1) from temp_incremental_transactions_${CHAIN_ID})
where  property ='last_processed_transaction';


commit;