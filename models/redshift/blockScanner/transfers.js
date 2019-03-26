'use strict';
const rootPrefix = '../../..'
    , constants = require(rootPrefix + '/configs/constants')
    , transfersGC = require(rootPrefix + '/lib/globalConstants/redshift/transfers')
    , Base = require("./base")
    , logger = require(rootPrefix + '/helpers/custom_console_logger.js')
    , Util = require('util')
;

class Transfers extends Base {

    constructor(params) {
        super(params)
    }

    static get mapping() {
        return transfersGC.mapping;
    }

    getTableNameWithSchema() {
        const oThis = this;
        return constants.PRESTAGING_SCHEMA_NAME + '.transfers_' + oThis.chainId;
    };

    getTablePrimaryKey() {
        return ['tx_hash', 'event_index'];
    };

    getTempTableNameWithSchema() {
        const oThis = this;
        return constants.PRESTAGING_SCHEMA_NAME + '.temp_transfers_' + oThis.chainId;
    };

    handleBlockError(params) {

        logger.error("handle error for transfers");

        const oThis = this,
            deleteDuplicateQuery = Util.format("DELETE from %s WHERE concat(tx_hash, concat(\'-\', event_index)) IN(SELECT concat(tx_hash, concat(\'-\', event_index)) from %s where block_number >= $1);",
                oThis.getTempTableNameWithSchema(), oThis.getTableNameWithSchema());

        return oThis.parameterizedQuery(deleteDuplicateQuery, [params.minBlock]).then((res) => {
            oThis.applicationMailer.perform({object: oThis.object, reason: "duplicate transfers are deleted"});
            return Promise.resolve();
        });
    }
}

module.exports = Transfers;