'use strict';
/**
 * This is model for Token table.
 *
 * @module /models/mysql/token
 */
const rootPrefix = '../..',
    ModelBase = require(rootPrefix + '/models/mysql/base'),
    Constants = require(rootPrefix + '/configs/constants'),
    tokensGC = require(rootPrefix + '/lib/globalConstants/redshift/token');

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
     * Format data
     *
     * @returns {Array[objects]}
     */
    formatData(arrayToFormat) {
        const oThis = this;
        let arrayOfObjects = [];
        for (let object of arrayToFormat) {
            // let model = new tokensModel({object: object, chainId: oThis.chainId});
            let r = oThis.formatMysqlDataToArray(object);
            if (!r.success) {
                continue;
            }
            arrayOfObjects.push(r.data.data);
        }
        return arrayOfObjects;
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
    getTempTableName() {
        const oThis = this;
        return Constants.PRESTAGING_SCHEMA_NAME + '.temp_tokens_'+ oThis.chainId;
    };

    /**
     * Get s3 file path
     *
     * @returns {String}
     */
    getS3FilePath() {
        return `s3://${ Constants.S3_BUCKET_NAME}/`
    };

    /**
     * Get Iam role
     *
     * @returns {String}
     */
    getIamRole() {
        return Constants.S3_IAM_ROLE
    };

}

module.exports = Token;
