'use strict';
/**
 * This is model for Token table.
 *
 * @module /models/redshift/mysql/token
 */
const rootPrefix = '../../..',
    ModelBase = require(rootPrefix + '/models/redshift/mysql/base'),
    Constants = require(rootPrefix + '/configs/constants'),
    tokensGC = require(rootPrefix + '/lib/globalConstants/redshift/tokens'),
		baseGC = require(rootPrefix + '/lib/globalConstants/redshift/base'),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo");

// Declare variables.
const dbName = 'kit_saas_' + Constants.SUB_ENVIRONMENT + '_' + Constants.SAAS_MYSQL_DATABASE_ENVIRONMENT;

/**
 * Class for token model
 *
 * @class
 */
class Token extends ModelBase {
    /**
     * Constructor for token model
     *
     * @constructor
     */
    constructor(params) {
        super({ ...params,dbName: dbName});

        const oThis = this;

        oThis.tableName = 'tokens';
    }

    /**
     * Get mapping for the token table
     *
     * @return {Map}
     */
    static get mapping(){
        return tokensGC.mapping;
    }

    /**
     * Get fields to be move to analytics
     *
     * @return {Object}
     */
    static get fieldsToBeMoveToAnalytics() {
        return tokensGC.fieldsToBeMoveToAnalytics;
    }

    /**
     * Get table name with schema
     *
     * @returns {String}
     */
    get getTableNameWithSchema() {
        const oThis = this;
        return Constants.PRESTAGING_SCHEMA_NAME + '.tokens'+ oThis.tableNameSuffix;
    };

    /**
     * Get data processing property name
     *
     * @returns {String}
     */
    get getDataProcessingPropertyName(){
        const oThis = this;
        return dataProcessingInfoGC.tokenLastUpdatedAtProperty + oThis.tableNameSuffix;
    }

    /**
     * Get table primary key
     *
     * @returns {String}
     */
    get getTablePrimaryKey() {
        return 'token_id'
    };

    /**
     * Get temp table name
     *
     * @returns {String}
     */
    get getTempTableNameWithSchema() {
        const oThis = this;
        return Constants.PRESTAGING_SCHEMA_NAME + '.temp_tokens'+ oThis.tableNameSuffix;
    };

}

module.exports = Token;
