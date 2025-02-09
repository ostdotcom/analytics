const rootPrefix = '..',
    sleep = require(rootPrefix + '/lib/sleep'),
    Constants = require(rootPrefix + "/configs/constants"),
    RDSInstanceLogsGC = require(rootPrefix + "/lib/globalConstants/redshift/RDSInstanceLogs"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    RDSInstanceOperations = require(rootPrefix + '/lib/RDSInstanceOperations'),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    RDSInstanceLogsModel = require(rootPrefix + '/models/redshift/mysql/rdsInstanceLogs');
;

class DeleteRDSInstance {

    constructor() {
        const oThis = this;
        oThis.applicationMailer = new ApplicationMailer();
        oThis.rdsInstanceOperations = new RDSInstanceOperations();
        oThis.rdsInstanceLogsModel = new RDSInstanceLogsModel();
        oThis.dbInstanceIdentifier = '';
    }

    /**
     * Processing rds instance if default is not used, and calls mysql services
     *
     * @return {responseHelper}
     */
    async process(params) {

        const oThis = this;
        let r;
        oThis.dbInstanceIdentifier = params.dbInstanceIdentifier;

        logger.log("Perform DELETE RDS Instance");
        if (Constants.USE_POINT_IN_TIME_RDS_INSTANCE == 'true') {
            r = await oThis.deleteMysqlInstance(params);

            if (!r.success) {
                oThis.applicationMailer.perform({subject: 'RDSInstance could not be deleted', body: r});
                return r;
            }
        }

        await oThis.rdsInstanceLogsModel.updateInstanceRowInDB(params.recordId, {'aws_status': RDSInstanceLogsGC.awsDeletedStatus});

        logger.log("DELETE RDS Instance completed successfully");
        return responseHelper.successWithData({
            dbInstanceIdentifier: oThis.dbInstanceIdentifier
        });
    }

    /**
     * Delete RDS instance
     *
     * @param {params} params required for deletion
     *
     * @return {responseHelper}
     */

    async deleteMysqlInstance(params) {
        const oThis = this;
        let isDeletedResp;
        let r = await oThis.rdsInstanceOperations.delete(params);

        if (r.success) {
            await oThis.rdsInstanceLogsModel.updateInstanceRowInDB(params.recordId, {'aws_status': RDSInstanceLogsGC.awsDeletingStatus});

            isDeletedResp = await oThis.checkIfDeleted({});
            if (isDeletedResp.success) {
                return isDeletedResp;
            } else {
                return responseHelper.error({
                    internal_error_identifier: 'd_rds_i_d_m_i_2',
                    api_error_identifier: 'api_error_identifier',
                    debug_options: isDeletedResp
                });
            }
        } else {
            return responseHelper.error({
                internal_error_identifier: 'd_rds_i_d_m_i_3',
                api_error_identifier: 'api_error_identifier',
                debug_options: r
            });
        }
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
        let timeStep = 2; // check status of instance on every timestep minute
        let describeDBInstancesResp = {};
        let isDeletedResp = false;


        while (true) {
            logger.info("CHECK Deletion of RDS Instance with timeStep=", timeStep);
            describeDBInstancesResp = await oThis.rdsInstanceOperations.describeDBInstances({dbInstanceIdentifier: oThis.dbInstanceIdentifier});
            isDeletedResp = describeDBInstancesResp.debugOptions.error &&
                describeDBInstancesResp.debugOptions.error.code === RDSInstanceLogsGC.errorCodeDBInstanceNotFound;


            if (describeDBInstancesResp.success === false && isDeletedResp) {
                return responseHelper.successWithData({
                    host: describeDBInstancesResp.data.host,
                    dbInstanceIdentifier: oThis.dbInstanceIdentifier
                });
            } else if (currentTime >= maxTimeInMinsToWait) {
                logger.error("MAX timeout reached for Deletion of RDS Instance");
                let r = responseHelper.error({
                    internal_error_identifier: 'd_rds_i_c_i_d',
                    api_error_identifier: 'api_error_identifier'
                });
                return r;
            }

            //timeout is in milliseconds
            currentTime += timeStep;
            await sleep(currentTime * 1000 * 60); // in minutes
        }
    }


}

module.exports = DeleteRDSInstance;