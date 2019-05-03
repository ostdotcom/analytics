const rootPrefix = "..",
    Constants = require(rootPrefix + "/configs/constants"),
    AWS = require("aws-sdk"),
    responseHelper = require(rootPrefix + '/lib/formatter/response');


class ManageRDSInstanceWrapper {


    constructor() {
        const oThis = this;

        oThis.rds = new AWS.RDS({
            apiVersion: Constants.RESTORE_RDS_API_VERSION,
            region: Constants.RESTORE_RDS_REGION,
            accessKeyId: Constants.RESTORE_RDS_REGION_ACCESS_KEY,
            secretAccessKey: Constants.RESTORE_RDS_REGION_ACCESS_SECRET
        });
    }

    /**
     * create rds instace
     *
     * @param {params} params required for creation
     *
     * @return {Promise}
     */
    async create(params) {

        const oThis = this;
        return new Promise((resolve, reject) => {

            oThis.rds.restoreDBInstanceToPointInTime(params, function (err, data) {
                if (err) {
                    return resolve (responseHelper.error({
                        internal_error_identifier: 'm_rds_i_q_c_1',
                        api_error_identifier: 'api_error_identifier',
                        debug_options: {error: err}
                    }));
                } else if(data) {
                    return resolve(responseHelper.successWithData(data));          // successful response
                } else{
                    throw "INVALID AWS RESTORE RDS RESPONSE";
                }
            });
        });
    }

    /**
     * delete rds instance
     *
     * @param {params} params required deletion
     *
     * @return {Promise}
     */
    delete(params) {
        const oThis = this;
        return new Promise((resolve, reject) => {

            oThis.rds.deleteDBInstance(params, function (err, data) {
                if (err) {
                    return resolve (responseHelper.error({
                        internal_error_identifier: 'm_rds_i_q_d_1',
                        api_error_identifier: 'api_error_identifier',
                        debug_options: {error: err}
                    }));
                } else if(data) {
                    return resolve(responseHelper.successWithData( data));          // successful response
                } else{
                    throw "INVALID AWS RESTORE RDS RESPONSE";
                }
            });

        });

    }


    /**
     * check rds instace status
     *
     * @param {params} params required for checking status
     *
     * @return {Promise}
     */
    async describeDBInstances(params) {
        const oThis = this;
        return new Promise((resolve, reject) => {

            oThis.rds.describeDBInstances(params, function (err, data) {
                if (err) {
                    return resolve (responseHelper.error({
                        internal_error_identifier: 'm_rds_i_q_cs_1',
                        api_error_identifier: 'api_error_identifier',
                        debug_options: {error: err}
                    }));
                } else if(data){
                    return resolve(responseHelper.successWithData( data));          // successful response
                } else{
                    throw "INVALID AWS RESTORE RDS RESPONSE";
                }
            });

        });


    }



}

module.exports = ManageRDSInstanceWrapper;