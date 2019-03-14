'use strict';

const rootPrefix = '..',
    coreConstants = require(rootPrefix + '/configs/coreConstants');

const mysqlConfig = {
    commonNodeConfig: {
        connectionLimit: coreConstants.MYSQL_CONNECTION_POOL_SIZE,
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
                host: coreConstants.KIT_SAAS_SUBENV_MYSQL_HOST,
                user: coreConstants.KIT_SAAS_SUBENV_MYSQL_USER,
                password: coreConstants.KIT_SAAS_SUBENV_MYSQL_PASSWORD
            }
        }
    },
    databases: {}
};

// kit_saas_subenv database
mysqlConfig['databases']['kit_saas_' + coreConstants.subEnvironment + '_' + coreConstants.environment] = ['cluster1'];

module.exports = mysqlConfig;
