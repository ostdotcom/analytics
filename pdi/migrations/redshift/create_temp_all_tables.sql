-- WbVarDef ENV_SUFFIX=_d6;
-- WbVarDef SUB_ENV=main;
-- WbVarDef TEMP_PENTAHO_REDSHIFT_SCHEMA_PREFIX=temp_ost_pentaho;
-- WbVarDef ORIGIN_CHAIN_ID=100;


begin;

CREATE SCHEMA IF NOT EXISTS  ${TEMP_PENTAHO_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX};
set search_path=${TEMP_PENTAHO_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX};


DROP TABLE IF EXISTS temp_incremental_chain_transactions_origin;
CREATE TABLE temp_incremental_chain_transactions_origin
(
  tx_hash               VARCHAR(66) NOT NULL,
  from_address          VARCHAR(42) NOT NULL,
  chain_type            VARCHAR(20) NOT NULL,
  chain_id              INT NOT NULL,
  token_id              INT,
  kind                  INT,
  block_timestamp       INT NOT NULL,
  rounded_date_timestamp       INT NOT NULL,
  tx_status          varchar(20)  NOT NULL,
  gas_price             BIGINT NOT NULL,
  gas_used              INT NOT NULL,
  gas_limit             INT NOT NULL
)
  DISTKEY (tx_hash) SORTKEY (chain_id, block_timestamp);
 commit;
