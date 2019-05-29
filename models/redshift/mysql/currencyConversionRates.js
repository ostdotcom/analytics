'use strict';
/**
 * This is model for CurrencyConversionRates table.
 *
 * @module /models/redshift/mysql/currencyConversionRates
 */
const rootPrefix = '../../..',
    ModelBase = require(rootPrefix + '/models/redshift/mysql/base'),
    Constants = require(rootPrefix + '/configs/constants'),
	  currencyConversionRatesGC = require(rootPrefix + '/lib/globalConstants/redshift/currencyConversionRates'),
		baseGC = require(rootPrefix + '/lib/globalConstants/redshift/base'),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo");

// Declare variables.
const dbName = 'kit_saas_' + Constants.SUB_ENVIRONMENT + '_' + Constants.SAAS_MYSQL_DATABASE_ENVIRONMENT;

/**
 * Class for currencyConversionRates model
 *
 * @class
 */
class CurrencyConversionRates extends ModelBase {
    /**
     * Constructor for token model
     *
     * @constructor
     */
    constructor(params) {
        super({ ...params,dbName: dbName});

        const oThis = this;

        oThis.tableName = 'currency_conversion_rates';
    }

    /**
     * Get mapping for the token table
     *
     * @return {Map}
     */
    static get mapping(){
        return currencyConversionRatesGC.mapping;
    }


    /**
     * Get fields to be move to analytics
     *
     * @return {Object}
     */
    static get fieldsToBeMoveToAnalytics() {
        return currencyConversionRatesGC.fieldsToBeMoveToAnalytics;
    }

    /**
     * Get table name with schema
     *
     * @returns {String}
     */
    get getTableNameWithSchema() {
        const oThis = this;
        return Constants.PRESTAGING_SCHEMA_NAME + '.currency_conversion_rates'+ oThis.tableNameSuffix;
    };

    /**
     * Get data processing property name
     *
     * @returns {String}
     */
    get getDataProcessingPropertyName(){
        const oThis = this;
        return dataProcessingInfoGC.currencyConversionRatesLastUpdatedAtProperty + oThis.tableNameSuffix;
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
        return Constants.PRESTAGING_SCHEMA_NAME + '.temp_currency_conversion_rates'+ oThis.tableNameSuffix;
    };

}

module.exports = CurrencyConversionRates;
