-- If want to run from sql workbench uncomment variables and replace curly bracket by square bracket
-- WbVarDef ENV_SUFFIX=_d7;
-- WbVarDef SUB_ENV=main;
-- WbVarDef PRESTAGING_REDSHIFT_SCHEMA_PREFIX=ost_warehouse;


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


DROP TABLE IF EXISTS temp_transactions_origin;
CREATE TABLE temp_transactions_origin
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


DROP TABLE IF EXISTS transactions_origin;
CREATE TABLE transactions_origin
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


DROP TABLE IF EXISTS temp_transfers_origin;
CREATE TABLE temp_transfers_origin
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



DROP TABLE IF EXISTS transfers_origin;
CREATE TABLE transfers_origin
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


DROP TABLE IF EXISTS temp_tokens;
CREATE TABLE temp_tokens
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


DROP TABLE IF EXISTS tokens;
CREATE TABLE tokens
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


DROP TABLE IF EXISTS temp_workflows;
CREATE TABLE temp_workflows
(
  id                        BIGINT NOT NULL,
  kind                      INT NOT NULL,
  client_id                 INT,
  unique_hash               VARCHAR(255),
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
)DISTKEY (id) SORTKEY(id);

DROP TABLE IF EXISTS workflows;
CREATE TABLE workflows
(
  id                        BIGINT NOT NULL,
  kind                      INT NOT NULL,
  client_id                 INT,
  unique_hash               VARCHAR(255),
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
)DISTKEY (id) SORTKEY(id);

DROP TABLE IF EXISTS temp_workflow_steps;
CREATE TABLE temp_workflow_steps
(
  id                        BIGINT NOT NULL,
  workflow_id               BIGINT NOT NULL,
  kind                      INT NOT NULL,
  transaction_hash          VARCHAR(66),
  status                    INT,
  unique_hash               VARCHAR(255),
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
)DISTKEY (id) SORTKEY(transaction_hash);

DROP TABLE IF EXISTS workflow_steps;
CREATE TABLE workflow_steps
(
  id                        BIGINT NOT NULL,
  workflow_id               BIGINT NOT NULL,
  kind                      INT NOT NULL,
  transaction_hash          VARCHAR(66),
  status                    INT,
  unique_hash               VARCHAR(255),
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
)DISTKEY (id) SORTKEY(transaction_hash);

DROP TABLE IF EXISTS temp_chain_addresses;
CREATE TABLE temp_chain_addresses
(
  id                        BIGINT NOT NULL,
  associated_aux_chain_id   INT NOT NULL,
  kind                      INT NOT NULL,
  address                   VARCHAR(42) NOT NULL,
  known_address_id          INT,
  deployed_chain_id         INT,
  deployed_chain_kind       INT,
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
)DISTKEY (id) SORTKEY(address);

DROP TABLE IF EXISTS chain_addresses;
CREATE TABLE chain_addresses
(
  id                        BIGINT NOT NULL,
  associated_aux_chain_id   INT NOT NULL,
  kind                      INT NOT NULL,
  address                   VARCHAR(42) NOT NULL,
  known_address_id          INT,
  deployed_chain_id         INT,
  deployed_chain_kind       INT,
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
)DISTKEY (id) SORTKEY(address);

DROP TABLE IF EXISTS temp_token_addresses;
CREATE TABLE temp_token_addresses
(
  id                        BIGINT NOT NULL,
  token_id                  INT NOT NULL,
  kind                      INT NOT NULL,
  address                   VARCHAR(42) NOT NULL,
  deployed_chain_id         INT,
  deployed_chain_kind       INT,
  status                    INT NOT NULL,
  known_address_id          INT,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
)DISTKEY (id) SORTKEY(address);

DROP TABLE IF EXISTS token_addresses;
CREATE TABLE token_addresses
(
  id                        BIGINT NOT NULL,
  token_id                  INT NOT NULL,
  kind                      INT NOT NULL,
  address                   VARCHAR(42) NOT NULL,
  deployed_chain_id         INT,
  deployed_chain_kind       INT,
  status                    INT NOT NULL,
  known_address_id          INT,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
)DISTKEY (id) SORTKEY(address);

DROP TABLE IF EXISTS temp_staker_whitelisted_addresses;
CREATE TABLE temp_staker_whitelisted_addresses
(
  id                        BIGINT NOT NULL,
  token_id                  INT NOT NULL,
  staker_address            VARCHAR(42) NOT NULL,
  gateway_composer_address  VARCHAR(42) NOT NULL,
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
)DISTKEY (id) SORTKEY(staker_address);

DROP TABLE IF EXISTS staker_whitelisted_addresses;
CREATE TABLE staker_whitelisted_addresses
(
  id                        BIGINT NOT NULL,
  token_id                  INT NOT NULL,
  staker_address            VARCHAR(42) NOT NULL,
  gateway_composer_address  VARCHAR(42) NOT NULL,
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
)DISTKEY (id) SORTKEY(staker_address);


-- dont run the below create table code when you are renaming the table name on production
DROP TABLE IF EXISTS data_processing_info;
CREATE TABLE data_processing_info
(
  property  varchar(255)   NOT NULL,
  value     varchar(255)   NOT NULL
);

INSERT INTO data_processing_info
(  property,  value)VALUES( 'last_processed_block_origin', '-1');


INSERT INTO data_processing_info
(  property,  value)VALUES( 'token_last_updated_at', '1970-01-01 00:00:00');

INSERT INTO data_processing_info
(  property,  value)VALUES( 'workflow_last_updated_at', '1970-01-01 00:00:00');

INSERT INTO data_processing_info
(  property,  value)VALUES( 'workflow_steps_last_updated_at', '1970-01-01 00:00:00');

INSERT INTO data_processing_info
(  property,  value)VALUES( 'chain_addresses_last_updated_at', '1970-01-01 00:00:00');

INSERT INTO data_processing_info
(  property,  value)VALUES( 'token_addresses_last_updated_at', '1970-01-01 00:00:00');

INSERT INTO data_processing_info
(  property,  value)VALUES( 'staker_whitelisted_addresses_last_updated_at', '1970-01-01 00:00:00');


DROP TABLE IF EXISTS rds_instance_logs;

CREATE TABLE rds_instance_logs
(
  id                    BIGINT NOT NULL IDENTITY(1,1),
  creation_time          BIGINT NOT NULL,
  instance_identifier   VARCHAR(255) NOT NULL,
  host                  VARCHAR(255),
  aws_status            VARCHAR(255) NOT NULL,
  cron_status           VARCHAR(255) NOT NULL,
  error_log             VARCHAR(1024),
  last_action_time      BIGINT NOT NULL,
  created_at            datetime NOT NULL,
  updated_at            datetime NOT NULL
)DISTKEY(id) SORTKEY(aws_status);

COMMIT;