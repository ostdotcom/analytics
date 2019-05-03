const rootPrefix = '..',
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    sleep = require(rootPrefix + '/lib/sleep'),
    RDSInstanceLogsGC = require(rootPrefix + "/lib/globalConstants/redshift/RDSInstanceLogsGC"),
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
     * @return {Promise}
     */
    async process() {

        const oThis = this;
        let r = {};

        r = await oThis.validateRDSLogs();

        if (!r.success) {
            //return result base and check in cron
            //mail
            return Promise.reject(r);
        }

        return new Promise(async (resolve, reject) => {
            r = await oThis.checkAvailabilityOfRDSInstance();
            if (!r.success) {
                oThis.applicationMailer.perform({subject: 'RDSInstanceLogs table error', body: r});
                return reject(r);
            }

            return resolve(r);
        });
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
            if (res.rows.length != 1) {
                //check aws status of row to be not available
                //check point in time

                let r = responseHelper.error({
                    internal_error_identifier: 'msw_v_rds_l',
                    api_error_identifier: 'api_error_identifier'
                });
                oThis.applicationMailer.perform({subject: 'Invalid number of non deleted instances in table',
                    body: {err: r, res: res}});
                return r;
            } else {
                oThis.dbInstanceIdentifier = resultRow.instance_identifier;
                return responseHelper.successWithData({})
            }


        });
    }


    /**
     * check health of RDS instance
     *
     * @return {responseHelper}
     */
    async checkAvailabilityOfRDSInstance() {
        const oThis = this;

        //use last action time
        const maxTimeInMinsToWait = 60, // wait for that much time to change status of instance to available before sending error
            warningTimeInMinsToWait = 30; // wait for that much time to send warning mail
        let currentTime = 0;
        let timeStep = 5; // check after every that much time
        let checkAvailability = {};
        let isAvailable = false;


        while (true) {

            checkAvailability = await oThis.checkStatusAndSendWarningMail(currentTime, warningTimeInMinsToWait);
            isAvailable = checkAvailability.data.mappedAwsStatus === RDSInstanceLogsGC.availableStatus;


            if (checkAvailability.success && isAvailable) {
                await oThis.restoreDBInstance.updateInstanceRowInDB(oThis.dbInstanceIdentifier, {
                    'aws_status': checkAvailability.data.awsStatus,
                    'host': checkAvailability.data.host
                });
                return responseHelper.successWithData({
                    host: checkAvailability.data.host,
                    dbInstanceIdentifier: oThis.dbInstanceIdentifier
                });
            //    send warning mail
            } else if (currentTime >= maxTimeInMinsToWait) {
                let r = responseHelper.error({
                    internal_error_identifier: 'msw_chri',
                    api_error_identifier: 'api_error_identifier'
                });
                oThis.applicationMailer.perform({
                    subject: 'Error: RDSInstanceLogs not available for long time',
                    body: r
                });
                return r;
            }

            //timeout is in milliseconds
            currentTime += timeStep;
            sleep(currentTime * 1000 * 60); // sleep is in minutes

        }
    }




    /**
     * check status of rds instance and send warning mail if not processed within time.
     *
     * @return {responseHelper}
     */
    async checkStatusAndSendWarningMail(currentTime, warningTimeInMinsToWait) {
        const oThis = this;
        let checkRDSStatus = await oThis.restoreDBInstance.checkStatus({dbInstanceIdentifier: oThis.dbInstanceIdentifier});
        if (currentTime == warningTimeInMinsToWait) {
            oThis.applicationMailer.perform({
                subject: 'Warning: RDSInstanceLogs not able to delete since long time',
                body: {}
            });
        }
        return checkRDSStatus;
    }
}

module.exports = CheckRDSInstance;