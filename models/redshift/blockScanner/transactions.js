'use strict';
const rootPrefix = '../../..'
    , constants = require(rootPrefix + '/configs/constants')
    , transactionsGC = require(rootPrefix + '/lib/globalConstants/redshift/transactions')
    , Base = require("./base")
    , logger = require(rootPrefix + '/helpers/custom_console_logger.js')
    , ApplicationMailer = require(rootPrefix + '/lib/applicationMailer')
    , Util = require('util')
;


class Transactions extends Base {

    constructor(params) {
        super(params)
    }

    static get mapping() {
        return transactionsGC.mapping;
    }

    getTableNameWithSchema() {
        const oThis = this;
        return constants.PRESTAGING_SCHEMA_NAME + '.transactions_' + oThis.chainId;
    };

    getTablePrimaryKey() {
        return 'tx_hash';
    };

    getTempTableNameWithSchema() {
        const oThis = this;
        return constants.PRESTAGING_SCHEMA_NAME + '.temp_transactions_' + oThis.chainId;
    };

    handleBlockError(params) {
        logger.error("handle error for transactions");
        const oThis = this;
        oThis.applicationMailer.perform({object: oThis.object, reason: "duplicate transactions are deleted"});
        return Promise.resolve();
    }
}

module.exports = Transactions;