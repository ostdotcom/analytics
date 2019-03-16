const rootPrefix = "../.."
    , responseHelper = require(rootPrefix + '/lib/formatter/response');

class Base {

    constructor(params) {
        const oThis = this;
        oThis.chainId = params.config.chainId;
        oThis.object = params.object;
    }

    validateAndFormatBlockScannerData() {
        const oThis = this;
        let formattedMap = new Map();
        for (let column of oThis.constructor.mapping) {
            //eg. column[0] => tx_uuid, column[1] => {name: 'transactionUuid', isSerialized: false, required: true,
            // copyIfNotPresent: 'transactionStatus'}
            if (column[1]['required'] && !(column[1]['name'] in oThis.object)) {
                //todo: send email on fail
                console.log(column[1]['name']);
                return responseHelper.error(
                    {
                        internal_error_identifier: 'm_r_b_vaf',
                        api_error_identifier: '',
                        debug_options: {}
                    }
                )
            }
            let value = oThis.object[column[1]['name']];
            if (column[1]['isSerialized'] == true && value) {
                let fieldData = JSON.parse(value);
                value = fieldData[column[1]['property']];
            }
            value = typeof value == 'undefined' ? oThis.object[column[1]['copyIfNotPresent']] : value;
            formattedMap.set(column[0], value);
        }
        return responseHelper.successWithData({
            data: formattedMap
        });

    }

    formatBlockScannerDataToArray() {
        const oThis = this;
        let r = oThis.validateAndFormatBlockScannerData();
        if (!r.success) return r;
        let formattedMap = r.data;
        return responseHelper.successWithData({
            data: Array.from(formattedMap.data.values())
        });
    }


}


module.exports = Base;