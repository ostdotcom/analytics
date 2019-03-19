'use strict';
/**
 * This is model for Token table.
 *
 * @module app/models/mysql/Token
 */
const rootPrefix = '../..',
    util = require(rootPrefix + '/lib/util'),
    ModelBase = require(rootPrefix + '/models/mysql/base'),
    Constants = require(rootPrefix + '/configs/constants'),
    tokensGC = require(rootPrefix + '/lib/globalConstants/redshift/token');

// Declare variables.
const dbName = 'kit_saas_' + Constants.SUB_ENVIRONMENT + '_' + Constants.ENVIRONMENT,
    statuses = {
        '1': tokensGC.notDeployed,
        '2': tokensGC.deploymentStarted,
        '3': tokensGC.deploymentCompleted,
        '4': tokensGC.deploymentFailed
    },
    invertedStatuses = util.invert(statuses);

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

    get fullTableName(){
        return `${tokensGC.getTableNameWithSchema}_${this.chainId}`;
    }


    static get mapping(){
        return tokensGC.mapping;
    }

    /**
     *
     * @param dbRow
     * @return {object}
     */
    formatDbData(dbRow) {
        return {
            id: dbRow.id,
            clientId: dbRow.client_id,
            name: dbRow.name,
            symbol: dbRow.symbol,
            conversionFactor: dbRow.conversion_factor,
            decimal: dbRow.decimal,
            status: dbRow.status,
            delayedRecoveryInterval: dbRow.delayed_recovery_interval,
            createdAt: dbRow.created_at,
            updatedTimestamp: dbRow.updated_at
        };
    }


    formatData(arrayToFormat) {
        const oThis = this;
        let arrayOfObjects = [];
        for (let object of arrayToFormat) {
            // let model = new tokensModel({object: object, chainId: oThis.chainId});
            let r = oThis.formatBlockScannerDataToArray(object);
            if (!r.success) {
                continue;
            }
            arrayOfObjects.push(r.data.data);
        }
        return arrayOfObjects;
    }

    getTableNameWithSchema() {
        const oThis = this;
        return Constants.STAG_SCHEMA_NAME + '.tokens_'+ oThis.chainId;
    };

    getTablePrimaryKey() {
        return 'token_id'
    };

    getTempTableName() {
        const oThis = this;
        return Constants.STAG_SCHEMA_NAME + '.temp_tokens_'+ oThis.chainId;
    };

    getS3FilePath() {
        return `s3://${ Constants.S3_BUCKET_LINK}/`
    };

}

module.exports = Token;
