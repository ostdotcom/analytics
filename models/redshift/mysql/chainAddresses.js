'use strict';
/**
 * This is model for ChainAddresses table.
 *
 * @module /models/redshift/mysql/chainAddresses
 */
const rootPrefix = '../../..',
    ModelBase = require(rootPrefix + '/models/redshift/mysql/base'),
    Constants = require(rootPrefix + '/configs/constants'),
    ChainAddressesGC = require(rootPrefix + '/lib/globalConstants/redshift/chainAddresses'),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo");

// Declare variables.
const dbName = 'kit_saas_' + Constants.SUB_ENVIRONMENT + '_' + Constants.SAAS_MYSQL_DATABASE_ENVIRONMENT;

/**
 * Class for ChainAddresses model
 *
 * @class
 */
class ChainAddresses extends ModelBase {
    /**
     * Constructor for ChainAddresses model
     *
     * @constructor
     */
    constructor(params) {
        super({ ...params, dbName: dbName
        });

        const oThis = this;

        oThis.tableName = 'chain_addresses';
    }

    /**
     * Get mapping for the ChainAddresses table
     *
     * @return {Map}
     */
    static get mapping(){
        return ChainAddressesGC.mapping;
    }

    /**
     * Get fields to be move to analytics
     *
     * @return {Object}
     */
    static get fieldsToBeMoveToAnalytics() {
        return ChainAddressesGC.fieldsToBeMoveToAnalytics;
    }

    /**
     * Get table name with schema
     *
     * @returns {String}
     */
    get getTableNameWithSchema() {
        const oThis = this;
        return Constants.PRESTAGING_SCHEMA_NAME + '.chain_addresses' + oThis.tableNameSuffix;
    };

    /**
     * Get data processing property name
     *
     * @returns {String}
     */
    get getDataProcessingPropertyName(){
        const oThis = this;
        return dataProcessingInfoGC.chainAddressesLastUpdatedAtProperty + oThis.tableNameSuffix;
    }

    /**
     * Get table primary key
     *
     * @returns {String}
     */
    get getTablePrimaryKey() {
        return 'id'
    };

    /**
     * Get temp table name
     *
     * @returns {String}
     */
    get getTempTableNameWithSchema() {
        const oThis = this;
        return Constants.PRESTAGING_SCHEMA_NAME + '.temp_chain_addresses' + oThis.tableNameSuffix;
    };


}

module.exports = ChainAddresses;
