CREATE SCHEMA IF NOT EXISTS  temp_ost_pentaho_main_d6 AUTHORIZATION ost_pentaho_stag_user;
set search_path=temp_ost_pentaho_main_d6;


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
  'last_processed_transaction',
  -1
);

INSERT INTO temp_pentaho_processing_info_${CHAIN_ID}
(
  property,
  value
)
VALUES
(
  'last_processed_meta_name_tx_id',
  -1
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



