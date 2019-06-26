const rootPrefix = '..',
    Util = require('util'),
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    sleep = require(rootPrefix + '/lib/sleep'),
    RDSInstanceLogsGC = require(rootPrefix + "/lib/globalConstants/redshift/RDSInstanceLogs"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    RDSInstanceOperations = require(rootPrefix + '/lib/RDSInstanceOperations'),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    RDSInstanceLogsModel = require(rootPrefix + '/models/redshift/mysql/rdsInstanceLogs');

class CheckRDSInstance {

    constructor(params) {
        const oThis = this;
        oThis.params = params;
        oThis.redshiftClient = new RedshiftClient();
        oThis.rdsInstanceLogsModel = new RDSInstanceLogsModel();
        oThis.applicationMailer = new ApplicationMailer();
        oThis.rdsInstanceOperations = new RDSInstanceOperations();
        oThis.dbInstanceIdentifier = '';
    }

    /**
     * Processing rds instance if default is not used, and calls mysql services
     *
     * @return {responseHelper}
     */
    async process() {

        const oThis = this;
        let r, validateResp;

        logger.log("Perform CHECK RDS Instance");
        validateResp = await oThis.validateRDSLogs();

        if (!validateResp.success) {
            oThis.applicationMailer.perform({
                subject: 'Error in CheckRDSInstance-validateRDSLogs',
                body: {err: validateResp}
            });
            return validateResp;
        }

        logger.log("Starting to CHECK Availability of RDS Instance");
        r = await oThis.checkAvailabilityOfRDSInstance(validateResp.data);

        if (!r.success) {
            oThis.applicationMailer.perform({
                subject: 'Error in CheckRDSInstance-checkAvailabilityOfRDSInstance',
                body: r
            });
            return r;
        }
        await oThis.rdsInstanceLogsModel.updateInstanceRowInDB(validateResp.data.recordId, {
            'aws_status': r.data.awsStatus,
            'host': r.data.host
        });

        logger.log("CHECK Availability of RDS Instance complete with success");
        return r;
    }

    /**
     * validate RDSInstanceLogs table
     *
     * @return {responseHelper}
     *
     */
    validateRDSLogs() {
        const oThis = this;
        let r;
        let query = Util.format("SELECT * FROM %s where aws_status != $1", oThis.rdsInstanceLogsModel.getTableNameWithSchema);

        return oThis.redshiftClient.parameterizedQuery(query, [RDSInstanceLogsGC.awsDeletedStatus]).then((res) => {
            let resultRow = res.rows[0];
            if (res.rows.length != 1) {

                r = responseHelper.error({
                    internal_error_identifier: 'msw_v_rds_l_1',
                    api_error_identifier: 'api_error_identifier',
                    debug_options: resultRow
                });
                return r;

            } else if (RDSInstanceLogsGC.mappingOfAwsStatus[resultRow.aws_status] != RDSInstanceLogsGC.mappedNotAvailableStatus) {
                return responseHelper.error({
                    internal_error_identifier: 'msw_v_rds_l_2',
                    api_error_identifier: 'api_error_identifier',
                    debug_options: resultRow
                });

            } else if ((Math.floor(Date.now() / 1000) - resultRow.creation_time) > 4 * 60 * 60) {

                // checks if creation_time is lesser than 4 hours
                return responseHelper.error({
                    internal_error_identifier: 'msw_v_rds_l_3',
                    api_error_identifier: 'api_error_identifier',
                    debug_options: resultRow
                });

            } else {
                oThis.dbInstanceIdentifier = resultRow.instance_identifier;
                return responseHelper.successWithData({creationTime: resultRow.creation_time, recordId: resultRow.id})
            }
        });
    }


    /**
     * check health of RDS instance
     *
     * @return {responseHelper}
     */
    async checkAvailabilityOfRDSInstance(params) {
        const oThis = this;
        const maxTimeInMinsToWait = 180, // wait for that much time to change status of instance to available before sending error
            warningTimeInMinsToWait = 60; // wait for that much time to send warning mail
        let creationTime = params.creationTime;
        let warnEmailSent = false;
        let timeStep = 0;
        let timeToWait = 2; // check after every that much time
        let checkAvailabilityResp;
        let isAvailable;


        while (true) {

            logger.info("CHECK Availability of RDS Instance with timeStep=", timeStep);
            //timeout is in milliseconds
            let currentTime = Math.floor(Date.now() / 1000);
            checkAvailabilityResp = await oThis.rdsInstanceOperations.describeDBInstances({dbInstanceIdentifier: oThis.dbInstanceIdentifier});
            isAvailable = checkAvailabilityResp.data && checkAvailabilityResp.data.mappedAwsStatus === RDSInstanceLogsGC.awsAvailableStatus;


            logger.log("Current rds instance status:", checkAvailabilityResp.data.awsStatus);
            if (!checkAvailabilityResp.success) {
                return checkAvailabilityResp;
            } else if (checkAvailabilityResp.success && isAvailable) {
                return responseHelper.successWithData({
                    host: checkAvailabilityResp.data.host,
                    dbInstanceIdentifier: oThis.dbInstanceIdentifier,
                    awsStatus: checkAvailabilityResp.data.awsStatus,
                    recordId: params.recordId
                });
            } else if (!warnEmailSent && (((currentTime - creationTime) / 60) >= warningTimeInMinsToWait)) {
                logger.warn("CHECK Availability of RDS Instance Warning Timeout Reached");
                oThis.applicationMailer.perform({
                    subject: 'Warning: RDSInstanceLogs not available for more than 30 mins',
                    body: checkAvailabilityResp
                });
                warnEmailSent = true;
            } else if (((currentTime - creationTime) / 60) >= maxTimeInMinsToWait) {
                logger.error("CHECK Availability of RDS Instance MAX Timeout Reached");
                let r = responseHelper.error({
                    internal_error_identifier: 'msw_chri_1',
                    api_error_identifier: 'api_error_identifier',
                    debug_options: {error: "CHECK Availability of RDS Instance MAX Timeout Reached"}
                });
                oThis.applicationMailer.perform({
                    subject: 'Error: RDSInstanceLogs not available for long time',
                    body: checkAvailabilityResp
                });
                return r;
            }

            timeToWait += timeStep;
            await sleep(timeToWait * 1000 * 60); // sleep is in minutes

        }
    }
}

module.exports = CheckRDSInstance;