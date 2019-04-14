'use strict';
/**
 * This is model for StakerWhitelistedAddresses table.
 *
 * @module /models/redshift/mysql/stakerWhitelistedAddresses
 */
const rootPrefix = '../../..',
    ModelBase = require(rootPrefix + '/models/redshift/mysql/base'),
    Constants = require(rootPrefix + '/configs/constants'),
    StakerWhitelistedAddressesGC = require(rootPrefix + '/lib/globalConstants/redshift/stakerWhitelistedAddresses'),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo");

// Declare variables.
const dbName = 'kit_saas_' + Constants.SUB_ENVIRONMENT + '_' + Constants.SAAS_MYSQL_DATABASE_ENVIRONMENT;

/**
 * Class for StakerWhitelistedAddresses model
 *
 * @class
 */
class StakerWhitelistedAddresses extends ModelBase {
    /**
     * Constructor for StakerWhitelistedAddresses model
     *
     * @constructor
     */
    constructor(params) {
        super({ dbName: dbName,
            object: params.object || {}
        });

        const oThis = this;

        oThis.tableName = 'staker_whitelisted_addresses';
    }

    /**
     * Get mapping for the StakerWhitelistedAddresses table
     *
     * @return {Map}
     */
    static get mapping(){
        return StakerWhitelistedAddressesGC.mapping;
    }

    /**
     * Get fields to be move to analytics
     *
     * @return {Object}
     */
    static get fieldsToBeMoveToAnalytics() {
        return StakerWhitelistedAddressesGC.fieldsToBeMoveToAnalytics;
    }

    /**
     * Get table name with schema
     *
     * @returns {String}
     */
    getTableNameWithSchema() {
        const oThis = this;
        return Constants.PRESTAGING_SCHEMA_NAME + '.staker_whitelisted_addresses' + oThis.tableNameSuffix;
    };

    /**
     * Get data processing property name
     *
     * @returns {String}
     */
    get getDataProcessingPropertyName(){
        const oThis = this;
        return dataProcessingInfoGC.stakerWhitelistedAddressesLastUpdatedAtProperty + oThis.tableNameSuffix;
    }

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
    getTempTableNameWithSchema() {
        const oThis = this;
        return Constants.PRESTAGING_SCHEMA_NAME + '.temp_staker_whitelisted_addresses' + oThis.tableNameSuffix;
    };


}

module.exports = StakerWhitelistedAddresses;
