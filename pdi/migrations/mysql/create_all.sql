
drop table if exists `job_logs`;
CREATE TABLE job_logs
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
CREATE INDEX IDX_job_logs_1 ON job_logs(ID_JOB)
;
CREATE INDEX IDX_job_logs_2 ON job_logs(ERRORS, STATUS, JOBNAME)
;

drop table if exists `transformation_logs`;
-- Transformation log table
--

CREATE TABLE transformation_logs
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
CREATE INDEX IDX_transformation_logs_1 ON transformation_logs(ID_BATCH)
;
CREATE INDEX IDX_transformation_logs_2 ON transformation_logs(ERRORS, STATUS, TRANSNAME)
;


drop table if exists `dim_dates`;

  CREATE TABLE `dim_dates` (
    `date_sk` bigint  NOT NULL AUTO_INCREMENT,
    `timestamp` bigint  NOT NULL,
    `day` int  NOT NULL,
    `week_of_the_year` int  NOT NULL,
    `month` int  NOT NULL,
    `quarter` int  NOT NULL,
    `year` int  NOT NULL,
    PRIMARY KEY (`date_sk`)
  ) ;

  ALTER TABLE dim_dates ADD UNIQUE INDEX  u_timestamp (timestamp);


  drop table if exists `dim_times`;
  
  CREATE TABLE `dim_times` (
    `time_sk` bigint  NOT NULL AUTO_INCREMENT,
    `timestamp` bigint  NOT NULL,
    `hour` int  NOT NULL,
    PRIMARY KEY (`time_sk`)
  ) ;

  ALTER TABLE dim_times ADD UNIQUE INDEX  u_timestamp (timestamp);

  drop table if exists `dim_meta_types`;
  
  CREATE TABLE `dim_meta_types` (
    `meta_type_sk` bigint  NOT NULL AUTO_INCREMENT,
    `meta_type` varchar(255)  NOT NULL,
    PRIMARY KEY (`meta_type_sk`)
  ) ;

  ALTER TABLE dim_meta_types ADD UNIQUE INDEX  u_meta_type (meta_type);

  SET sql_mode='NO_AUTO_VALUE_ON_ZERO';
  INSERT INTO `dim_meta_types` (`meta_type_sk`,`meta_type`) VALUES(0,'NIL');
  INSERT INTO `dim_meta_types`(`meta_type`) VALUES('user_to_user'), ('company_to_user'), ('user_to_company');

drop table if exists `aux_transaction_by_type_graph`;

  CREATE TABLE `aux_transaction_by_type_graph` (
  `id` bigint  NOT NULL auto_increment,
  `chain_id` integer NOT NULL,
  `token_id` integer NOT NULL,
  `timestamp` integer NOT NULL,
  `meta_type` varchar(255)  NULL,
  `graph_duration_type` varchar(10) NOT NULL,
  `total_transactions` BIGINT NOT NULL,
  `total_transfers` BIGINT NOT NULL,
  `total_volume` decimal(60,0) NOT NULL,
   PRIMARY KEY (`id`)
);

  ALTER TABLE `aux_transaction_by_type_graph` ADD INDEX ci_ti_gdt_t (`chain_id`, `token_id`, `graph_duration_type`, `timestamp`);

drop table if exists `aux_transaction_by_name_graph`;

  CREATE TABLE `aux_transaction_by_name_graph` (
  `id` bigint  NOT NULL auto_increment,
  `chain_id` integer NOT NULL,
  `token_id` integer NOT NULL,
  `timestamp` integer NOT NULL,
  `meta_name` varchar(255)  NULL,
  `graph_duration_type` varchar(10) NOT NULL,
  `total_transactions` BIGINT NOT NULL,
  `total_transfers` BIGINT NOT NULL,
  `total_volume` decimal(60,0) NOT NULL,
   PRIMARY KEY (`id`)
);

  ALTER TABLE `aux_transaction_by_name_graph` ADD INDEX ci_ti_gdt_t (`chain_id`, `token_id`, `graph_duration_type`, `timestamp`);


