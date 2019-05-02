const rootPrefix = '..',
    MysqlService = require(rootPrefix + "/mysql_service"),
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    RDSInstanceLogsGC = require(rootPrefix + "/lib/globalConstants/redshift/RDSInstanceLogsGC"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    RestoreDBInstance = require(rootPrefix + '/lib/RestoreRDSInstance');

class MysqlServiceWrapper {

    constructor(params) {
        const oThis = this;
        oThis.params = params;
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

        if (oThis.params.defaultConfig === false) {
            r = await oThis.checkHealthOfRDSInstance();
            if (!r.success) {
                oThis.applicationMailer.perform({subject: 'RDSInstanceLogs table error', body: r});
                return Promise.reject(r);
            }
            oThis.params.dynamicMysqlHost = oThis.dynamicHost;
        }

        for (let table of oThis.tables) {
            let mysqlService = new MysqlService({...oThis.params, model: table});
            promiseArray.push(mysqlService.process());
        }

        return Promise.all(promiseArray).then(async (res) => {
            let endTime = Date.now();
            logger.log("processing finished at", endTime);
            logger.log("Total time to process in milliseconds", (endTime - startTime));
            if(! oThis.params.defaultConfig){
                await oThis.deleteMysqlInstance({dbInstanceId: r.data.dbInstanceId});
                await oThis.updateInstanceRowInDB(r.data.dbInstanceId, {'cron_status': RDSInstanceLogsGC.processed});
            }
            return Promise.resolve({});
        }).catch(async (e) => {
            if(! oThis.params.defaultConfig){
                await oThis.deleteMysqlInstance({dbInstanceId: r.data.dbInstanceId });
            }
            return Promise.reject(e);
        });
    }


    /**
     * Update row in rds_instance_logs table
     *
     *
     * @param {dbInstanceId} DB instance identifier
     * @param {params} params to be updated
     *
     * @return {Promise}
     */
    updateInstanceRowInDB(dbInstanceId, params) {
        const oThis = this;
        let arr = [];
        for (let param in params) {
            arr.push(`${param}='${params[param]}'`)
        }

        let query = `UPDATE ${RDSInstanceLogsGC.getTableNameWithSchema} SET ${arr.join(", ")} where
                    status != '${RDSInstanceLogsGC.deletedStatus}' and instance_identifier = dbInstanceId`;
        return oThis.redshiftClient.query(query).then(async (res) => {
            return responseHelper.successWithData({});
        });
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
        if (host) {
            let r = await oThis.restoreDBInstance.delete(params);

            if (r.success) {
                isDeleted = await oThis.checkIfDeleted();
                if (isDeleted.success) {
                    return oThis.updateInstanceRowInDB(isDeleted.data.dbInstanceId, {'aws_status': RDSInstanceLogsGC.deletedStatus});
                }
            } else {
                oThis.applicationMailer.perform({subject: 'Not able to delete instance', body: r});
                return Promise.reject();
            }
        }
        return Promise.resolve();
    }


    /**
     * validate RDSInstanceLogs table
     *
     * @return {responseHelper}
     *
     */
    validateRDSLogs() {
        const oThis = this;
        let query = `SELECT * FROM ${RDSInstanceLogsGC.getTableNameWithSchema} where aws_status != '${RDSInstanceLogsGC.deletedStatus}'`;
        return oThis.redshiftClient.query(query).then((res) => {
            let resultRow = res.rows[0];
            if (res.rows.length > 1) {
                let r = responseHelper.error({
                    internal_error_identifier: 'msw_v_rds_l',
                    api_error_identifier: 'api_error_identifier'
                });
                oThis.applicationMailer.perform({subject: 'More than one not deleted instances available', body: r});
                return r;
            } else {
                return responseHelper.successWithData({dbInstanceId: resultRow.instance_identifier})

            }


        });
    }


    /**
     * check health of RDS instance
     *
     * @return {responseHelper}
     */
    async checkHealthOfRDSInstance() {
        const oThis = this,
            maxTimeInMinsToWait = 60,
            warningTimeInMinsToWait = 30;
        let currentTime = 0;
        let timeStep = 5;
        let checkAvailability = {};
        let isAvailable = false;
        let r = oThis.validateRDSLogs();

        if (!r.success) {
            return r;
        }

        while (!(checkAvailability.success && isAvailable) && currentTime < maxTimeInMinsToWait) {
            (function (currentTime) {
                setTimeout(async function () {
                    checkAvailability = await oThis.checkStatus(r.data, currentTime, warningTimeInMinsToWait);
                    isAvailable = checkAvailability.data.mappedAwsStatus === RDSInstanceLogsGC.availableStatus
                }, currentTime * 1000 * 60); //timeout is in milliseconds

            })(currentTime += timeStep);
        }

        if (checkAvailability.success && isAvailable) {

            oThis.dynamicHost = checkAvailability.data.host;

            await oThis.updateInstanceRowInDB(r.data.dbInstanceId, {
                'aws_status': checkAvailability.data.awsStatus,
                'host': oThis.dynamicHost
            });
            return responseHelper.successWithData({host: host, ...r.data});
        } else {
            let r = responseHelper.error({
                internal_error_identifier: 'msw_chri',
                api_error_identifier: 'api_error_identifier'
            });
            oThis.applicationMailer.perform({subject: 'Error: RDSInstanceLogs not available for long time', body: r});
            return r;
        }
    }

    /**
     * check if RDS instance deleted
     *
     * @return {responseHelper}
     */
    async checkIfDeleted() {

        const oThis = this,
            maxTimeInMinsToWait = 30,
            warningTimeInMinsToWait = 15;
        let currentTime = 0;
        let timeStep = 2;
        let checkRDSStatus = {};
        let isDeleted = false;

        let r = oThis.validateRDSLogs();
        if (!r.success) {
            return r;
        }
        while (!(!checkRDSStatus.success && isDeleted)
        && currentTime < maxTimeInMinsToWait) {
            (function (currentTime) {
                setTimeout(async function () {
                    checkRDSStatus = await oThis.checkStatus(r.data, currentTime, warningTimeInMinsToWait);
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


    /**
     * check status of rds instance
     *
     * @return {responseHelper}
     */

    async checkStatus(params, currentTime, warningTimeInMinsToWait) {
        const oThis = this;
        let checkRDSStatus = await oThis.restoreDBInstance.checkStatus(params);
        if (currentTime >= warningTimeInMinsToWait) {
            oThis.applicationMailer.perform({
                subject: 'Warning: RDSInstanceLogs not able to delete since long time',
                body: {}
            });
        }
        return checkRDSStatus;
    }
}

module.exports = MysqlServiceWrapper;