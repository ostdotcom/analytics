'use strict';

const rootPrefix = '..',
    Constants = require(rootPrefix + '/configs/constants');

const mysqlConfig = {
    commonNodeConfig: {
        connectionLimit: Constants.SA_MYSQL_CONNECTION_POOL_SIZE,
        charset: 'UTF8_UNICODE_CI',
        bigNumberStrings: true,
        supportBigNumbers: true,
        dateStrings: true,
        debug: false
    },
    commonClusterConfig: {
        canRetry: true,
        removeNodeErrorCount: 5,
        restoreNodeTimeout: 10000,
        defaultSelector: 'RR'
    },
    clusters: {
        cluster1: {
            master: {
                host: Constants.SA_KIT_SAAS_SUBENV_MYSQL_HOST,
                user: Constants.SA_KIT_SAAS_SUBENV_MYSQL_USER,
                password: Constants.SA_KIT_SAAS_SUBENV_MYSQL_PASSWORD
            }
        }
    },
    databases: {}
};

// kit_saas_subenv database
mysqlConfig['databases']['kit_saas_' + Constants.SA_SUB_ENVIRONMENT + '_' + Constants.SA_ENVIRONMENT] = ['cluster1'];

module.exports = mysqlConfig;
