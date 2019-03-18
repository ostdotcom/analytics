

CREATE SCHEMA IF NOT EXISTS  ost_pentaho_sandbox_s6 AUTHORIZATION ost_pentaho_stag_user;
set search_path to ost_pentaho_sandbox_s6;

DROP TABLE IF EXISTS transactions_${CHAIN_ID};
CREATE TABLE transactions_${CHAIN_ID}
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

DROP TABLE IF EXISTS all_transfer_details_${CHAIN_ID};
CREATE TABLE all_transfer_details_${CHAIN_ID}
(
  tx_hash               VARCHAR(255) NOT NULL,
  block_number          BIGINT NOT NULL,
  status                VARCHAR(20)  NOT NULL,
  status_internal       VARCHAR(20)  NOT NULL,
  final_status          VARCHAR(20)  NOT NULL,
  rule_id               BIGINT NOT NULL
  meta_type             VARCHAR(255) NOT NULL,
  meta_name             VARCHAR(255) NOT NULL,
  token_id              BIGINT NOT NULL,
  gas_used              BIGINT NOT NULL,
  block_timestamp       BIGINT NOT NULL,
  rounded_date_timestamp       BIGINT NOT NULL,
  rounded_time_timestamp       BIGINT NOT NULL,
  total_transfers              BIGINT NOT NULL, 
  total_transfer_amount       BIGINT NOT NULL
)
DISTKEY (tx_hash) SORTKEY (block_number, kind);
commit;














CREATE SCHEMA IF NOT EXISTS  ost_warehouse_sandbox_s6 AUTHORIZATION ost_pentaho_stag_user;
set search_path=ost_warehouse_sandbox_s6;



DROP TABLE IF EXISTS transactions_${CHAIN_ID};
CREATE TABLE transactions_${CHAIN_ID}
(
  transaction_uuid    VARCHAR(255) NOT NULL,
  transaction_hash    VARCHAR(255) NOT NULL,
  gas_used            BIGINT NOT NULL,
  status              VARCHAR(20) NOT NULL,
  status_internal     VARCHAR(20) NOT NULL,
  block_number        BIGINT NOT NULL,
  value               BIGINT NOT NULL,
  token_id            BIGINT NOT NULL,
  kind                INT NOT NULL
)
DISTKEY (transaction_hash) SORTKEY (block_number, kind);

DROP TABLE IF EXISTS tokens_${CHAIN_ID};
CREATE TABLE tokens_${CHAIN_ID}
(
  token_id            BIGINT NOT NULL,
  symbol              VARCHAR(255) NOT NULL,
  conversion_factor   decimal(15,6) NOT NULL,
  decimal             int NOT NULL
)
DISTKEY (token_id);

DROP TABLE IF EXISTS transfers_${CHAIN_ID};
CREATE TABLE transfers_${CHAIN_ID}
(
  transaction_hash    VARCHAR(255) NOT NULL,
  event_index         INT NOT NULL,
  block_number        BIGINT NOT NULL,
  contract_address    VARCHAR(255) NOT NULL,
  amount              BIGINT NOT NULL
)
DISTKEY (transaction_hash) SORTKEY (block_number);

commit;






