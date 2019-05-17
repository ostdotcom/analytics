"use strict";

const rootPrefix = "..";
const Constants = function () {
};

/**
 * Define constants
 *
 */
function define(key, value) {
    Object.defineProperty(Constants.prototype, key, {
        value: value,
        writable: false
    });
}

define('SUB_ENVIRONMENT', process.env.SUB_ENVIRONMENT);
define('ENVIRONMENT', process.env.ENVIRONMENT);
define('ENV_SUFFIX', process.env.ENV_SUFFIX);
define("SAAS_MYSQL_DATABASE_ENVIRONMENT", process.env.SAAS_MYSQL_DATABASE_ENVIRONMENT);
define('ORIGIN_CHAIN_ID', process.env.ORIGIN_CHAIN_ID);


define('KIT_SAAS_SUBENV_MYSQL_PASSWORD', process.env.KIT_SAAS_SUBENV_MYSQL_PASSWORD);
define('KIT_SAAS_SUBENV_MYSQL_USER', process.env.KIT_SAAS_SUBENV_MYSQL_USER);
define('KIT_SAAS_SUBENV_MYSQL_HOST', process.env.KIT_SAAS_SUBENV_MYSQL_HOST);
define('KIT_MYSQL_CONNECTION_POOL_SIZE', process.env.KIT_MYSQL_CONNECTION_POOL_SIZE);
define('KIT_SAAS_SUBENV_MYSQL_PORT', process.env.KIT_SAAS_SUBENV_MYSQL_PORT);

define('PRESTAGING_REDSHIFT_CLIENT', {
    user: process.env.PRESTAGING_REDSHIFT_USER,
    database: process.env.PRESTAGING_REDSHIFT_DATABASE,
    password: process.env.PRESTAGING_REDSHIFT_PASSWORD,
    port: process.env.PRESTAGING_REDSHIFT_PORT,
    host: process.env.PRESTAGING_REDSHIFT_HOST
});

define("S3_REGION",process.env.S3_REGION );
define("S3_ACCESS_KEY", process.env.S3_ACCESS_KEY);
define("S3_ACCESS_SECRET", process.env.S3_ACCESS_SECRET );
define("S3_BUCKET_NAME", process.env.S3_BUCKET_NAME);
define ("S3_IAM_ROLE", process.env.S3_IAM_ROLE);

define("RESTORE_RDS_API_VERSION",process.env.RESTORE_RDS_API_VERSION );
define("RESTORE_RDS_REGION", process.env.RESTORE_RDS_REGION);
define("RESTORE_RDS_REGION_ACCESS_KEY", process.env.RESTORE_RDS_REGION_ACCESS_KEY );
define("RESTORE_RDS_REGION_ACCESS_SECRET", process.env.RESTORE_RDS_REGION_ACCESS_SECRET);
define("USE_POINT_IN_TIME_RDS_INSTANCE", process.env.USE_POINT_IN_TIME_RDS_INSTANCE);


define("RDS_RESTORE_INSTANCE_PARAMS", {
                        "TargetDBInstanceIdentifier": process.env.RDS_DB_INSTANCE_PREFIX + process.env.SUB_ENVIRONMENT + "-" + process.env.RDS_SOURCE_DB_INSTANCE_IDENTIFIER,
                        "AutoMinorVersionUpgrade": false,
                        "CopyTagsToSnapshot": true,
                        "DBInstanceClass": process.env.RDS_DB_INSTANCE_CLASS,
                        "DBParameterGroupName": process.env.RDS_DB_PARAMETER_GROUP_NAME,
                        "DBSubnetGroupName": process.env.RDS_DB_SUBNET_GROUP_NAME,
                        "DeletionProtection": false,
                        "Engine": "mysql",
                        "LicenseModel": "general-public-license",
                        "MultiAZ": false,
                        "Port": 3306,
                        "PubliclyAccessible": false,
                        "UseLatestRestorableTime": true,
                        "SourceDBInstanceIdentifier":  process.env.RDS_SOURCE_DB_INSTANCE_IDENTIFIER,
                        "StorageType": "gp2",
                        "VpcSecurityGroupIds": process.env.RDS_VPC_SECURITY_GROUP_IDS.split(" ")
                        }
);



define('TRANSFERS_BATCH_SIZE', process.env.TRANSFERS_BATCH_SIZE);
define('TRANSACTION_BATCH_SIZE', process.env.TRANSACTION_BATCH_SIZE);

define('MAX_SPLIT_COUNT', process.env.MAX_SPLIT_COUNT);
define('NO_OF_BLOCKS_TO_PROCESS_TOGETHER', process.env.NO_OF_BLOCKS_TO_PROCESS_TOGETHER);
define('S3_WRITE_COUNT', process.env.S3_WRITE_COUNT);
define("LOCAL_DIR_FILE_PATH", process.env.LOCAL_DIR_FILE_PATH);
define("AUX_BLOCK_SCANNER_CONFIG_FILE", process.env.AUX_BLOCK_SCANNER_CONFIG_FILE_PATH ? require(process.env.AUX_BLOCK_SCANNER_CONFIG_FILE_PATH):
    require( rootPrefix + "/aux_block_scanner_config.json"));
define("ORIGIN_BLOCK_SCANNER_CONFIG_FILE", process.env.ORIGIN_BLOCK_SCANNER_CONFIG_FILE ? require(process.env.ORIGIN_BLOCK_SCANNER_CONFIG_FILE):
    require( rootPrefix + "/origin_block_scanner_config.json"));


define("PRESTAGING_SCHEMA_NAME",process.env.PRESTAGING_SCHEMA_PREFIX + process.env.SUB_ENVIRONMENT + process.env.ENV_SUFFIX);
define("TEMPORARY_MDX_DIRECTORY_FILE_PATH",process.env.TEMPORARY_MDX_DIRECTORY_FILE_PATH);

module.exports = new Constants();