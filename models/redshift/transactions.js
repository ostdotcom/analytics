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

    static get mapping(){
        return transactionsGC.mapping;
    }

    getTableNameWithSchema() {
        const oThis = this;
        return constants.PRESTAGING_SCHEMA_NAME + '.transactions_'+ oThis.chainId;
    };

    getTablePrimaryKey() {
        return 'id'
    };

    getTempTableNameWithSchema() {
        const oThis = this;
        return constants.PRESTAGING_SCHEMA_NAME + '.temp_transactions_'+ oThis.chainId;
    };

}
module.exports = Transactions;