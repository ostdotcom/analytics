WbVarDef ENV_SUFFIX=_d35;
WbVarDef SUB_ENV=main;
WbVarDef PRESTAGING_REDSHIFT_SCHEMA_PREFIX=ost_warehouse;
WbVarDef TRANSACTION_DDB_TABLENAME=s6_m_a_202_1_transactions;
WbVarDef TRANSFERS_DDB_TABLENAME=s6_m_a_202_1_token_transfers;
WbVarDef MAX_BLOCK_NUMBER=1600000;
WbVarDef AWS_ACCESS_KEY_ID=AKIAIG7G5KJ53INDY36A;
WbVarDef AWS_SECRET_ACCESS_KEY=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;
WbVarDef CHAIN_TYPE='aux';
WbVarDef CHAIN_ID_SUFFIX='_202';

-- WbVarDef CHAIN_TYPE='origin';
-- WbVarDef CHAIN_ID_SUFFIX='';


create schema if not exists $[PRESTAGING_REDSHIFT_SCHEMA_PREFIX]_$[SUB_ENV]$[ENV_SUFFIX];
set search_path= $[PRESTAGING_REDSHIFT_SCHEMA_PREFIX]_$[SUB_ENV]$[ENV_SUFFIX];


DROP TABLE IF EXISTS $[TRANSACTION_DDB_TABLENAME] CASCADE;

CREATE TABLE  $[TRANSACTION_DDB_TABLENAME]
(
   cid     integer,
   txh     varchar(255),
   bno     bigint,
   bts     integer,
   eps     bigint,
   fad     varchar(255),
   gl      integer,
   gp      bigint,
   gu      integer,
   kd      integer,
   nn      bigint,
   rid     bigint,
   tad     varchar(255),
   ti      bigint,
   tist    boolean,
   tst     boolean,
   ttt     bigint,
   txid    bigint,
   txuuid  varchar(255),
   uts     bigint,
   val     numeric(30),
   mp      varchar(1024),
   ca      varchar(42)
);

COMMIT;



copy  $[TRANSACTION_DDB_TABLENAME] from 'dynamodb://$[TRANSACTION_DDB_TABLENAME]'
  credentials 'aws_access_key_id=$[AWS_ACCESS_KEY_ID];aws_secret_access_key=$[AWS_SECRET_ACCESS_KEY]'
   readratio 80;
commit;


truncate transactions_$[CHAIN_TYPE]$[CHAIN_ID_SUFFIX];

insert into transactions_$[CHAIN_TYPE]$[CHAIN_ID_SUFFIX](
tx_uuid,
tx_hash,
gas_used,
gas_limit,
gas_price,
status,
status_internal,
block_number,
block_timestamp,
from_address,
to_address,
total_token_transfers,
value,
meta_type,
meta_name,
token_id,
kind,
rule_id,
insertion_timestamp)
 (select
 txuuid,
 txh,
COALESCE(gu, 0),
COALESCE(gl, 0),
COALESCE(gp, 0),
  tst,
  COALESCE(tist, tst),
   bno,
   bts,
   fad,
   tad,
COALESCE(ttt, 0),
COALESCE(val, 0),
json_extract_path_text(mp, 't'),
json_extract_path_text(mp, 'n'),
   COALESCE(ti, 0),
 COALESCE(kd, 0),
COALESCE(rid, 0),
EXTRACT(epoch FROM GETDATE())
from $[TRANSACTION_DDB_TABLENAME] where bno <= $[MAX_BLOCK_NUMBER] and bno is not null and tst is not  null and bts is not null);
commit;




-- populate transfers





DROP TABLE IF EXISTS $[TRANSFERS_DDB_TABLENAME];
CREATE TABLE $[TRANSFERS_DDB_TABLENAME]
(
   txh     varchar(255),
   eveid     bigint,
   amt     varchar(255),
   bno     bigint,
   ca     varchar(255),
   fad     varchar(255),
   tad     varchar(255)
);
COMMIT;

 copy $[TRANSFERS_DDB_TABLENAME] from 'dynamodb://$[TRANSFERS_DDB_TABLENAME]'
  credentials 'aws_access_key_id=$[AWS_ACCESS_KEY_ID];aws_secret_access_key=$[AWS_SECRET_ACCESS_KEY]'
   readratio 80;
commit;

truncate transfers_$[CHAIN_TYPE]$[CHAIN_ID_SUFFIX];

insert into transfers_$[CHAIN_TYPE]$[CHAIN_ID_SUFFIX](
tx_hash,
event_index,
block_number,
from_address,
to_address,
contract_address,
amount,
insertion_timestamp) 
 (select 
txh,
eveid,
bno,
fad,
tad,
ca,
amt,
EXTRACT(epoch FROM GETDATE()) 
from $[TRANSFERS_DDB_TABLENAME] where bno <= $[MAX_BLOCK_NUMBER]);
commit;


UPDATE   data_processing_info SET value = $[MAX_BLOCK_NUMBER] where property = 'last_processed_block_$[CHAIN_TYPE]$[CHAIN_ID_SUFFIX]';
commit;

