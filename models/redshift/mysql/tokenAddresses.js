'use strict';
/**
 * This is model for TokenAddresses table.
 *
 * @module /models/redshift/mysql/tokenAddresses
 */
const rootPrefix = '../../..',
    ModelBase = require(rootPrefix + '/models/redshift/mysql/base'),
    Constants = require(rootPrefix + '/configs/constants'),
    TokenAddressesGC = require(rootPrefix + '/lib/globalConstants/redshift/tokenAddresses');

// Declare variables.
const dbName = 'kit_saas_' + Constants.SUB_ENVIRONMENT + '_' + Constants.SAAS_MYSQL_DATABASE_ENVIRONMENT;

/**
 * Class for TokenAddresses model
 *
 * @class
 */
class TokenAddresses extends ModelBase {
    /**
     * Constructor for TokenAddresses model
     *
     * @constructor
     */
    constructor(params) {
        super({ dbName: dbName,
            object: params.object || {}
        });

        const oThis = this;

        oThis.tableName = 'token_addresses';
    }

    /**
     * Get mapping for the TokenAddresses table
     *
     * @return {Map}
     */
    static get mapping(){
        return TokenAddressesGC.mapping;
    }

    /**
     * Get fields to be move to analytics
     *
     * @return {Object}
     */
    static get fieldsToBeMoveToAnalytics() {
        return TokenAddressesGC.fieldsToBeMoveToAnalytics;
    }

    /**
     * Get table name with schema
     *
     * @returns {String}
     */
    getTableNameWithSchema() {
        return Constants.PRESTAGING_SCHEMA_NAME + '.token_addresses';
    };

    /**
     * Get table primary key
     *
     * @returns {String}
     */
    getTablePrimaryKey() {
        return 'id'
    };

    /**
     * Get temp table name
     *
     * @returns {String}
     */
    getTempTableName() {
        return Constants.PRESTAGING_SCHEMA_NAME + '.temp_token_addresses';
    };

    /**
     * Get file path for the TokenAddresses service
     *
     * @returns {String}
     */
    get getFilePath() {
        return "/token_addresses";
    }

}

module.exports = TokenAddresses;
