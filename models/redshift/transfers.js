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

    static get mapping(){
        return transfersGC.mapping;
    }

    getTableNameWithSchema() {
        const oThis = this;
        return constants.PRESTAGING_SCHEMA_NAME + '.transfers_'+ oThis.chainId;
    };

    getTablePrimaryKey() {
        return 'id';
    };

    getTempTableNameWithSchema() {
        const oThis = this;
        return constants.PRESTAGING_SCHEMA_NAME + '.temp_transfers_'+ oThis.chainId;
    };

}
module.exports = Transfers;