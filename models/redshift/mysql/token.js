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
        super({ dbName: dbName,
            object: params.object || {},
            chainId: params.chainId });

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
    getTableNameWithSchema() {
        const oThis = this;
        return Constants.PRESTAGING_SCHEMA_NAME + '.tokens_'+ oThis.chainId;
    };

    /**
     * Get data processing property name
     *
     * @returns {String}
     */
    get getDataProcessingPropertyName(){
        const oThis = this;
        return dataProcessingInfoGC.tokenLastUpdatedAtProperty + "_" + oThis.chainId;
    }

    /**
     * Get table primary key
     *
     * @returns {String}
     */
    getTablePrimaryKey() {
        return 'token_id'
    };

    /**
     * Get temp table name
     *
     * @returns {String}
     */
    getTempTableNameWithSchema() {
        const oThis = this;
        return Constants.PRESTAGING_SCHEMA_NAME + '.temp_tokens_'+ oThis.chainId;
    };

    /**
     * Get last updated at value from data_processing_info_{chain_id}
     *
     * @return {Promise}
     *
     */
    async getLastUpdatedAtValue() {
        const oThis = this;
        return await oThis.redshiftClient.parameterizedQuery("select * from " + dataProcessingInfoGC.getTableNameWithSchema + " "+"where property= $1", [oThis.getDataProcessingPropertyName]).then((res) => {
            return (res.rows[0].value);
        });
    }


    async fetchData(params){
        const oThis = this;
        let lastUpdatedAt = await oThis.getLastUpdatedAtValue();
        return new oThis.constructor({}).select("*").where(['updated_at > ?', lastUpdatedAt]).
        where(['id > ?', params.lastProcessedId]).order_by("id").
        limit(params.recordsToFetchOnce).fire();
    }

}

module.exports = Token;
