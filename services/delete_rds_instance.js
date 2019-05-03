const rootPrefix = '..',
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    sleep = require(rootPrefix + '/lib/sleep'),
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
        oThis.dbInstanceIdentifier = '';
    }

    /**
     * Processing rds instance if default is not used, and calls mysql services
     *
     * @return {Promise}
     */
    async process(params) {

        const oThis = this;
        let r = {};
        oThis.dbInstanceIdentifier = params.dbInstanceIdentifier;

        r = await oThis.restoreDBInstance.validateRDSLogs();

        if (!r.success) {
            return r;
        }
        r = await oThis.deleteMysqlInstance({dbInstanceIdentifier: params.dbInstanceIdentifier});

        if (!r.success) {
            oThis.applicationMailer.perform({subject: 'RDSInstance could not be deleted', body: r});
            return Promise.reject(r);
        }

        return Promise.resolve(responseHelper.successWithData({
            dbInstanceIdentifier: oThis.dbInstanceIdentifier
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
        if (r.success || (r.success === false && r.debugOptions.error && r.debugOptions.error.code === RDSInstanceLogsGC.errorCodeDBInstanceNotFound ) ) {

            let checkRDSStatus = await oThis.restoreDBInstance.checkStatus(params);

            if (checkRDSStatus.success) {
                await oThis.restoreDBInstance.updateInstanceRowInDB(params.dbInstanceIdentifier, {'aws_status': checkRDSStatus.data.awsStatus});
            }

            isDeleted = await oThis.checkIfDeleted();

            if (isDeleted.success) {
                await oThis.restoreDBInstance.updateInstanceRowInDB(oThis.dbInstanceIdentifier, {'aws_status': RDSInstanceLogsGC.deletedStatus});
                return isDeleted;
            }
        } else {
            oThis.applicationMailer.perform({subject: 'Not able to delete instance', body: r});
            return Promise.reject(responseHelper.error({
                internal_error_identifier: 'd_rds_i_d_m_i_1',
                api_error_identifier: 'api_error_identifier'
            }));
        }
        return Promise.reject(responseHelper.error({
            internal_error_identifier: 'd_rds_i_d_m_i_2',
            api_error_identifier: 'api_error_identifier'
        }));
    }


    /**
     * check if RDS instance deleted
     *
     * @return {responseHelper}
     */
    async checkIfDeleted(params) {

        const oThis = this,
            maxTimeInMinsToWait = params.maxTimeInMinsToWait || 10; //default wait for 10 mins to delete instance
        let currentTime = 0;
        let timeStep = 1; // check status of instance on every timestep minute
        let checkRDSStatus = {};
        let isDeleted = false;


        while (true) {
            if (checkRDSStatus.success === false && isDeleted) {
                return responseHelper.successWithData({
                    host: checkRDSStatus.data.host,
                    dbInstanceIdentifier: oThis.dbInstanceIdentifier
                });
            } else if (currentTime >= maxTimeInMinsToWait) {
                let r = responseHelper.error({
                    internal_error_identifier: 'd_rds_i_c_i_d',
                    api_error_identifier: 'api_error_identifier'
                });
                oThis.applicationMailer.perform({
                    subject: 'Error: RDSInstanceLogs not deleted for long time',
                    body: r
                });
                return r;
            }
            sleep(currentTime * 1000 * 60);
            checkRDSStatus = await oThis.restoreDBInstance.checkStatus({dbInstanceIdentifier: oThis.dbInstanceIdentifier});

            isDeleted = checkRDSStatus.debugOptions.error &&
                checkRDSStatus.debugOptions.error.code === RDSInstanceLogsGC.errorCodeDBInstanceNotFound;


            //timeout is in milliseconds

            currentTime += timeStep;

        }
    }


}

module.exports = DeleteRDSInstance;