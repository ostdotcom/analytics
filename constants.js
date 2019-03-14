"use strict";

const Constants = function () {
};

function define(key, value) {
    Object.defineProperty(Constants.prototype, key, {
        value: value,
        writable: false
    });
}


define('REDSHIFT_USER', process.env.REDSHIFT_USER);
define('REDSHIFT_DATABASE', process.env.REDSHIFT_DATABASE);
define('REDSHIFT_PASSWORD', process.env.REDSHIFT_PASSWORD);
define('REDSHIFT_PORT', process.env.REDSHIFT_PORT);
define('REDSHIFT_HOST', process.env.REDSHIFT_HOST);

module.exports = new Constants();