"use strict";

const Constants = function () {
};

function define(key, value) {
    Object.defineProperty(Constants.prototype, key, {
        value: value,
        writable: false
    });
}

define('SUB_ENVIRONMENT', process.env.SUB_ENVIRONMENT);
define('ENVIRONMENT', process.env.ENVIRONMENT);
define('ENV_SUFFIX', process.env.ENV_SUFFIX);


define('KIT_SAAS_SUBENV_MYSQL_PASSWORD', process.env.KIT_SAAS_SUBENV_MYSQL_PASSWORD);
define('KIT_SAAS_SUBENV_MYSQL_USER', process.env.KIT_SAAS_SUBENV_MYSQL_USER);
define('KIT_SAAS_SUBENV_MYSQL_HOST', process.env.KIT_SAAS_SUBENV_MYSQL_HOST);
define('KIT_MYSQL_CONNECTION_POOL_SIZE', process.env.KIT_MYSQL_CONNECTION_POOL_SIZE);

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

define('TRANSFERS_BATCH_SIZE', 80);
define('TRANSACTION_BATCH_SIZE', 60);

define('MAX_SPLIT_COUNT', 10);
define('NO_OF_BLOCKS_TO_PROCESS_TOGETHER', 2);
define('S3_WRITE_COUNT', 10);
define("LOCAL_DIR_FILE_PATH", process.env.LOCAL_DIR_FILE_PATH);

define("PRESTAGING_SCHEMA_NAME",process.env.PRESTAGING_SCHEMA_PREFIX + process.env.SUB_ENVIRONMENT + process.env.ENV_SUFFIX);

module.exports = new Constants();