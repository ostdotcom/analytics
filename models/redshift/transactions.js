'use strict';
const rootPrefix = '../..'
    , constants = require(rootPrefix + '/configs/constants')
    , transactionsGC = require(rootPrefix + '/lib/globalConstants/redshift/transactions')
    , Base = require("./base");
;

class Transactions extends Base {

    constructor(params){
        super(params)
    }


    get fullTableName(){
        return `${transactionsGC.getTableNameWithSchema}_${this.chainId}`;
    }


    static get mapping(){
        return transactionsGC.mapping;
    }

    // getModelImportString() {
    //     throw 'getModelImportString not implemented'
    // };

    getTableNameWithSchema() {
        const oThis = this;
        return constants.STAG_SCHEMA_NAME + '.transactions_'+ oThis.chainId;
    };

    getTablePrimaryKey() {
        return 'id'
    };

    getTempTableName() {
        const oThis = this;
        return constants.STAG_SCHEMA_NAME + '.temp_transactions_'+ oThis.chainId;
    };

    getS3FilePath() {
        return `s3://${ constants.S3_BUCKET_LINK}/`
    };

}
module.exports = Transactions;