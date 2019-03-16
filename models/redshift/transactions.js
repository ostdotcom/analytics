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









}
module.exports = Transactions;