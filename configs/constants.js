"use strict";

const Constants = function () {
};

function define(key, value) {
    Object.defineProperty(Constants.prototype, key, {
        value: value,
        writable: false
    });
}

define('SA_SUB_ENVIRONMENT', process.env.SA_SUB_ENVIRONMENT);
define('SA_ENVIRONMENT', process.env.SA_ENVIRONMENT);
define('SA_KIT_SAAS_SUBENV_MYSQL_PASSWORD', process.env.SA_KIT_SAAS_SUBENV_MYSQL_PASSWORD);
define('SA_KIT_SAAS_SUBENV_MYSQL_USER', process.env.SA_KIT_SAAS_SUBENV_MYSQL_USER);
define('SA_KIT_SAAS_SUBENV_MYSQL_HOST', process.env.SA_KIT_SAAS_SUBENV_MYSQL_HOST);
define('SA_MYSQL_CONNECTION_POOL_SIZE', process.env.SA_MYSQL_CONNECTION_POOL_SIZE);
define('REDSHIFT_USER', process.env.REDSHIFT_USER);
define('REDSHIFT_DATABASE', process.env.REDSHIFT_DATABASE);
define('REDSHIFT_PASSWORD', process.env.REDSHIFT_PASSWORD);
define('REDSHIFT_PORT', process.env.REDSHIFT_PORT);
define('REDSHIFT_HOST', process.env.REDSHIFT_HOST);
define('REDSHIFT_CLIENT', {
    user: process.env.REDSHIFT_USER,
    database: process.env.REDSHIFT_DATABASE,
    password: process.env.REDSHIFT_PASSWORD,
    port: process.env.REDSHIFT_PORT,
    host: process.env.REDSHIFT_HOST
});
define('TRANSFER_TOKEN_COUNT', 80);
define('TRANSACTION_COUNT', 60);
define('MAX_SPLIT_COUNT', 10);
define('NO_OF_BLOCKS_TO_PROCESS_TOGETHER', 2);
define('S3_WRITE_COUNT', 10);
define("LOCAL_DIR_FILE_PATH", process.env.LOCAL_DIR_FILE_PATH);
define("SUB_ENV", process.env.SUB_ENV);

define("S3_REGION", "us-east-1"  );
define("S3_ACCESS_KEY", "AKIAJ4KB25BTIAYS6YRA");
define("S3_ACCESS_SECRET", "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" );
define("S3_BUCKET_LINK", "temp-analytics.ost.com");
define ("OS_S3_IAM_ROLE", process.env.OS_S3_IAM_ROLE);

define("STAG_SCHEMA_NAME", "ost_warehouse_"+ process.env.SUB_ENV);






module.exports = new Constants();