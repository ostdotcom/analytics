
drop table if exists "dim_time" CASCADE;
  CREATE TABLE "dim_time" (
    "time_sk" bigint  NOT NULL ,
    "timestamp" bigint  NOT NULL,
    "hour" int  NOT NULL,
    PRIMARY KEY ("time_sk")
  ) ;


  drop table if exists "dim_date" CASCADE;
  CREATE TABLE "dim_date" (
    "date_sk" bigint  NOT NULL ,
    "timestamp" bigint  NOT NULL,
    "day" int  NOT NULL,
    "week_of_the_year" int  NOT NULL,
    "month" int  NOT NULL,
    "quarter" int  NOT NULL,
    "year" int  NOT NULL,
    PRIMARY KEY ("date_sk")
  ) ;


  drop table if exists "dim_tokens" CASCADE;
  CREATE TABLE "dim_tokens" (
    "token_sk" bigint  NOT NULL ,
    "token_id" bigint  NOT NULL,
    "name" varchar(255)  NOT NULL,
    "symbol" varchar(255)  NOT NULL,
    "conversion_factor" decimal(15,6) NOT NULL,
    "decimal" int NOT NULL,
    PRIMARY KEY ("token_sk")
  ) ;

  drop table if exists "dim_meta_type" CASCADE;
  CREATE TABLE "dim_meta_type" (
    "meta_type_sk" bigint  NOT NULL ,
    "meta_type" varchar(255)  NOT NULL,
    PRIMARY KEY ("meta_type_sk")
  ) ;

  drop table if exists "dim_meta_name" CASCADE;
  CREATE TABLE "dim_meta_name" (
    "meta_name_sk" bigint  NOT NULL ,
    "meta_name" varchar(255)  NOT NULL,
    PRIMARY KEY ("meta_name_sk"),
    "client_id" bigint  NOT NULL,
    "token_id" bigint  NOT NULL,
  ) ;


  drop table if exists "token_transfer_facts" CASCADE;
  CREATE TABLE "token_transfer_facts" (
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
  client_id           BIGINT NOT NULL,
  token_id            BIGINT NOT NULL,
  kind                INT NOT NULL
)
DISTKEY (client_id) SORTKEY (block_number);

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
  client_id           BIGINT NOT NULL,
  token_id            BIGINT NOT NULL,
  kind                INT NOT NULL
)
DISTKEY (client_id) SORTKEY (block_number);

DROP TABLE IF EXISTS tokens;
CREATE TABLE tokens
(
  token_id            BIGINT NOT NULL,
  symbol              VARCHAR(255) NOT NULL,
  conversion_factor   decimal(15,6) NOT NULL,
  decimal             int NOT NULL
)

DROP TABLE IF EXISTS transfers;
CREATE TABLE transfers
(
  transaction_hash    VARCHAR(255) NOT NULL,
  event_index         INT NOT NULL,
  block_number        BIGINT NOT NULL,
  contract_address    VARCHAR(255) NOT NULL,
  amount              BIGINT NOT NULL
)

DROP TABLE IF EXISTS transaction_meta;
CREATE TABLE transaction_meta
(
  transaction_meta_id    BIGINT NOT NULL,
  transaction_uuid       VARCHAR(255) NOT NULL,
  token_id               BIGINT NOT NULL,
  kind                   INT NOT NULL
)
