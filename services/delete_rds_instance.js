const rootPrefix = '..',
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    RDSInstanceLogsGC = require(rootPrefix + "/lib/globalConstants/redshift/RDSInstanceLogsGC"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    RestoreDBInstance = require(rootPrefix + '/lib/RestoreRDSInstance');

class DeleteRDSInstance {

    constructor() {
        const oThis = this;
        oThis.redshiftClient = new RedshiftClient();
        oThis.applicationMailer = new ApplicationMailer();
        oThis.restoreDBInstance = new RestoreDBInstance();
    }

    /**
     * Processing rds instance if default is not used, and calls mysql services
     *
     * @return {Promise}
     */
    async process() {

        const oThis = this;
        let promiseArray = [];
        let r = {};

        r = oThis.restoreDBInstance.validateRDSLogs();

        if (!r.success) {
            return r;
        }

        r = await oThis.deleteMysqlInstance();
        if (!r.success) {
            oThis.applicationMailer.perform({subject: 'RDSInstanceLogs table error', body: r});
            return Promise.reject(r);
        }

        return Promise.resolve(responseHelper.successWithData({
            host: oThis.dynamicHost,
            dbInstanceIdentifier: r.data.dbInstanceId
        }));
    }

    /**
     * Delete RDS instance
     *
     * @param {params} params required for deletion
     *
     * @return {Promise}
     */

    async deleteMysqlInstance(params) {
        const oThis = this;
        let isDeleted;
        let r = await oThis.restoreDBInstance.delete(params);

        if (r.success) {

            let checkRDSStatus = await oThis.restoreDBInstance.checkStatus(params);

            if (checkRDSStatus.success) {
                await oThis.restoreDBInstance.updateInstanceRowInDB(params.dbInstanceId, {'aws_status': checkRDSStatus.data.awsStatus});
            }

            isDeleted = await oThis.checkIfDeleted({maxTimeInMinsToWait: 5 });

            if (isDeleted.success) {
                return oThis.restoreDBInstance.updateInstanceRowInDB(isDeleted.data.dbInstanceId, {'aws_status': RDSInstanceLogsGC.deletedStatus});
            }
        } else {
            oThis.applicationMailer.perform({subject: 'Not able to delete instance', body: r});
            return Promise.reject();
        }
        return Promise.resolve();
    }



    /**
     * check if RDS instance deleted
     *
     * @return {responseHelper}
     */
    async checkIfDeleted(params) {

        const oThis = this,
            maxTimeInMinsToWait = params.maxTimeInMinsToWait;
        let currentTime = 0;
        let timeStep = 2;
        let checkRDSStatus = {};
        let isDeleted = false;

        let r = oThis.restoreDBInstance.validateRDSLogs();
        if (!r.success) {
            return r;
        }
        while (!(!checkRDSStatus.success && isDeleted)
        && currentTime < maxTimeInMinsToWait) {
            (function (currentTime) {
                setTimeout(async function () {
                    checkRDSStatus = await oThis.restoreDBInstance.checkStatus(r.data);
                    isDeleted = checkRDSStatus.debugOptions.code === RDSInstanceLogsGC.errorCodeDBInstanceNotFound;
                }, currentTime * 1000 * 60); //timeout is in milliseconds
            })(currentTime += timeStep);
        }

        if (!checkRDSStatus.success && isDeleted) {
            return responseHelper.successWithData(r.data);
        } else {
            let r = responseHelper.error({
                internal_error_identifier: 'msw_cid',
                api_error_identifier: 'api_error_identifier'
            });
            oThis.applicationMailer.perform({subject: 'Error: RDSInstanceLogs not deleted since', body: r});
            return r;
        }
    }



}

module.exports = DeleteRDSInstance;