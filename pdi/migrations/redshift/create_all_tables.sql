/*
WbVarDef ENV_SUFFIX=_d6;
WbVarDef SUB_ENV=main;
WbVarDef PENTAHO_REDSHIFT_SCHEMA_PREFIX=ost_pentaho;
WbVarDef AUX_CHAIN_ID=202;
WbVarDef ORIGIN_CHAIN_ID=100;
*/

begin;

CREATE SCHEMA IF NOT EXISTS  ${PENTAHO_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX};

SET search_path = ${PENTAHO_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX};


DROP TABLE IF EXISTS chain_details;

CREATE TABLE chain_details
(
  chain_type   VARCHAR(255) NOT NULL,
  chain_id     BIGINT NOT NULL
);

INSERT INTO chain_details
(
  chain_type,
  chain_id
)
VALUES
(
  'origin',
  ${ORIGIN_CHAIN_ID}
);

commit;


BEGIN ;

DROP TABLE IF EXISTS dim_workflow_kinds;
CREATE TABLE dim_workflow_kinds
(
  workflow_kind_sk              BIGINT NOT NULL IDENTITY(0,1),
  workflow_kind              INT not null,
  name   VARCHAR(50) NOT NULL

)
  DISTKEY (workflow_kind_sk) SORTKEY (workflow_kind_sk);

INSERT INTO dim_workflow_kinds
(
  workflow_kind,
  name
)
VALUES
  (
    0,
    'NA'
  ),
  (
    1,
    'Token Deploy'
  ),
    (
    2,
    'State Root Sync'
  ),
  (
    3,
    'ST Prime Stake And Mint'
  ),
    (
    4,
    'BT Stake And Mint'
  ),
  (
    5,
    'Grant Eth Ost'
  ),
    (
    6,
    'Setup User'
  ),
  (
    7,
    'Test'
  ),
    (
    8,
    'Authorize Device'
  ),
  (
    9,
    'Authorize Session'
  ),
    (
    10,
    'Revoke Device'
  ),
  (
    11,
    'Revoke Session'
  ),
    (
    12,
    'Initiate Recovery'
  ),
  (
    13,
    'Abort Recovery By Owner'
  ),
    (
    14,
    'Reset Recovery Owner'
  ),
  (
    15,
    'Execute Recovery'
  ),
    (
    16,
    'Abort Recovery By Recovery Controller'
  ),
  (
    17,
    'Logout Sessions'
  ),
    (
    500,
    'Execute Transaction'
  ),
  (
    501,
    'Update Price Point'
  );

DROP TABLE IF EXISTS dim_dates;
CREATE TABLE dim_dates
(
    date_sk              BIGINT NOT NULL,
    timestamp bigint  NOT NULL,
    day int  NOT NULL,
    week_of_the_year int  NOT NULL,
    month int  NOT NULL,
    quarter int  NOT NULL,
    year int  NOT NULL
)
  DISTKEY (date_sk) SORTKEY (timestamp);


DROP TABLE IF EXISTS dim_tokens;
CREATE TABLE dim_tokens
(
    token_sk              BIGINT NOT NULL IDENTITY(0,1),
    token_id bigint  NOT NULL,
    name varchar(255)  NOT NULL,
    symbol varchar(255)  NOT NULL,
    conversion_factor decimal(15,6) NOT NULL,
    number_of_decimal int NOT NULL
)
  DISTKEY (token_sk) SORTKEY (token_sk);

INSERT INTO dim_tokens
(
  token_id,
  name,
  symbol,
  conversion_factor,
  number_of_decimal
)
VALUES
  (
    0,
    'NA',
    'NA',
    0,
    0
  );


DROP TABLE IF EXISTS dim_address_types;
CREATE TABLE dim_address_types
(
    address_type_sk              INT NOT NULL IDENTITY(0,1),
    address_type varchar(50)  NOT NULL
)
  DISTKEY (address_type_sk) SORTKEY (address_type_sk);

INSERT INTO dim_address_types
(
  address_type
)
VALUES
  (
    'NA'
  ),
  (
    'OST'
  ),
  (
  'PC'
  );


DROP TABLE IF EXISTS workflow_addresses;
CREATE TABLE workflow_addresses
(
    address        VARCHAR(42) NOT NULL,
    address_type_sk    INT  NOT NULL
)
  DISTKEY (address) SORTKEY (address);


DROP TABLE IF EXISTS all_worflows_transactions;
CREATE TABLE all_worflows_transactions
(
  tx_hash               VARCHAR(66) NOT NULL,
  from_address          VARCHAR(42) NOT NULL,
  from_address_type_sk          VARCHAR(20) NOT NULL,
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
  workflow_kind_sk              BIGINT not null,
  workflow_kind              INT,
  workflow_status              INT,
  rounded_workflow_create_timestamp              INT,
  workflow_date_sk INT NOT NULL,
  last_updated_at INT NOT NULL
)
  DISTKEY (tx_hash) SORTKEY (last_updated_at);


DROP TABLE IF EXISTS workflow_facts;
CREATE TABLE workflow_facts
(
  id                              BIGINT NOT NULL IDENTITY(1,1),
  workflow_kind_sk              BIGINT not null,
  token_sk              INT not null,
  chain_id              INT NOT NULL,
  chain_type              VARCHAR(20) NOT NULL,
  workflow_date_sk INT NOT NULL,
  from_address_type_sk          VARCHAR(20) NOT NULL,
  tx_status          varchar(20)  NOT NULL,
  workflow_status              INT,
  tx_fees   BIGINT NOT NULL,
  avg_gas_price   BIGINT NOT NULL,
  total_gas_used   BIGINT NOT NULL,
  total_transactions   BIGINT NOT NULL,
  workflow_count   BIGINT NOT NULL
)
  DISTKEY (id) SORTKEY (workflow_date_sk, workflow_kind_sk);

commit;

begin;

DROP TABLE IF EXISTS pentaho_processing_info;
CREATE TABLE pentaho_processing_info
(
  property    VARCHAR(255) NOT NULL,
  value               BIGINT NOT NULL
);


INSERT INTO pentaho_processing_info
(
  property,
  value
)
VALUES
(
  'last_processed_block_timestamp_origin',
  0
);

INSERT INTO pentaho_processing_info
(
  property,
  value
)
VALUES
(
  'last_updated_workflow',
  0
);

INSERT INTO pentaho_processing_info
(
  property,
  value
)
VALUES
(
  'last_updated_at_all_workflows_transactions',
  0
);

INSERT INTO pentaho_processing_info
(
  property,
  value
)
VALUES
(
  'last_processed_chain_address',
  -1
);

INSERT INTO pentaho_processing_info
(
  property,
  value
)
VALUES
(
  'last_processed_token_address',
  -1
);


INSERT INTO pentaho_processing_info
(
  property,
  value
)
VALUES
(
  'last_processed_token_timestamp',
  0
);

commit;
