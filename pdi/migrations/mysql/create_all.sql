
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


  CREATE TABLE `transaction_by_type_graph` (
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

  ALTER TABLE `transaction_by_type_graph` ADD INDEX ci_ti_gdt_t (`chain_id`, `token_id`, `graph_duration_type`, `timestamp`);


  CREATE TABLE `transaction_by_name_graph` (
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

  ALTER TABLE `transaction_by_name_graph` ADD INDEX ci_ti_gdt_t (`chain_id`, `token_id`, `graph_duration_type`, `timestamp`);


