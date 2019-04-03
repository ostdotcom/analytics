const rootPrefix = ".."
    , responseHelper = require(rootPrefix + '/lib/formatter/response')
    , constants = require(rootPrefix + '/configs/constants')
    , ApplicationMailer = require(rootPrefix + '/lib/applicationMailer')
;



class ValidateAndSanitize{

    constructor(params){
        const oThis = this;
        oThis.mapping = params.mapping;
        oThis.fieldsToBeMoveToAnalytics = params.fieldsToBeMoveToAnalytics;
        oThis.applicationMailer = new ApplicationMailer();



    }


    perform(params){
        const oThis = this;
        oThis.object = params.object;
        return oThis.validateAndFormatData();
    }



    validateField(columnInfo, value){
        const oThis = this;
        let fieldName = columnInfo[0];

        if(columnInfo[1]['required'] && !oThis.isPresent(value)){
            return responseHelper.error(
                {
                    internal_error_identifier: 'm_r_b_b_vf_1',
                    api_error_identifier: fieldName + '_is_missing',
                    debug_options: oThis.object
                }
            )
        }
        if (oThis.isPresent(value) && columnInfo[1]['min']  && parseInt(value) < columnInfo[1]['min']){
            return responseHelper.error(
                {
                    internal_error_identifier: 'm_r_b_b_vf_2',
                    api_error_identifier: fieldName + '_is_lesser_than_valid',
                    debug_options: oThis.object
                }
            )
        }

        if(oThis.isPresent(value) && columnInfo[1]['between']  && ! columnInfo[1]['between'].includes(parseInt(value))){
            return responseHelper.error(
                {
                    internal_error_identifier: 'm_r_b_b_vf_3',
                    api_error_identifier: fieldName + '_is_not_included_in_field',
                    debug_options: oThis.object
                }
            )
        }
        return responseHelper.successWithData({});
    }


    validateAndFormatData() {
        const oThis = this;
        let formattedMap = new Map(),
            finalFormattedMap = new Map();

        for (let column of oThis.mapping) {
            //eg. column[0] => tx_uuid, column[1] => {name: 'transactionUuid', isSerialized: false, required: true,
            // copyIfNotPresent: 'transactionStatus'}
            let name = column[1]['name'];

            let value = oThis.object[name];
            if (column[1]['isSerialized'] == true && value) {
                let fieldData = JSON.parse(value);
                value = fieldData[column[1]['property']];
            }
            value = typeof value == 'undefined' && column[1]['copyIfNotPresent'] ? oThis.object[column[1]['copyIfNotPresent']] : value;

            let r = oThis.validateField(column, value);

            if(! r.success){
                oThis.applicationMailer.perform({subject: "Validation failed" , body: {err: r}});
                if (constants.ENVIRONMENT == "staging" || constants.ENVIRONMENT == "development"){

                    return responseHelper.successWithData({
                        data: new Map()
                    });
                }
                return r;
            }

            formattedMap.set(column[0], value);
        }

        for (let key of oThis.fieldsToBeMoveToAnalytics){
            finalFormattedMap.set(key, formattedMap.get(key));
        }

        console.log(finalFormattedMap, "finalFormattedMapfinalFormattedMapfinalFormattedMap");
        return responseHelper.successWithData({
            data: finalFormattedMap
        });
    }


    isPresent(val){
        return val || parseInt(val) === 0;
    }

}


module.exports = ValidateAndSanitize;