-- WbVarDef ENV_SUFFIX=_d6;
-- WbVarDef SUB_ENV=main;
-- WbVarDef PENTAHO_REDSHIFT_SCHEMA_PREFIX=ost_pentaho;
-- WbVarDef AUX_CHAIN_ID=202;

begin;
CREATE SCHEMA IF NOT EXISTS  ${PENTAHO_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX};

SET search_path = ${PENTAHO_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX};


INSERT INTO chain_details
(
  chain_type,
  chain_id
)
VALUES
(
  'aux',
  ${AUX_CHAIN_ID}
);

INSERT INTO pentaho_processing_info
(
  property,
  value
)
VALUES
(
  'last_processed_block_timestamp_aux_' || ${AUX_CHAIN_ID},
  0
);

commit;