const rootPrefix = '..',
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    sleep = require(rootPrefix + '/lib/sleep'),
    RDSInstanceLogs = require(rootPrefix + "/lib/globalConstants/redshift/RDSInstanceLogs"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    RestoreDBInstance = require(rootPrefix + '/lib/RestoreRDSInstance');

class CheckRDSInstance {

    constructor(params) {
        const oThis = this;
        oThis.params = params;
        oThis.redshiftClient = new RedshiftClient();
        oThis.applicationMailer = new ApplicationMailer();
        oThis.restoreDBInstance = new RestoreDBInstance();
        oThis.dbInstanceIdentifier = '';
    }

    /**
     * Processing rds instance if default is not used, and calls mysql services
     *
     * @return {responseHelper}
     */
    async process() {

        const oThis = this;
        let r = {};

        r = await oThis.validateRDSLogs();

        if (!r.success) {
            oThis.applicationMailer.perform({
                subject: 'Check RDS Instance validate logs failed',
                body: {err: r}
            });
            return r;
        }

        r = await oThis.checkAvailabilityOfRDSInstance(r.data);

        if (!r.success) {
            oThis.applicationMailer.perform({subject: 'RDSInstanceLogs table error in check RDS instance service', body: r});
            return r;
        }
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
        let query = Util.format("SELECT * FROM %s where aws_status != $1", RDSInstanceLogs.getTableNameWithSchema);

        return oThis.redshiftClient.parameterizedQuery(query, [RDSInstanceLogs.deletedStatus]).then((res) => {
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

            } else if ((Math.floor(Date.now()) - resultRow.restore_time) > 4 * 60 * 60) {

                // checks if restore time is greater than 4 hours
                return responseHelper.error({
                    internal_error_identifier: 'msw_v_rds_l_3',
                    api_error_identifier: 'api_error_identifier',
                    debug_options: resultRow
                });

            } else {

                oThis.dbInstanceIdentifier = resultRow.instance_identifier;
                return responseHelper.successWithData({lastActionTime: resultRow.last_action_time})
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
        const maxTimeInMinsToWait = 60, // wait for that much time to change status of instance to available before sending error
            warningTimeInMinsToWait = 30; // wait for that much time to send warning mail
        let lastActionTime = params.lastActionTime;
        let currentTime = Math.floor(Date.now() / 1000);
        let timeStep = 5; // check after every that much time
        let timeToWait = 0;
        let checkAvailability;
        let isAvailable;


        while (true) {

            checkAvailability = oThis.restoreDBInstance.checkStatus({dbInstanceIdentifier: oThis.dbInstanceIdentifier});
            isAvailable = checkAvailability.data.mappedAwsStatus === RDSInstanceLogsGC.awsAvailableStatus;


            if (checkAvailability.success && isAvailable) {
                await oThis.restoreDBInstance.updateInstanceRowInDB(oThis.dbInstanceIdentifier, {
                    'aws_status': checkAvailability.data.awsStatus,
                    'host': checkAvailability.data.host
                });
                return responseHelper.successWithData({
                    host: checkAvailability.data.host,
                    dbInstanceIdentifier: oThis.dbInstanceIdentifier
                });
            } else if (((currentTime - lastActionTime) / 60) >= warningTimeInMinsToWait) {
                oThis.applicationMailer.perform({
                    subject: 'Warning: RDSInstanceLogs not able to delete since long time',
                    body: {checkAvailability}
                });
            } else if (((currentTime - lastActionTime) / 60) >= maxTimeInMinsToWait) {
                let r = responseHelper.error({
                    internal_error_identifier: 'msw_chri',
                    api_error_identifier: 'api_error_identifier'
                });
                oThis.applicationMailer.perform({
                    subject: 'Error: RDSInstanceLogs not available for long time',
                    body: checkAvailability
                });
                return r;
            }

            //timeout is in milliseconds
            currentTime = Math.floor(Date.now() / 1000);
            timeToWait += timeStep;
            sleep(timeToWait * 1000 * 60); // sleep is in minutes

        }
    }
}

module.exports = CheckRDSInstance;