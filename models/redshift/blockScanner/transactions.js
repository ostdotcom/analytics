'use strict';
const rootPrefix = '../../..'
    , constants = require(rootPrefix + '/configs/constants')
    , transactionsGC = require(rootPrefix + '/lib/globalConstants/redshift/transactions')
    , Base = require("./base")
    , logger = require(rootPrefix + '/helpers/custom_console_logger.js')
    , ApplicationMailer = require(rootPrefix + '/lib/applicationMailer')
    , Util = require('util')
    , responseHelper = require(rootPrefix + '/lib/formatter/response')
;


class Transactions extends Base {

    constructor(params) {
        super(params)
    }

    static get mapping() {
        return transactionsGC.mapping;
    }

    static get fieldsToBeMoveToAnalytics() {
        return transactionsGC.fieldsToBeMoveToAnalytics;
    }

    getTableNameWithSchema() {
        const oThis = this;
        return constants.PRESTAGING_SCHEMA_NAME + '.aux_transactions_' + oThis.chainId;
    };

    getTablePrimaryKey() {
        return 'tx_hash';
    };

    getTempTableNameWithSchema() {
        const oThis = this;
        return constants.PRESTAGING_SCHEMA_NAME + '.temp_aux_transactions_' + oThis.chainId;
    };

    // handleBlockError(params) {
    //     logger.error("handle error for transactions");
    //     const oThis = this;
    //     let errObj = {object: oThis.object, reason: "transactions validation error"}
    //     oThis.applicationMailer.perform(errObj);
    //     return Promise.reject(responseHelper.error({
    //         internal_error_identifier: 'm_r_b_b_t_hbe_1',
    //         api_error_identifier: 'handleBlockError',
    //         debug_options: errObj
    //     }));
    // }

	handleBlockError(params) {

		logger.error("handle error for transactions");

		const oThis = this,
			deleteDuplicateQuery = Util.format("DELETE from %s WHERE tx_hash IN(SELECT tx_hash from %s where block_number >= $1 and block_number <= $2);",
				oThis.getTempTableNameWithSchema(), oThis.getTableNameWithSchema());

		oThis.initRedshift();

		return oThis.redshiftClient.parameterizedQuery(deleteDuplicateQuery, [params.minBlock, params.maxBlock]).then((res) => {
		    logger.warn("duplicate transactions are deleted");
			oThis.applicationMailer.perform( {subject :"duplicate transactions are deleted",  body:  oThis.object});
				return oThis.insertToMainTable();
	});
	}



}

module.exports = Transactions;