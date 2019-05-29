'use strict';
/**
 * This is model for stakeCurrencies table.
 *
 * @module /models/redshift/mysql/stakeCurrencies
 */
const rootPrefix = '../../..',
    ModelBase = require(rootPrefix + '/models/redshift/mysql/base'),
    Constants = require(rootPrefix + '/configs/constants'),
	  stakeCurrenciesGC = require(rootPrefix + '/lib/globalConstants/redshift/stakeCurrencies'),
		baseGC = require(rootPrefix + '/lib/globalConstants/redshift/base'),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo");

// Declare variables.
const dbName = 'kit_saas_' + Constants.SUB_ENVIRONMENT + '_' + Constants.SAAS_MYSQL_DATABASE_ENVIRONMENT;

/**
 * Class for stakeCurrencies model
 *
 * @class
 */
class StakeCurrencies extends ModelBase {
    /**
     * Constructor for token model
     *
     * @constructor
     */
    constructor(params) {
        super({ ...params,dbName: dbName});

        const oThis = this;

        oThis.tableName = 'stake_currencies';
    }

    /**
     * Get mapping for the token table
     *
     * @return {Map}
     */
    static get mapping(){
        return stakeCurrenciesGC.mapping;
    }

    /**
     * Get fields to be move to analytics
     *
     * @return {Object}
     */
    static get fieldsToBeMoveToAnalytics() {
        return stakeCurrenciesGC.fieldsToBeMoveToAnalytics;
    }

    /**
     * Get table name with schema
     *
     * @returns {String}
     */
    get getTableNameWithSchema() {
        const oThis = this;
        return Constants.PRESTAGING_SCHEMA_NAME + '.stake_currencies'+ oThis.tableNameSuffix;
    };

    /**
     * Get data processing property name
     *
     * @returns {String}
     */
    get getDataProcessingPropertyName(){
        const oThis = this;
        return dataProcessingInfoGC.stakeCurrenciesLastUpdatedAtProperty + oThis.tableNameSuffix;
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
        return Constants.PRESTAGING_SCHEMA_NAME + '.temp_stake_currencies'+ oThis.tableNameSuffix;
    };

}

module.exports = StakeCurrencies;
