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









}
module.exports = Transfers;