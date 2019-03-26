WbVarDef ENV_SUFFIX=_d6;
WbVarDef SUB_ENV=main;
WbVarDef TEMP_PENTAHO_REDSHIFT_SCHEMA_PREFIX=temp_ost_pentaho;
WbVarDef CHAIN_ID=202;


CREATE SCHEMA IF NOT EXISTS  $[TEMP_PENTAHO_REDSHIFT_SCHEMA_PREFIX]_$[SUB_ENV]$[ENV_SUFFIX] AUTHORIZATION ost_pentaho_stag_user;
set search_path=$[TEMP_PENTAHO_REDSHIFT_SCHEMA_PREFIX]_$[SUB_ENV]$[ENV_SUFFIX];


DROP TABLE IF EXISTS temp_pentaho_processing_info_$[CHAIN_ID];
CREATE TABLE temp_pentaho_processing_info_$[CHAIN_ID]
(
  property    VARCHAR(255) NOT NULL,
  value               BIGINT NOT NULL
);

INSERT INTO temp_pentaho_processing_info_$[CHAIN_ID]
(
  property,
  value
)
VALUES
(
  'last_processed_transaction_insert_timestamp',
  0
);

INSERT INTO temp_pentaho_processing_info_$[CHAIN_ID]
(
  property,
  value
)
VALUES
(
  'last_processed_meta_name_tx_insert_timestamp',
  0
);

INSERT INTO temp_pentaho_processing_info_$[CHAIN_ID]
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



