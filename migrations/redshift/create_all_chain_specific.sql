-- If want to run from sql workbench uncomment variables and replace curly bracket by square bracket
-- WbVarDef ENV_SUFFIX=_d7;
-- WbVarDef SUB_ENV=main;
-- WbVarDef PRESTAGING_REDSHIFT_SCHEMA_PREFIX=ost_warehouse;
-- WbVarDef AUX_CHAIN_ID=202;


--   GRANT ALL
--   ON ALL TABLES IN SCHEMA ${PRESTAGING_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX}
--   TO analytics_user;
--   GRANT ALL
--   ON SCHEMA ${PRESTAGING_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX}
--   TO analytics_user;
--   COMMIT;
--



begin;

create schema if not exists ${PRESTAGING_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX};
set search_path= ${PRESTAGING_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX};


DROP TABLE IF EXISTS temp_transactions_aux_${AUX_CHAIN_ID};
CREATE TABLE temp_transactions_aux_${AUX_CHAIN_ID}
(
  tx_uuid               VARCHAR(36),
  tx_hash               VARCHAR(66) NOT NULL,
  gas_used              INT NOT NULL,
  gas_limit             INT NOT NULL,
  gas_price             BIGINT NOT NULL,
  status                BOOL NOT NULL,
  status_internal       BOOL NOT NULL,
  block_number          BIGINT NOT NULL,
  block_timestamp       INT NOT NULL,
  from_address          VARCHAR(42) NOT NULL,
  to_address            VARCHAR(42),
  contract_address      VARCHAR(42),
  total_token_transfers INT NOT NULL,
  value                 DECIMAL(30,0) NOT NULL,
  meta_type             VARCHAR(255),
  meta_name             VARCHAR(255),
  token_id              INT,
  kind                  INT,
  rule_id               INT
)
  DISTKEY (tx_hash) SORTKEY (block_number, kind);


DROP TABLE IF EXISTS transactions_aux_${AUX_CHAIN_ID};
CREATE TABLE transactions_aux_${AUX_CHAIN_ID}
(
  id                    BIGINT NOT NULL IDENTITY(1,1),
  tx_uuid               VARCHAR(36),
  tx_hash               VARCHAR(66) NOT NULL,
  gas_used              INT NOT NULL,
  gas_limit             INT NOT NULL,
  gas_price             BIGINT NOT NULL,
  status                BOOL NOT NULL,
  status_internal       BOOL NOT NULL,
  block_number          BIGINT NOT NULL,
  block_timestamp       INT NOT NULL,
  from_address          VARCHAR(42) NOT NULL,
  to_address            VARCHAR(42),
  contract_address      VARCHAR(42),
  total_token_transfers INT NOT NULL,
  value                 DECIMAL(30,0) NOT NULL,
  meta_type             VARCHAR(255),
  meta_name             VARCHAR(255),
  token_id              INT,
  kind                  INT,
  rule_id               INT,
  insertion_timestamp   INT NOT NULL
)
  DISTKEY (tx_hash) SORTKEY (block_number, kind);


DROP TABLE IF EXISTS temp_transfers_aux_${AUX_CHAIN_ID};
CREATE TABLE temp_transfers_aux_${AUX_CHAIN_ID}
(
  tx_hash          VARCHAR(255) NOT NULL,
  event_index      INT          NOT NULL,
  block_number     BIGINT       NOT NULL,
  from_address     VARCHAR(255) NOT NULL,
  to_address       VARCHAR(255) NOT NULL,
  contract_address VARCHAR(255) NOT NULL,
  amount           DECIMAL(30,0) NOT NULL
)
  DISTKEY (tx_hash) SORTKEY(block_number);


DROP TABLE IF EXISTS transfers_aux_${AUX_CHAIN_ID};
CREATE TABLE transfers_aux_${AUX_CHAIN_ID}
(
  id                    BIGINT NOT NULL IDENTITY(1,1),
  tx_hash          VARCHAR(255) NOT NULL,
  event_index      INT          NOT NULL,
  block_number     BIGINT       NOT NULL,
  from_address     VARCHAR(255) NOT NULL,
  to_address       VARCHAR(255) NOT NULL,
  contract_address VARCHAR(255) NOT NULL,
  amount           DECIMAL(30,0) NOT NULL,
  insertion_timestamp             INT NOT NULL
)
DISTKEY (tx_hash) SORTKEY(block_number);


DROP TABLE IF EXISTS temp_tokens_${AUX_CHAIN_ID};
CREATE TABLE temp_tokens_${AUX_CHAIN_ID}
(
  token_id                  BIGINT NOT NULL,
  client_id                 INT,
  name                      VARCHAR(255) NOT NULL,
  symbol                    VARCHAR(255) NOT NULL,
  conversion_factor         decimal(15,6) NOT NULL,
  number_of_decimal         int NOT NULL,
  delayed_recovery_interval int NOT NULL,
  status                    int NOT NULL,
  client_id_was             INT,
  debug                     VARCHAR(255),
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
)SORTKEY(token_id);

DROP TABLE IF EXISTS tokens_${AUX_CHAIN_ID};
CREATE TABLE tokens_${AUX_CHAIN_ID}
(
  token_id                  BIGINT NOT NULL,
  client_id                 INT,
  name                      VARCHAR(255) NOT NULL,
  symbol                    VARCHAR(255) NOT NULL,
  conversion_factor         decimal(15,6) NOT NULL,
  number_of_decimal         int NOT NULL,
  delayed_recovery_interval int NOT NULL,
  status                    int NOT NULL,
  client_id_was             INT,
  debug                     VARCHAR(255),
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
)SORTKEY(token_id);

INSERT INTO data_processing_info
(  property,  value)VALUES( 'last_processed_block_aux_${AUX_CHAIN_ID}', '-1');

INSERT INTO data_processing_info
(  property,  value)VALUES( 'token_last_updated_at_${AUX_CHAIN_ID}', '1970-01-01 00:00:00');

COMMIT;