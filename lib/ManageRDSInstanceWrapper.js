const rootPrefix = "..",
    Constants = require(rootPrefix + "/configs/constants"),
    AWS = require("aws-sdk");


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
                    return reject({err: err});
                } else {
                    return resolve({data: data});          // successful response
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
                    return reject({err: err});
                } else {
                    return resolve({data: data});          // successful response
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
    async checkStatus(params) {
        const oThis = this;
        return new Promise((resolve, reject) => {

            oThis.rds.describeDBInstances(params, function (err, data) {
                if (err) {
                    return reject({err: err});
                } else {
                    return resolve({data: data});          // successful response
                }
            });

        });


    }



}

module.exports = ManageRDSInstanceWrapper;