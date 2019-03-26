
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






