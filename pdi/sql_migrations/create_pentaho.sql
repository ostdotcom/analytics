-- SET @chain_id='${chain_id}';
-- SET @chain_id='${chain_id}';

SET @chain_id = "200";

SET @db_create = CONCAT('CREATE DATABASE ost_star_', @chain_id, ' ;');
PREPARE stmt_create FROM @db_create;
execute stmt_create;


SET @db_use = CONCAT('USE ost_star_', @chain_id, ' ;');
execute  @db_use;

PREPARE stmt_use FROM @db_use;
execute stmt_use;

set search_path="ost_pentaho_s6_c200_sandbox";


DROP TABLE IF EXISTS transactions;
CREATE TABLE transactions
(
  transaction_uuid    VARCHAR(255) NOT NULL,
  transaction_hash    VARCHAR(255) NOT NULL,
  gas_used            BIGINT NOT NULL,
  status              VARCHAR(20) NOT NULL,
  status_internal     VARCHAR(20) NOT NULL,
  block_number        BIGINT NOT NULL,
  value               BIGINT NOT NULL,
  token_id            BIGINT NOT NULL,
  kind                INT NOT NULL
)
DISTKEY (transaction_hash) SORTKEY (block_number, kind);

DROP TABLE IF EXISTS tokens;
CREATE TABLE tokens
(
  token_id            BIGINT NOT NULL,
  symbol              VARCHAR(255) NOT NULL,
  conversion_factor   decimal(15,6) NOT NULL,
  decimal             int NOT NULL
)
DISTKEY (token_id)

DROP TABLE IF EXISTS transfers;
CREATE TABLE transfers
(
  transaction_hash    VARCHAR(255) NOT NULL,
  event_index         INT NOT NULL,
  block_number        BIGINT NOT NULL,
  contract_address    VARCHAR(255) NOT NULL,
  amount              BIGINT NOT NULL
)
DISTKEY (transaction_hash) SORTKEY (block_number);














drop table if exists "dim_time" CASCADE;
  CREATE TABLE "dim_time" (
    "time_sk" bigint  NOT NULL AUTO_INCREMENT,
    "timestamp" bigint  NOT NULL,
    "hour" int  NOT NULL,
    PRIMARY KEY ("time_sk")
  ) ;


  drop table if exists "dim_date" CASCADE;
  CREATE TABLE "dim_date" (
    "date_sk" bigint  NOT NULL AUTO_INCREMENT,
    "timestamp" bigint  NOT NULL,
    "day" int  NOT NULL,
    "week_of_the_year" int  NOT NULL,
    "month" int  NOT NULL,
    "quarter" int  NOT NULL,
    "year" int  NOT NULL,
    PRIMARY KEY ("date_sk")
  ) ;


  drop table if exists `dim_tokens` ;
  CREATE TABLE `dim_tokens` (
    `token_sk` bigint  NOT NULL auto_increment,
    `token_id` bigint  NOT NULL,
    `name` varchar(255)  NOT NULL,
    `symbol` varchar(255)  NOT NULL,
    `conversion_factor` decimal(15,6) NOT NULL,
    `decimal` int NOT NULL,
    PRIMARY KEY (`token_sk`)
  );

  drop table if exists "dim_meta_type" CASCADE;
  CREATE TABLE "dim_meta_type" (
    "meta_type_sk" bigint  NOT NULL AUTO_INCREMENT,
    "meta_type" varchar(255)  NOT NULL,
    PRIMARY KEY ("meta_type_sk")
  ) ;

  drop table if exists "dim_meta_name" CASCADE;
  CREATE TABLE "dim_meta_name" (
    "meta_name_sk" bigint  NOT NULL AUTO_INCREMENT,
    "meta_name" varchar(255)  NOT NULL,
    PRIMARY KEY ("meta_name_sk"),
    "client_id" bigint  NOT NULL,
    "token_id" bigint  NOT NULL,
  ) ;


  drop table if exists "token_transfer_facts" CASCADE;
  CREATE TABLE "token_transfer_facts" (
    "id"
    "time_sk" bigint  NOT NULL ,
    "date_sk" bigint  NOT NULL ,
    "token_sk" bigint  NOT NULL ,
    "meta_type_sk" bigint  NOT NULL ,
    "meta_name_sk" bigint  NOT NULL ,
    "status" varchar(20) NOT NULL,
    "total_transactions" bigint NOT NULL,
    "total_transfers" bigint NOT NULL,
    "total_volume" bigint NOT NULL,
    "total_gas_used" bigint NOT NULL
  ) ;
  ALTER TABLE token_transfer_facts ADD FOREIGN KEY (time_sk) REFERENCES dim_time (time_sk);
  ALTER TABLE token_transfer_facts ADD FOREIGN KEY (date_sk) REFERENCES dim_date (date_sk);
  ALTER TABLE token_transfer_facts ADD FOREIGN KEY (token_sk) REFERENCES dim_tokens (token_sk);
  ALTER TABLE token_transfer_facts ADD FOREIGN KEY (meta_type_sk) REFERENCES dim_meta_type (meta_type_sk);
  ALTER TABLE token_transfer_facts ADD FOREIGN KEY (meta_name_sk) REFERENCES dim_meta_name (meta_name_sk);
