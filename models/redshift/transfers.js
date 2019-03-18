'use strict';
const rootPrefix = '../..'
    , constants = require(rootPrefix + '/configs/constants')
    , transfersGC = require(rootPrefix + '/lib/globalConstants/redshift/transfers')
    , Base = require("./base");
;

class Transfers extends Base {

    constructor(params){
        super(params)
    }


    get fullTableName(){
        return `${transfersGC.getTableNameWithSchema}_${this.chainId}`;
    }


    static get mapping(){
        return transfersGC.mapping;
    }

    getTableNameWithSchema() {
        const oThis = this;
        return constants.STAG_SCHEMA_NAME + '.transfers_'+ oThis.chainId;
    };

    getTablePrimaryKey() {
        return 'id';
    };

    getTempTableName() {
        const oThis = this;
        return constants.STAG_SCHEMA_NAME + '.temp_transfers_'+ oThis.chainId;
    };

    getS3FilePath() {
        return `s3://${ constants.S3_BUCKET_LINK}/`
    };

}
module.exports = Transfers;