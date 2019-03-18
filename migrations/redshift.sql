set search_path= ost_warehouse_${SUB_ENVIRONMENT}${ENV_PREFIX};



DROP TABLE IF EXISTS temp_transactions_${CHAIN_ID};
CREATE TABLE temp_transactions_${CHAIN_ID}
(
  id                    BIGINT NOT NULL IDENTITY(1,1), //
  tx_uuid               VARCHAR(36), //
  tx_hash               VARCHAR(66) NOT NULL, //
  gas_used              INT NOT NULL, //
  gas_limit             INT NOT NULL,  //
  gas_price             BIGINT NOT NULL,  //
  status                BOOL NOT NULL, //
  status_internal       BOOL NOT NULL, //
  block_number          BIGINT NOT NULL, //
  block_timestamp       INT NOT NULL,  //
  from_address          VARCHAR(42) NOT NULL, //
  to_address            VARCHAR(42), //
  contract_address      VARCHAR(42), //
  total_token_transfers INT, //
  value                 BIGINT NOT NULL,//
  meta_type             VARCHAR(255), //
  meta_name             VARCHAR(255), //
  token_id              INT, //
  kind                  INT, //
  rule_id               INT //
)
  DISTKEY (tx_hash) SORTKEY (block_number, kind);
commit;


DROP TABLE IF EXISTS transactions_${CHAIN_ID};
CREATE TABLE transactions_${CHAIN_ID}
(
  id                    BIGINT NOT NULL IDENTITY(1,1), //
  tx_uuid               VARCHAR(36), //
  tx_hash               VARCHAR(66) NOT NULL, //
  gas_used              INT NOT NULL, //
  gas_limit             INT NOT NULL,  //
  gas_price             BIGINT NOT NULL,  //
  status                BOOL NOT NULL, //
  status_internal       BOOL NOT NULL, //
  block_number          BIGINT NOT NULL, //
  block_timestamp       INT NOT NULL,  //
  from_address          VARCHAR(42) NOT NULL, //
  to_address            VARCHAR(42), //
  contract_address      VARCHAR(42), //
  total_token_transfers INT, //
  value                 BIGINT NOT NULL,//
  meta_type             VARCHAR(255), //
  meta_name             VARCHAR(255), //
  token_id              INT, //
  kind                  INT, //
  rule_id               INT //
)
  DISTKEY (tx_hash) SORTKEY (block_number, kind);
commit;


DROP TABLE IF EXISTS temp_transfers_${CHAIN_ID};
CREATE TABLE temp_transfers_${CHAIN_ID}
(
  id                    BIGINT NOT NULL IDENTITY(1,1),
  tx_hash          VARCHAR(255) NOT NULL,
  event_index      INT          NOT NULL,
  block_number     BIGINT       NOT NULL,
  from_address     VARCHAR(255) NOT NULL,
  to_address       VARCHAR(255),
  contract_address VARCHAR(255),
  amount           BIGINT       NOT NULL
)
  DISTKEY (tx_hash) SORTKEY(block_number);




DROP TABLE IF EXISTS transfers_${CHAIN_ID};
CREATE TABLE transfers_${CHAIN_ID}
(
  id                    BIGINT NOT NULL IDENTITY(1,1),
  tx_hash          VARCHAR(255) NOT NULL,
  event_index      INT          NOT NULL,
  block_number     BIGINT       NOT NULL,
  from_address     VARCHAR(255) NOT NULL,
  to_address       VARCHAR(255) NOT NULL,
  contract_address VARCHAR(255) NOT NULL,
  amount           BIGINT       NOT NULL
)
DISTKEY (tx_hash) SORTKEY(block_number);




DROP TABLE IF EXISTS data_processing_info;
CREATE TABLE data_processing_info
(
  property VARCHAR(255) NOT NULL,
  value    BIGINT       NOT NULL
)
  DISTKEY (property);
COMMIT;



DROP TABLE IF EXISTS tokens_${CHAIN_ID};
CREATE TABLE tokens_${CHAIN_ID}
(
  token_id                  INT NOT NULL,
  client_id                 int NOT NULL,
  name                      VARCHAR(255) NOT NULL,
  symbol                    VARCHAR(255) NOT NULL,
  conversion_factor         decimal(15,6) NOT NULL,
  decimal                   int NULL,
  delayed_recovery_interval int NOT NULL,
  status                    tinyint NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
)SORTKEY(token_id);