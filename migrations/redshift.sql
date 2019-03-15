set search_path to ost_warehouse_sandbox_s6;
DROP TABLE IF EXISTS transactions_199;
CREATE TABLE transactions_199
(
  id                    BIGINT NOT NULL IDENTITY(1,1),
  tx_uuid               VARCHAR(255) NOT NULL,
  tx_hash               VARCHAR(255) NOT NULL,
  gas_used              BIGINT NOT NULL,
  status                VARCHAR(20)  NOT NULL,
  status_internal       VARCHAR(20)  NOT NULL,
  block_number          BIGINT NOT NULL,
  block_timestamp       BIGINT NOT NULL,
  from_address          VARCHAR(255) NOT NULL,
  to_address            VARCHAR(255) NOT NULL,
  contract_address      VARCHAR(255) NOT NULL,
  total_token_transfers BIGINT NOT NULL,
  value                 BIGINT NOT NULL,
  meta_type             VARCHAR(255) NOT NULL,
  meta_name             VARCHAR(255) NOT NULL,
  token_id              BIGINT NOT NULL,
  kind                  INT NOT NULL,
  rule_id               BIGINT NOT NULL
)
  DISTKEY (tx_hash) SORTKEY (block_number, kind);
commit;

DROP TABLE IF EXISTS transfers_199;
CREATE TABLE transfers_199
(
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
  DISTKEY
  (property);
COMMIT;



DROP TABLE IF EXISTS tokens;
CREATE TABLE tokens
(
  token_id          BIGINT         NOT NULL,
  symbol            VARCHAR(255)   NOT NULL,
  conversion_factor decimal(15, 6) NOT NULL,
  decimal           int            NOT NULL,
  from_address      VARCHAR(255)   NOT NULL,
  to_address        VARCHAR(255)   NOT NULL,
)