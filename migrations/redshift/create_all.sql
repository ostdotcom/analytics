-- If want to run from sql workbench uncomment variables and replace curly bracket by square bracket
-- WbVarDef ENV_SUFFIX=_d7;
-- WbVarDef SUB_ENV=main;
-- WbVarDef PRESTAGING_REDSHIFT_SCHEMA_PREFIX=ost_warehouse;
-- WbVarDef CHAIN_ID=202;


--   GRANT ALL
--   ON ALL TABLES IN SCHEMA ${PRESTAGING_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX}
--   TO analytics_user;
--   GRANT ALL
--   ON SCHEMA ${PRESTAGING_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX}
--   TO analytics_user;
--   COMMIT;
--





create schema if not exists ${PRESTAGING_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX};
set search_path= ${PRESTAGING_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX};

DROP TABLE IF EXISTS temp_workflows;
CREATE TABLE temp_workflows
(
  id                        BIGINT NOT NULL,
  kind                      INT NOT NULL,
  client_id                 INT,
  unique_hash               VARCHAR(255),
  status                    INT,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS workflows;
CREATE TABLE workflows
(
  id                        BIGINT NOT NULL,
  kind                      INT NOT NULL,
  client_id                 INT,
  unique_hash               VARCHAR(255),
  status                    INT,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS temp_workflow_steps;
CREATE TABLE temp_workflow_steps
(
  id                        BIGINT NOT NULL,
  workflow_id               BIGINT,
  kind                      INT NOT NULL,
  transaction_hash          VARCHAR(255),
  status                    INT,
  unique_hash               VARCHAR(255),
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS workflow_steps;
CREATE TABLE workflow_steps
(
  id                        BIGINT NOT NULL,
  workflow_id               BIGINT,
  kind                      INT NOT NULL,
  transaction_hash          VARCHAR(255),
  status                    INT,
  unique_hash               VARCHAR(255),
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS temp_chain_addresses;
CREATE TABLE temp_chain_addresses
(
  id                        BIGINT NOT NULL,
  associated_aux_chain_id   INT NOT NULL,
  kind                      INT NOT NULL,
  address                   VARCHAR(255) NOT NULL,
  known_address_id          INT,
  deployed_chain_id         INT,
  deployed_chain_kind       INT,
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS chain_addresses;
CREATE TABLE chain_addresses
(
  id                        BIGINT NOT NULL,
  associated_aux_chain_id   INT NOT NULL,
  kind                      INT NOT NULL,
  address                   VARCHAR(255) NOT NULL,
  known_address_id          INT,
  deployed_chain_id         INT,
  deployed_chain_kind       INT,
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS temp_token_addresses;
CREATE TABLE temp_token_addresses
(
  id                        BIGINT NOT NULL,
  token_id                  INT NOT NULL,
  kind                      INT NOT NULL,
  address                   VARCHAR(255) NOT NULL,
  deployed_chain_id         INT,
  deployed_chain_kind       INT,
  status                    INT NOT NULL,
  known_address_id          INT,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS token_addresses;
CREATE TABLE token_addresses
(
  id                        BIGINT NOT NULL,
  token_id                  INT NOT NULL,
  kind                      INT NOT NULL,
  address                   VARCHAR(255) NOT NULL,
  deployed_chain_id         INT,
  deployed_chain_kind       INT,
  status                    INT NOT NULL,
  known_address_id          INT,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS temp_staker_whitelisted_addresses;
CREATE TABLE temp_staker_whitelisted_addresses
(
  id                        BIGINT NOT NULL,
  token_id                  INT NOT NULL,
  staker_address            VARCHAR(255) NOT NULL,
  gateway_composer_address  VARCHAR(255) NOT NULL,
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS staker_whitelisted_addresses;
CREATE TABLE staker_whitelisted_addresses
(
  id                        BIGINT NOT NULL,
  token_id                  INT NOT NULL,
  staker_address            VARCHAR(255) NOT NULL,
  gateway_composer_address  VARCHAR(255) NOT NULL,
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);


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



-- dont run the below create table code when you are renaming the table name on production
DROP TABLE IF EXISTS data_processing_info;
CREATE TABLE data_processing_info
(
  property  varchar(255)   NOT NULL,
  value     varchar(255)   NOT NULL
);

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


INSERT INTO data_processing_info
(  property,  value)VALUES( 'token_last_updated_at', '1970-01-01 00:00:00');
-- COMMIT;
