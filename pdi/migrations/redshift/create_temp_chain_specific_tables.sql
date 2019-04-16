-- WbVarDef ENV_SUFFIX=_d6;
-- WbVarDef SUB_ENV=main;
-- WbVarDef TEMP_PENTAHO_REDSHIFT_SCHEMA_PREFIX=temp_ost_pentaho;
-- WbVarDef CHAIN_ID=202;

begin;

CREATE SCHEMA IF NOT EXISTS  ${TEMP_PENTAHO_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX};
set search_path=${TEMP_PENTAHO_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX};


DROP TABLE IF EXISTS temp_pentaho_processing_info_${CHAIN_ID};
CREATE TABLE temp_pentaho_processing_info_${CHAIN_ID}
(
  property    VARCHAR(255) NOT NULL,
  value               BIGINT NOT NULL
);

INSERT INTO temp_pentaho_processing_info_${CHAIN_ID}
(
  property,
  value
)
VALUES
(
  'last_processed_aux_transaction_insert_timestamp',
  0
);

INSERT INTO temp_pentaho_processing_info_${CHAIN_ID}
(
  property,
  value
)
VALUES
(
  'last_updated_token_timestamp',
  0
);  

commit;

BEGIN;

DROP TABLE IF EXISTS temp_incremental_chain_transactions_aux_${CHAIN_ID};
CREATE TABLE temp_incremental_chain_transactions_aux_${CHAIN_ID}
(
  tx_hash               VARCHAR(66) NOT NULL,
  from_address          VARCHAR(42) NOT NULL,
  chain_type            VARCHAR(20) NOT NULL,
  chain_id              INT NOT NULL,
  token_id              INT,
  tx_kind                  INT,
  block_timestamp       INT NOT NULL,
  tx_status          varchar(20)  NOT NULL,
  gas_price             BIGINT NOT NULL,
  gas_used              INT NOT NULL,
  gas_limit             INT NOT NULL
)
  DISTKEY (tx_hash) SORTKEY (tx_kind, tx_hash);


DROP TABLE IF EXISTS temp_incremental_chain_workflow_transactions_aux_${CHAIN_ID};
CREATE TABLE temp_incremental_chain_workflow_transactions_aux_${CHAIN_ID}
(
  tx_hash               VARCHAR(66) NOT NULL,
  from_address          VARCHAR(42) NOT NULL,
  chain_type            VARCHAR(20) NOT NULL,
  chain_id              INT NOT NULL,
  token_id              INT,
  tx_kind                  INT,
  rounded_date_timestamp       INT NOT NULL,
  tx_status          varchar(20)  NOT NULL,
  gas_price             BIGINT NOT NULL,
  gas_used              INT NOT NULL,
  gas_limit             INT NOT NULL,
  tx_fees             BIGINT NOT NULL,

  workflow_id              BIGINT,
  workflow_kind              INT,
  workflow_status              INT,
  rounded_workflow_create_timestamp              INT
)
  DISTKEY (tx_hash) SORTKEY (workflow_kind);

DROP TABLE IF EXISTS temp_incremental_chain_workflow_transactions_sk_aux_${CHAIN_ID};
CREATE TABLE temp_incremental_chain_workflow_transactions_sk_aux_${CHAIN_ID}
(
  tx_hash               VARCHAR(66) NOT NULL,
  from_address          VARCHAR(42) NOT NULL,
  from_address_type          VARCHAR(20) NOT NULL,
  chain_type            VARCHAR(20) NOT NULL,
  chain_id              INT NOT NULL,
  token_id              INT,
  token_sk              INT not null,
  tx_kind                  INT,
  tx_date_sk       INT NOT NULL,
  tx_status          varchar(20)  NOT NULL,
  gas_price             BIGINT NOT NULL,
  gas_used              INT NOT NULL,
  gas_limit             INT NOT NULL,
  tx_fees             BIGINT NOT NULL,

  workflow_id              BIGINT,
  workflow_kind_sk              BIGINT,
  workflow_kind              INT,
  workflow_status              INT,
  rounded_workflow_create_timestamp              INT,
  workflow_date_sk INT NOT NULL
)
  DISTKEY (tx_hash) SORTKEY (workflow_kind);

 commit;