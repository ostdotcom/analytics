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
        super({ dbName: dbName,
            object: params.object || {}
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
    getTableNameWithSchema() {
        return Constants.PRESTAGING_SCHEMA_NAME + '.chain_addresses';
    };

    /**
     * Get data processing property name
     *
     * @returns {String}
     */
    get getDataProcessingPropertyName(){
        return dataProcessingInfoGC.chainAddressesLastUpdatedAtProperty;
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
        return Constants.PRESTAGING_SCHEMA_NAME + '.temp_chain_addresses';
    };

    /**
     * Get file path for the ChainAddresses service
     *
     * @returns {String}
     */
    get getFilePath() {
        return "/chain_addresses";
    }

}

module.exports = ChainAddresses;
