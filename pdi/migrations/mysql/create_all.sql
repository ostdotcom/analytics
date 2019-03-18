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

  drop table if exists `dim_times`;
  
  CREATE TABLE `dim_times` (
    `time_sk` bigint  NOT NULL AUTO_INCREMENT,
    `timestamp` bigint  NOT NULL,
    `hour` int  NOT NULL,
    PRIMARY KEY (`time_sk`)
  ) ;

  drop table if exists `dim_meta_types`;
  
  CREATE TABLE `dim_meta_types` (
    `meta_type_sk` bigint  NOT NULL AUTO_INCREMENT,
    `meta_type` varchar(255)  NOT NULL,
    PRIMARY KEY (`meta_type_sk`)
  ) ;

INSERT INTO `dim_meta_types`(`meta_type`) VALUES('user_to_user'), ('company_to_user'), ('user_to_company');



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


  drop table if exists `dim_meta_names_${CHAIN_ID}`;
  
  CREATE TABLE `dim_meta_names_${CHAIN_ID}` (
    `meta_name_sk` bigint  NOT NULL AUTO_INCREMENT,
    `meta_name` varchar(255)  NOT NULL,
    `token_id` bigint  NOT NULL,
    PRIMARY KEY (`meta_name_sk`)
  );

  drop table if exists `token_transfer_facts_${CHAIN_ID}`;
  
  CREATE TABLE `token_transfer_facts_${CHAIN_ID}` (
    `id` bigint  NOT NULL AUTO_INCREMENT,
    `time_sk` bigint  NOT NULL ,
    `date_sk` bigint  NOT NULL ,
    `token_sk` bigint  NOT NULL ,
    `meta_type_sk` bigint  NOT NULL ,
    `meta_name_sk` bigint  NOT NULL ,
    `status` varchar(20) NOT NULL,
    `total_transactions` bigint NOT NULL,
    `total_transfers` bigint NOT NULL,
    `total_volume` bigint NOT NULL,
    `total_gas_used` bigint NOT NULL,
    PRIMARY KEY (`id`)
  ) ;
  ALTER TABLE token_transfer_facts_${CHAIN_ID} ADD FOREIGN KEY (time_sk) REFERENCES dim_times (time_sk);
  ALTER TABLE token_transfer_facts_${CHAIN_ID} ADD FOREIGN KEY (date_sk) REFERENCES dim_dates (date_sk);
  ALTER TABLE token_transfer_facts_${CHAIN_ID} ADD FOREIGN KEY (meta_type_sk) REFERENCES dim_meta_types (meta_type_sk);
  ALTER TABLE token_transfer_facts_${CHAIN_ID} ADD FOREIGN KEY (token_sk) REFERENCES dim_tokens_${CHAIN_ID} (token_sk);
  ALTER TABLE token_transfer_facts_${CHAIN_ID} ADD FOREIGN KEY (meta_name_sk) REFERENCES dim_meta_names_${CHAIN_ID} (meta_name_sk);







