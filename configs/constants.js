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

module.exports = new Constants();