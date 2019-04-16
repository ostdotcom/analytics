-- define CHAIN_ID

drop table if exists `job_logs_${CHAIN_ID}`;
CREATE TABLE job_logs_${CHAIN_ID}
(
  ID_JOB INT
, CHANNEL_ID VARCHAR(255)
, JOBNAME VARCHAR(255)
, STATUS VARCHAR(15)
, LINES_READ BIGINT
, LINES_WRITTEN BIGINT
, LINES_UPDATED BIGINT
, LINES_INPUT BIGINT
, LINES_OUTPUT BIGINT
, LINES_REJECTED BIGINT
, ERRORS BIGINT
, STARTDATE DATETIME
, ENDDATE DATETIME
, LOGDATE DATETIME
, DEPDATE DATETIME
, REPLAYDATE DATETIME
, LOG_FIELD LONGTEXT
)
;
CREATE INDEX IDX_job_logs_${CHAIN_ID}_1 ON job_logs_${CHAIN_ID}(ID_JOB)
;
CREATE INDEX IDX_job_logs_${CHAIN_ID}_2 ON job_logs_${CHAIN_ID}(ERRORS, STATUS, JOBNAME)
;



drop table if exists `transformation_logs_${CHAIN_ID}`;
-- Transformation log table
--

CREATE TABLE transformation_logs_${CHAIN_ID}
(
  ID_BATCH INT
, CHANNEL_ID VARCHAR(255)
, TRANSNAME VARCHAR(255)
, STATUS VARCHAR(15)
, LINES_READ BIGINT
, LINES_WRITTEN BIGINT
, LINES_UPDATED BIGINT
, LINES_INPUT BIGINT
, LINES_OUTPUT BIGINT
, LINES_REJECTED BIGINT
, ERRORS BIGINT
, STARTDATE DATETIME
, ENDDATE DATETIME
, LOGDATE DATETIME
, DEPDATE DATETIME
, REPLAYDATE DATETIME
, LOG_FIELD LONGTEXT
)
;
CREATE INDEX IDX_transformation_logs_${CHAIN_ID}_1 ON transformation_logs_${CHAIN_ID}(ID_BATCH)
;
CREATE INDEX IDX_transformation_logs_${CHAIN_ID}_2 ON transformation_logs_${CHAIN_ID}(ERRORS, STATUS, TRANSNAME)
;

  drop table if exists `incremental_aggregated_aux_transfers_details_${CHAIN_ID}` ;

  CREATE TABLE `incremental_aggregated_aux_transfers_details_${CHAIN_ID}` (
    `id` bigint  NOT NULL auto_increment,
    `rounded_time_timestamp` integer  NOT NULL,
    `rounded_date_timestamp` integer  NOT NULL,
    `token_id` bigint  NOT NULL,
    `meta_type` varchar(255)   NULL,
    `meta_name` varchar(255)   NULL,
    `final_status` varchar(20)  NOT NULL,
    `total_transactions` bigint NOT NULL,
    `total_transfers` bigint NOT NULL,
    `total_volume` decimal(40,0) NOT NULL,
    `total_gas_used` bigint NOT NULL,
    PRIMARY KEY (`id`)
  );

  drop table if exists `dim_tokens_${CHAIN_ID}` ;
  
  CREATE TABLE `dim_tokens_${CHAIN_ID}` (
    `token_sk` bigint  NOT NULL auto_increment,
    `token_id` bigint  NOT NULL,
    `name` varchar(255)  NOT NULL,
    `symbol` varchar(255)  NOT NULL,
    `conversion_factor` decimal(15,6) NOT NULL,
    `decimal` int NOT NULL,
    PRIMARY KEY (`token_sk`)
  );

  ALTER TABLE `dim_tokens_${CHAIN_ID}` ADD UNIQUE INDEX  u_token_id (token_id);

  drop table if exists `dim_meta_names_${CHAIN_ID}`;
  
  CREATE TABLE `dim_meta_names_${CHAIN_ID}` (
    `meta_name_sk` bigint  NOT NULL AUTO_INCREMENT,
    `meta_name` varchar(255)  NOT NULL,
    `token_id` bigint  NOT NULL,
    PRIMARY KEY (`meta_name_sk`)
  );

  ALTER TABLE `dim_meta_names_${CHAIN_ID}` ADD UNIQUE INDEX u_meta_name_token_id (meta_name, token_id);

  SET sql_mode='NO_AUTO_VALUE_ON_ZERO';
  INSERT INTO `dim_meta_names_${CHAIN_ID}` (`meta_name_sk`,`meta_name`, `token_id`) VALUES(0,'NIL', 0);


  drop table if exists `aux_token_transfer_facts_${CHAIN_ID}`;
  
  CREATE TABLE `aux_token_transfer_facts_${CHAIN_ID}` (
    `id` bigint  NOT NULL AUTO_INCREMENT,
    `time_sk` bigint  NOT NULL ,
    `date_sk` bigint  NOT NULL ,
    `token_sk` bigint  NOT NULL ,
    `meta_type_sk` bigint  NOT NULL ,
    `meta_name_sk` bigint  NOT NULL ,
    `status` varchar(20) NOT NULL,
    `total_transactions` bigint NOT NULL,
    `total_transfers` bigint NOT NULL,
    `total_volume` decimal(40,0) NOT NULL,
    `total_gas_used` bigint NOT NULL,
    PRIMARY KEY (`id`)
  ) ;


  ALTER TABLE `aux_token_transfer_facts_${CHAIN_ID}` ADD INDEX nu_date_token_meta_name (date_sk, token_sk, meta_name_sk);